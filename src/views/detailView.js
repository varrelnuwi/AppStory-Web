// src/views/detailView.js
import { el } from '../utilities.js';
import { createMap, addMarker, destroyMap } from '../components/map.js';
import { getDetail } from '../api.js';
import { addArchive, removeArchive, isArchived } from '../utils/db.js';

// format tanggal Indonesia
function formatIndonesiaDatetime(isoString) {
  try {
    const d = new Date(isoString);
    if (isNaN(d)) return '-';
    const datePart = d.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    const timePart = d.toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit'
    });
    return `${datePart}, ${timePart}`;
  } catch {
    return '-';
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
    popupAnchor: [0, -32]
  });
}

export default class DetailView {
  constructor(presenter, id) {
    this.presenter = presenter;
    this.id = id;
    this.icon = createGreenPinIcon();
  }

  async render() {
    const section = el('section', { className: 'detail' });
    section.appendChild(el('h2', {}, 'Story Detail'));
    const loading = el('p', {}, 'Loading story...');
    section.appendChild(loading);

    try {
      const data = await getDetail({ id: this.id, token: this.presenter?.token });
      if (!data || data.error || !data.story) throw new Error('Story tidak ditemukan');

      section.innerHTML = '';
      const story = data.story;
      const createdAtText = formatIndonesiaDatetime(story.createdAt);

      const img = el('img', {
        src: story.photoUrl || '',
        alt: story.name || 'Story image',
        style: 'width:100%;max-height:400px;object-fit:cover;border-radius:8px;'
      });
      section.appendChild(img);

      const infoWrap = el('div', { style: 'padding:12px 0;' });
      infoWrap.appendChild(el('h3', { style: 'margin:0 0 8px;' }, story.description || '-'));
      infoWrap.appendChild(el('p', { style: 'margin:4px 0;color:#555;' }, `👤 Oleh: ${story.name || 'Anonim'}`));
      infoWrap.appendChild(el('p', { style: 'margin:4px 0;color:#666;font-size:14px;' }, `🕒 ${createdAtText}`));
      section.appendChild(infoWrap);

      // tombol aksi
      const actionWrap = el('div', { style: 'margin:12px 0;display:flex;gap:8px;flex-wrap:wrap;' });

      // tombol edit (navigasi ke add story)
      const editBtn = el('button', {
        className: 'btn-alt',
        onclick: () => alert('Fitur edit story dapat kamu kembangkan di submission lanjutan!')
      }, '✏️ Edit');

      // tombol archive
      const archiveBtn = el('button', { className: 'btn' }, '📦 Archive');
      const unarchiveBtn = el('button', { className: 'btn' }, '🗃 Unarchive');

      // tombol delete
      const delBtn = el('button', {
        className: 'btn-danger',
        onclick: () => {
          if (confirm('Yakin ingin menghapus story ini dari arsip lokal?')) {
            removeArchive(story.id);
            alert('Story dihapus dari arsip.');
            window.location.hash = '#/home';
          }
        }
      }, '🗑 Delete');

      const archived = await isArchived(story.id);
      if (archived) {
        actionWrap.appendChild(unarchiveBtn);
      } else {
        actionWrap.appendChild(archiveBtn);
      }
      actionWrap.appendChild(editBtn);
      actionWrap.appendChild(delBtn);
      section.appendChild(actionWrap);

      // map
      const mapDiv = el('div', {
        id: 'detail-map',
        style: 'width:100%;height:300px;margin-top:16px;border-radius:8px;overflow:hidden;'
      });
      section.appendChild(mapDiv);

      const backBtn = el('button', {
        className: 'btn',
        style: 'margin-top:16px;',
        onclick: () => { window.location.hash = '#/home'; }
      }, '← Back to Home');
      section.appendChild(backBtn);

      // event archive toggle
      archiveBtn.onclick = async () => {
        await addArchive(story);
        alert('Story berhasil diarsipkan!');
        window.location.hash = '#/archive';
      };
      unarchiveBtn.onclick = async () => {
        await removeArchive(story.id);
        alert('Story dikeluarkan dari arsip.');
        window.location.reload();
      };

      setTimeout(() => this.initMap(story), 250);
    } catch (e) {
      console.error(e);
      section.innerHTML = '';
      section.appendChild(el('p', {}, 'Story tidak ditemukan atau terjadi kesalahan.'));
    }

    return section;
  }

  initMap(story) {
    destroyMap();

    const lat = Number(story.lat);
    const lng = Number(story.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const map = createMap({
      elementId: 'detail-map',
      center: [lat, lng],
      zoom: 12
    });
    if (!map) return;

    const marker = addMarker({
      lat,
      lng,
      popupHtml: `<strong>${story.name || 'Story'}</strong>`
    });
    if (marker && this.icon && typeof marker.setIcon === 'function') {
      marker.setIcon(this.icon);
    }

    setTimeout(() => {
      try { map.invalidateSize(); } catch {}
    }, 400);
  }
}
