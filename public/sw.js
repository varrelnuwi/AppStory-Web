// src/sw.js
const CACHE_NAME = 'story-app-v4';
const API_BASE = 'https://story-api.dicoding.dev/v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/checklist.png',
  '/icons/book.png',
  '/src/app.js',
  '/src/app.css'
];

// names for runtime caches
const RUNTIME_CACHE = 'story-runtime-v1';
const OSM_TILE_CACHE = 'osm-tiles-v1';

// Install - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate - cleanup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key !== CACHE_NAME && key !== RUNTIME_CACHE && key !== OSM_TILE_CACHE) ? caches.delete(key) : Promise.resolve()))
    )
  );
  self.clients.claim();
});

// Fetch - various strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1) OSM tile runtime caching (cache-first with network fallback then placeholder)
  if (request.url.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(OSM_TILE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const networkResp = await fetch(request);
          // only cache valid images
          if (networkResp && networkResp.status === 200) {
            cache.put(request, networkResp.clone());
          }
          return networkResp;
        } catch (e) {
          // fallback to placeholder tile if exists
          const fallback = await caches.match('/icons/location.png');
          return fallback || new Response('', { status: 503, statusText: 'Offline' });
        }
      })
    );
    return;
  }

  // 2) API requests - network-first, fallback to cache (so previously fetched API results available offline)
  if (request.url.startsWith(API_BASE)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // clone into runtime cache for later offline use
          const resClone = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, resClone));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || new Response(JSON.stringify({ error: true, message: 'offline' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // 3) Static assets - cache-first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).catch(() => {
      // fallback to index.html for navigation requests (SPA)
      if (request.mode === 'navigate') return caches.match('/index.html');
      return new Response('', { status: 503, statusText: 'Offline' });
    }))
  );
});

// Push Notification
self.addEventListener('push', (event) => {
  let data = {
    title: 'Story Notification',
    options: {
      body: 'Ada pembaruan story baru!',
      icon: '/icons/checklist.png',
      badge: '/icons/badge_notif.png',
      vibrate: [200, 100, 200],
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

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/#/home';
  event.waitUntil(clients.openWindow(targetUrl));
});

// Background sync for offline stories (if used)
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-new-story') {
    event.waitUntil(syncOfflineStories());
  }
});

async function syncOfflineStories() {
  const db = await openDB();
  const tx = db.transaction('offline-stories', 'readonly');
  // using idb via modern browsers' .objectStore api not available here as helper library
  // this function assumes the objectStore exists with keyPath 'id'
  const store = tx.objectStore ? tx.objectStore('offline-stories') : null;
  // Fallback: try to read via cursor (older handling)
  // If store is not accessible, simply return
  if (!store) return;
  const allReq = store.getAll ? store.getAll() : null;
  if (!allReq) return;
  const stories = await new Promise((res) => {
    allReq.onsuccess = () => res(allReq.result || []);
    allReq.onerror = () => res([]);
  });

  for (const story of stories) {
    try {
      await fetch(`${API_BASE}/stories`, {
        method: 'POST',
        body: JSON.stringify(story),
        headers: { 'Content-Type': 'application/json' }
      });
      const delTx = db.transaction('offline-stories', 'readwrite');
      delTx.objectStore('offline-stories').delete(story.id);
    } catch (err) {
      console.error('Sync failed:', err);
    }
  }
}

// simple IndexedDB open (used by syncOfflineStories)
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('story-app-db', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('offline-stories')) {
        db.createObjectStore('offline-stories', { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}
