// src/views/archiveView.js
import { getAllArchives } from '../utils/db.js';
import { storyCard } from './shared/storyCard.js';

export default class ArchiveView {
  constructor(presenter) {
    this.presenter = presenter;
  }

  async render() {
    return `
      <section class="archive-page">
        <h1>Archived Stories</h1>
        <div id="archiveList" class="story-grid"></div>
      </section>
    `;
  }

  async afterRender() {
    // beri waktu render selesai agar #archiveList sudah ada di DOM
    await new Promise((resolve) => setTimeout(resolve, 200));

    const container = document.getElementById('archiveList');
    if (!container) {
      console.warn('⚠️ Elemen #archiveList belum ditemukan di DOM');
      return;
    }

    const stories = await getAllArchives();

    container.innerHTML = '';
    if (!stories.length) {
      container.innerHTML = '<p>Tidak ada story yang diarsipkan.</p>';
      return;
    }

    for (const story of stories) {
      try {
        const card = await storyCard(
          story,
          () => (location.hash = `#/detail/${story.id}`),
          { descriptionStyle: '-webkit-line-clamp:2;' }
        );

        if (card instanceof Node) container.appendChild(card);
        else console.warn('⚠️ storyCard tidak menghasilkan Node yang valid:', story);
      } catch (err) {
        console.error('❌ Gagal render storyCard:', err, story);
      }
    }
  }
}
