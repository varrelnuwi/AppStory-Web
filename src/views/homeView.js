// src/views/homeView.js
import { el } from '../utilities.js';
import {
  createMap,
  addMarker,
  clearMarkers,
  fitMapToMarkers,
  destroyMap
} from '../components/map.js';
import { getAllStories } from '../api.js';
import { storyCard } from './shared/storyCard.js';

export default class HomeView {
  constructor(presenter) {
    this.presenter = presenter;
    this.map = null;
    this.storyContainer = null;
    this.mapContainer = null;
    this.loadingText = null;
  }

  render() {
    const wrapper = el('div', { className: 'home' });

    wrapper.appendChild(el('h1', {}, 'Berbagi Cerita di Sekitar Kamu'));

    // MAP container
    this.mapContainer = el('div', {
      id: 'map',
      style: `
        width:100%;
        height:360px;
        border-radius:8px;
        overflow:hidden;
        margin:10px 0;
      `
    });
    wrapper.appendChild(this.mapContainer);

    wrapper.appendChild(el('h2', {}, 'Stories'));
    this.loadingText = el('p', {}, 'Loading stories...');
    wrapper.appendChild(this.loadingText);

    this.storyContainer = el('div', {
      className: 'stories-grid',
      style: `
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
        gap:14px;
      `
    });
    wrapper.appendChild(this.storyContainer);

    return wrapper;
  }

  async afterRender() {
    try {
      // Pastikan ViewTransition selesai dulu
      await new Promise((resolve) => setTimeout(resolve, 200));

      destroyMap();

      // 🗺️ Buat map baru
      this.map = createMap({
        elementId: 'map',
        center: [-2.5, 118],
        zoom: 5,
      });

      // Pastikan map tampil sempurna
      setTimeout(() => {
        if (this.map?.invalidateSize) this.map.invalidateSize();
      }, 300);

      // Ambil data story dari API
      const res = await getAllStories({
        token: this.presenter?.token,
        location: 1,
      });

      const stories = res.list || res.stories || res.listStory || [];

      if (res.error || !stories.length) {
        this.loadingText.textContent = 'Tidak ada story untuk ditampilkan.';
        return;
      }

      // Bersihkan map & loading text
      this.loadingText.remove();
      clearMarkers();
      this.storyContainer.innerHTML = '';

      // Render semua story ke dalam grid + map marker
      for (const story of stories) {
        const createdAtText = story.createdAt
          ? new Date(story.createdAt).toLocaleString('id-ID')
          : '';

        // Buat card (await, karena storyCard sekarang async)
        const card = await storyCard(
          {
            id: story.id,
            name: story.name,
            description: story.description,
            photoUrl: story.photoUrl,
            createdAtText,
          },
          () => (window.location.hash = `#/detail/${story.id}`),
          { imgFallback: 'https://placehold.co/300x180?text=No+Image' }
        );

        if (card instanceof Node) {
          this.storyContainer.appendChild(card);
        }

        const lat = parseFloat(story.lat);
        const lon = parseFloat(story.lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          addMarker({
            lat,
            lng: lon,
            title: story.name,
            popupHtml: `<b>${story.name}</b><br>${story.description || ''}`,
          });
        }
      }

      fitMapToMarkers();
      setTimeout(() => fitMapToMarkers(), 700);
    } catch (err) {
      console.error('Error loading stories:', err);
      this.loadingText.textContent = 'Gagal memuat data story.';
    }
  }
}
