// src/utils/db.js
const DB_NAME = 'storyAppDB';
const DB_VERSION = 1;
const STORE_ARCHIVE = 'archives';

// buka/upgrade database
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_ARCHIVE)) {
        db.createObjectStore(STORE_ARCHIVE, { keyPath: 'id' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// simpan story ke arsip
export async function addArchive(story) {
  if (!story || !story.id) return; // ✅ validasi
  const db = await openDB();
  const tx = db.transaction(STORE_ARCHIVE, 'readwrite');
  tx.objectStore(STORE_ARCHIVE).put(story);
  return tx.done;
}

// hapus story dari arsip
export async function removeArchive(id) {
  if (!id) return; // ✅ validasi
  const db = await openDB();
  const tx = db.transaction(STORE_ARCHIVE, 'readwrite');
  tx.objectStore(STORE_ARCHIVE).delete(id);
  return tx.done;
}

// ambil semua arsip
export async function getAllArchives() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ARCHIVE, 'readonly');
    const store = tx.objectStore(STORE_ARCHIVE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// cek apakah story diarsip
export async function isArchived(id) {
  if (!id) return false; // ✅ hindari DataError
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_ARCHIVE, 'readonly');
    const store = tx.objectStore(STORE_ARCHIVE);
    const req = store.get(id);
    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => resolve(false);
  });
}
