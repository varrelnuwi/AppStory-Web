import { el } from '../utilities.js';
import { createMap, addMarker, destroyMap } from '../components/map.js';
import { getDetail } from '../api.js';
import { addArchive, removeArchive, isArchived, updateArchive } from '../utils/db.js';

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
      const descEl = el('h3', { style: 'margin:0 0 8px;' }, story.description || '-');
      const nameEl = el('p', { style: 'margin:4px 0;color:#555;' }, `👤 Oleh: ${story.name || 'Anonim'}`);
      const timeEl = el('p', { style: 'margin:4px 0;color:#666;font-size:14px;' }, `🕒 ${createdAtText}`);
      infoWrap.append(descEl, nameEl, timeEl);
      section.appendChild(infoWrap);

      // tombol aksi
      const actionWrap = el('div', { style: 'margin:12px 0;display:flex;gap:8px;flex-wrap:wrap;' });

      // tombol edit
      const editBtn = el('button', { className: 'btn-alt' }, '✏️ Edit');

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
      if (archived) actionWrap.appendChild(unarchiveBtn);
      else actionWrap.appendChild(archiveBtn);
      actionWrap.append(editBtn, delBtn);
      section.appendChild(actionWrap);

      // elemen form edit (disembunyikan dulu)
      const editWrap = el('div', {
        style: 'display:none;margin-top:12px;border:1px solid #ddd;padding:12px;border-radius:8px;'
      });

      const nameInput = el('input', {
        type: 'text',
        value: story.name || '',
        placeholder: 'Nama pengirim',
        style: 'width:100%;padding:6px;margin-bottom:8px;border-radius:4px;border:1px solid #ccc;'
      });
      const descInput = el('textarea', {
        placeholder: 'Deskripsi cerita',
        style: 'width:100%;height:80px;padding:6px;margin-bottom:8px;border-radius:4px;border:1px solid #ccc;'
      }, story.description || '');
      const latInput = el('input', {
        type: 'text',
        value: story.lat || '',
        placeholder: 'Latitude',
        style: 'width:49%;margin-right:2%;padding:6px;border-radius:4px;border:1px solid #ccc;'
      });
      const lonInput = el('input', {
        type: 'text',
        value: story.lon || '',
        placeholder: 'Longitude',
        style: 'width:49%;padding:6px;border-radius:4px;border:1px solid #ccc;'
      });
      const saveBtn = el('button', {
        className: 'btn',
        style: 'margin-right:8px;'
      }, '💾 Simpan');
      const cancelBtn = el('button', { className: 'btn-alt' }, '❌ Batal');

      editWrap.append(nameInput, descInput, el('div', {}, [latInput, lonInput]), saveBtn, cancelBtn);
      section.appendChild(editWrap);

      // event edit
      editBtn.onclick = () => {
        infoWrap.style.display = 'none';
        editWrap.style.display = 'block';
      };

      // event batal
      cancelBtn.onclick = () => {
        editWrap.style.display = 'none';
        infoWrap.style.display = 'block';
      };

      // event simpan
      saveBtn.onclick = async () => {
        story.name = nameInput.value.trim();
        story.description = descInput.value.trim();
        story.lat = latInput.value.trim();
        story.lon = lonInput.value.trim();

        await updateArchive(story); // simpan ke IndexedDB
        descEl.textContent = story.description || '-';
        nameEl.textContent = `👤 Oleh: ${story.name || 'Anonim'}`;

        editWrap.style.display = 'none';
        infoWrap.style.display = 'block';
        alert('✅ Story berhasil diperbarui!');
      };

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
