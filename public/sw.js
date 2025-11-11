/* public/sw.js
   ⚡ Story App Service Worker (v6)
   - Instant offline navigation (cache-first)
   - Background update + auto reload notification
   - Network-first API with timeout fallback
   - Fix clone/body errors
   - Enable navigation preload
*/

const CACHE_NAME = 'story-app-shell-v6';
const RUNTIME_CACHE = 'story-runtime-v3';
const OSM_TILE_CACHE = 'osm-tiles-v1';
const API_BASE = 'https://story-api.dicoding.dev/v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/checklist.png',
  '/icons/book.png',
  '/app.css'
];

// === INSTALL ===
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// === ACTIVATE ===
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    (async () => {
      // 🧹 Hapus cache lama
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) => {
          if (![CACHE_NAME, RUNTIME_CACHE, OSM_TILE_CACHE].includes(k)) {
            return caches.delete(k);
          }
        })
      );

      // ⚡ Aktifkan Navigation Preload (buat fetch lebih cepat)
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
    })()
  );
  self.clients.claim();
});

// === Helper: Network-first with timeout (for API) ===
async function networkFirstWithTimeout(req, timeout = 2500) {
  const timer = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), timeout)
  );

  try {
    const netRes = await Promise.race([fetch(req), timer]);
    if (netRes && netRes.ok) {
      const clone = netRes.clone();
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, clone);
    }
    return netRes;
  } catch {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: true, message: 'offline' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// === FETCH HANDLER ===
self.addEventListener('fetch', (evt) => {
  const req = evt.request;
  if (req.method !== 'GET') return;

  // 1️⃣ OSM Tiles → cache-first
  if (req.url.includes('tile.openstreetmap.org')) {
    evt.respondWith(
      caches.open(OSM_TILE_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const net = await fetch(req);
          if (net.ok) cache.put(req, net.clone());
          return net;
        } catch {
          const placeholder = await caches.match('/icons/location.png');
          return placeholder || new Response('', { status: 503, statusText: 'Offline' });
        }
      })
    );
    return;
  }

  // 2️⃣ API → network-first with timeout
  if (req.url.startsWith(API_BASE)) {
    evt.respondWith(networkFirstWithTimeout(req, 2500));
    return;
  }

  // 3️⃣ Navigations (HTML) → cache-first + background update + notify clients
  if (req.mode === 'navigate') {
    evt.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match('/index.html');

      const preloadResp = await evt.preloadResponse;
      if (preloadResp) {
        cache.put('/index.html', preloadResp.clone());
        return preloadResp;
      }

      // ⚡ tampilkan cache lama dulu biar cepat
      fetch(req)
        .then((res) => {
          if (res.ok) {
            cache.put('/index.html', res.clone());
            // 🔔 kirim sinyal versi baru
            self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
              for (const client of clients) {
                client.postMessage({ type: 'NEW_VERSION_AVAILABLE' });
              }
            });
          }
        })
        .catch(() => {});
      
      return cached || (await fetch(req).catch(() => new Response('<h1>Offline</h1>', {
        headers: { 'Content-Type': 'text/html' },
      })));
    })());
    return;
  }

  // 4️⃣ Static assets → cache-first
  evt.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (
            res.ok &&
            new URL(req.url).origin === self.location.origin &&
            req.headers.get('accept') &&
            !req.headers.get('accept').includes('text/html')
          ) {
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, res.clone()));
          }
          return res;
        })
        .catch(() => new Response('', { status: 503, statusText: 'Offline' }));
    })
  );
});

// === PUSH HANDLER ===
self.addEventListener('push', (event) => {
  let data = {
    title: 'Story Notification',
    options: {
      body: 'Ada pembaruan story baru!',
      icon: '/icons/checklist.png',
      badge: '/icons/checklist.png',
      vibrate: [200, 100, 200],
      data: { url: '/#/home' },
    },
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data.title = json.title || data.title;
      data.options.body = json.body || data.options.body;
      if (json.icon) data.options.icon = json.icon;
      if (json.url) data.options.data = { url: json.url };
    } catch {
      data.options.body = event.data.text();
    }
  }

  event.waitUntil(self.registration.showNotification(data.title, data.options));
});

// === NOTIFICATION CLICK HANDLER ===
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/#/home';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes('/') && 'focus' in w) {
          w.focus();
          w.postMessage({ type: 'navigate', url: target });
          return;
        }
      }
      return clients.openWindow(target);
    })
  );
});
