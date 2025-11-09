// src/views/addStoryView.js
import { el } from '../utilities.js';
import { createMap, addMarker, clearMarkers } from '../components/map.js';
import { addStory, addGuestStory } from '../api.js';

// 🔹 Helper IndexedDB sederhana
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

async function saveOfflineStory(story) {
  try {
    const db = await openDB();
    const tx = db.transaction('offline-stories', 'readwrite');
    tx.objectStore('offline-stories').put(story);
    await tx.done;
    console.log('✅ Story tersimpan ke IndexedDB:', story);
  } catch (err) {
    console.warn('Gagal simpan ke IndexedDB:', err);
  }
}

function createGreenPinIcon() {
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.686 2 6 4.686 6 8c0 4.418 6 12 6 12s6-7.582 6-12c0-3.314-2.686-6-6-6z" fill="#2ecc71"/>
      <circle cx="12" cy="8" r="2.5" fill="#fff"/>
    </svg>
  `);
  return L.icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${svg}`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -32],
    className: 'custom-green-pin',
  });
}

export default class AddStoryView {
  constructor(presenter) {
    this.presenter = presenter;
    this.map = null;
    this.marker = null;
    this.chosen = { lat: null, lon: null };
    this.form = null;
    this.stream = null;
  }

  render() {
    const wrapper = el('div', { className: 'add-story-wrapper' });
    wrapper.appendChild(el('h1', {}, 'Tambah Story'));

    const form = el('form', { className: 'form', id: 'addStoryForm' });

    // Deskripsi
    form.appendChild(el('label', { className: 'label', for: 'description' }, 'Deskripsi'));
    const textarea = el('textarea', {
      id: 'description',
      name: 'description',
      required: true,
      placeholder: 'Ceritakan sesuatu...',
    });
    form.appendChild(textarea);

    // Upload foto
    form.appendChild(el('label', { className: 'label' }, 'Foto (maks 1MB)'));
    const fileInput = el('input', {
      id: 'photo',
      name: 'photo',
      type: 'file',
      accept: 'image/*',
    });
    form.appendChild(fileInput);

    // Tombol kamera
    const camBtn = el('button', { type: 'button', className: 'btn-alt' }, 'Ambil dari Kamera');
    camBtn.addEventListener('click', () => this.openCamera(fileInput));
    form.appendChild(camBtn);

    // Map
    form.appendChild(el('label', { className: 'label' }, 'Pilih lokasi pada peta (opsional)'));
    const mapDiv = el('div', {
      id: 'map-add',
      style: 'width:100%;height:350px;margin-top:12px;border-radius:8px;overflow:hidden;',
    });
    form.appendChild(mapDiv);

    // Info koordinat
    this.coordsBox = el('div', { className: 'small' }, 'Belum memilih titik.');
    form.appendChild(this.coordsBox);

    // Tombol kirim
    const submitBtn = el('button', { className: 'btn', type: 'submit' }, 'Kirim Story');
    form.appendChild(submitBtn);

    // Tombol guest
    const guestBtn = el('button', { type: 'button', className: 'btn-alt' }, 'Kirim sebagai Guest');
    guestBtn.addEventListener('click', () => this.submitGuest(form));
    form.appendChild(guestBtn);

    form.addEventListener('submit', (e) => this.onSubmit(e));
    wrapper.appendChild(form);
    this.form = form;

    return wrapper;
  }

  async afterRender() {
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const mapDiv = document.getElementById('map-add');
    if (!mapDiv) return;

    this.map = createMap({
      elementId: 'map-add',
      center: [-2.5, 118],
      zoom: 5,
    });

    if (this.map) {
      this.map.on('click', (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        clearMarkers();
        const marker = addMarker({
          lat,
          lng,
          popupHtml: `Lokasi Story<br>Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`,
        });

        const icon = createGreenPinIcon();
        if (marker && icon) marker.setIcon(icon);

        this.marker = marker;
        this.chosen.lat = lat;
        this.chosen.lon = lng;
        this.coordsBox.textContent = `📍 Lat: ${lat.toFixed(6)}, Lon: ${lng.toFixed(6)}`;
      });
    }
  }

  async onSubmit(e) {
    e.preventDefault();
    if (!this.presenter.token)
      return alert('Anda harus login untuk mengirim story sebagai user terautentikasi.');

    const form = this.form;
    if (!form) return;

    const file = form.photo.files[0];
    if (file && file.size > 1024 * 1024) return alert('File terlalu besar (maks 1MB).');

    const description = form.description.value.trim();
    if (!description) return alert('Deskripsi tidak boleh kosong.');

    try {
      const payload = {
        token: this.presenter.token,
        description,
        file,
      };

      if (typeof this.chosen.lat === 'number' && typeof this.chosen.lon === 'number') {
        payload.lat = this.chosen.lat;
        payload.lon = this.chosen.lon;
      }

      const res = await addStory(payload);

      if (!res.error) {
        alert('Story berhasil dikirim!');
        location.hash = '#/home';
      } else {
        throw new Error(res.message || 'Gagal mengirim story');
      }
    } catch (err) {
      console.error('Story gagal dikirim:', err);

      // 🔹 Simpan offline jika gagal kirim
      const offlineStory = {
        id: Date.now(),
        description: this.form.description.value.trim(),
        lat: this.chosen.lat,
        lon: this.chosen.lon,
        createdAt: new Date().toISOString(),
      };
      await saveOfflineStory(offlineStory);

      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const reg = await navigator.serviceWorker.ready;
        await reg.sync.register('sync-new-story');
        alert('📦 Story disimpan offline & akan dikirim otomatis saat online.');
      } else {
        alert('Story disimpan offline (tanpa background sync).');
      }
    } finally {
      this.closeCamera();
    }
  }

  async submitGuest(form) {
    const file = form.photo.files[0];
    if (file && file.size > 1024 * 1024) return alert('File terlalu besar (maks 1MB).');

    const description = form.description.value.trim();
    if (!description) return alert('Deskripsi tidak boleh kosong.');

    try {
      const payload = { description, file };
      if (typeof this.chosen.lat === 'number' && typeof this.chosen.lon === 'number') {
        payload.lat = this.chosen.lat;
        payload.lon = this.chosen.lon;
      }

      const res = await addGuestStory(payload);

      if (!res.error) {
        alert('Guest story berhasil dikirim!');
        location.hash = '#/home';
      } else {
        alert('Gagal: ' + (res.message || 'Terjadi kesalahan.'));
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat mengirim story guest.');
    } finally {
      this.closeCamera();
    }
  }

  async openCamera(fileInput) {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
        return alert('Kamera tidak didukung.');

      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });

      const video = document.createElement('video');
      video.autoplay = true;
      video.srcObject = this.stream;
      video.style.maxWidth = '100%';

      const captureBtn = document.createElement('button');
      captureBtn.className = 'btn';
      captureBtn.textContent = 'Ambil Foto';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn-alt';
      cancelBtn.textContent = 'Tutup Kamera';
      cancelBtn.style.marginLeft = '10px';
      cancelBtn.addEventListener('click', () => {
        container.remove();
        this.closeCamera();
      });

      const container = document.createElement('div');
      container.className = 'card';
      container.style.padding = '10px';
      container.append(video, captureBtn, cancelBtn);
      document.getElementById('main').prepend(container);

      captureBtn.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(
          (blob) => {
            const file = new File([blob], 'camera-photo.png', { type: 'image/png' });
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInput.files = dt.files;
            alert('Foto tersimpan di input file.');
            container.remove();
            this.closeCamera();
          },
          'image/png',
          0.95
        );
      });
    } catch (e) {
      console.error(e);
      alert('Tidak dapat akses kamera: ' + e.message);
    }
  }

  closeCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }
}
