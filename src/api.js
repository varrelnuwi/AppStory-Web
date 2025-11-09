// src/api.js
const BASE = 'https://story-api.dicoding.dev/v1';

// ✅ Register user
export async function register({ name, email, password }) {
  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
}

// ✅ Login user
export async function login({ email, password }) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

// ✅ Ambil semua story — network first + fallback offline + public fallback jika 401
export async function getAllStories({ token, page = 1, size = 20, location = 0 } = {}) {
  const url = new URL(`${BASE}/stories`);
  url.searchParams.set('page', page);
  url.searchParams.set('size', size);
  url.searchParams.set('location', location);

  try {
    const res = await fetch(url.toString(), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    // ⚠️ Jika token tidak valid, coba ulang tanpa token
    if (res.status === 401) {
      console.warn('⚠️ Unauthorized, fetching public stories instead...');
      const publicRes = await fetch(url.toString());
      return await publicRes.json();
    }

    // ✅ Normal case
    const data = await res.json().catch(() => null);
    return data || { error: true, message: 'Invalid JSON from server' };
  } catch (err) {
    console.warn('🌐 Network error, trying cache...', err);
    try {
      if ('caches' in window) {
        const cached = await caches.match(url.toString());
        if (cached) {
          const cachedJson = await cached.json().catch(() => null);
          if (cachedJson) {
            return { ...cachedJson, offline: true, cached: true };
          }
        }
      }
    } catch (cacheErr) {
      console.warn('Cache fallback failed:', cacheErr);
    }
    return { error: true, message: 'Network error and no cache available' };
  }
}

// ✅ Detail story (token opsional)
export async function getDetail({ id, token }) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${BASE}/stories/${id}`, { headers });
  return res.json();
}

// alias agar kompatibel dengan import lama
export async function getDetailStory(id, token) {
  return getDetail({ id, token });
}

// ✅ Tambah story
export async function addStory({ token, description, file, lat, lon }) {
  const form = new FormData();
  form.append('description', description);
  if (file) form.append('photo', file);
  if (lat !== undefined) form.append('lat', String(lat));
  if (lon !== undefined) form.append('lon', String(lon));

  const res = await fetch(`${BASE}/stories`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form, // biarkan browser set boundary multipart
  });
  return res.json();
}

// ✅ Tambah story guest (tanpa login)
export async function addGuestStory({ description, file, lat, lon }) {
  const form = new FormData();
  form.append('description', description);
  if (file) form.append('photo', file);
  if (lat !== undefined) form.append('lat', String(lat));
  if (lon !== undefined) form.append('lon', String(lon));

  const res = await fetch(`${BASE}/stories/guest`, {
    method: 'POST',
    body: form,
  });
  return res.json();
}

// ✅ Push notification
export async function subscribePush({ token, subscription }) {
  const keys = subscription.getKey
    ? {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth')),
      }
    : {};

  const body = {
    endpoint: subscription.endpoint,
    keys,
  };

  const res = await fetch(`${BASE}/notifications/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ✅ Hapus langganan push
export async function unsubscribePush({ token, endpoint }) {
  const res = await fetch(`${BASE}/notifications/subscribe`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint }),
  });
  return res.json();
}

// helper base64
function arrayBufferToBase64(buffer) {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
