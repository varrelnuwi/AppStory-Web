// src/views/shared/storyCard.js
import { el } from '../../utilities.js';
import { isArchived } from '../../utils/db.js';

export async function storyCard(story, onClick, options = {}) {
  const {
    descriptionStyle = '',
    imgFallback = '',
  } = options;

  const card = el('article', {
    className: 'card',
    style: `
      cursor: pointer;
      transition: transform .2s ease, box-shadow .2s ease;
      position:relative;
    `
  });

  card.onmouseover = () => {
    card.style.transform = 'translateY(-4px)';
    card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
  };
  card.onmouseout = () => {
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = 'none';
  };

  const img = el('img', {
    src: story.photoUrl || imgFallback,
    alt: story.name || 'story',
    style: 'width:100%;height:180px;object-fit:cover;border-radius:6px 6px 0 0;'
  });
  img.onerror = () => {
    if (imgFallback) img.src = imgFallback;
  };
  card.appendChild(img);

  const content = el('div', { style: 'padding: 10px;' });
  content.appendChild(
    el('h3', { style: 'margin:0 0 6px;font-size:18px;' }, story.name || 'No Title')
  );
  const desc = el(
    'p',
    {
      style: `
        margin: 0 0 8px;
        color: #555;
        font-size: 14px;
        line-height: 1.4;
        ${descriptionStyle}
      `
    },
    story.description || '-'
  );
  content.appendChild(desc);
  content.appendChild(
    el('p', { style: 'margin:0;font-size:12px;color:#666;' },
      story.createdAtText ? `📅 ${story.createdAtText}` : '')
  );
  card.appendChild(content);

  // label archive (async check)
  const archived = await isArchived(story.id);
  if (archived) {
    const badge = el('span', {
      style: `
        position:absolute;
        top:8px;right:8px;
        background:#2ecc71;
        color:#fff;
        padding:2px 6px;
        font-size:12px;
        border-radius:4px;
      `
    }, '📦 Archived');
    card.appendChild(badge);
  }

  if (typeof onClick === 'function') {
    card.addEventListener('click', onClick);
    card.addEventListener('keypress', e => {
      if (e.key === 'Enter' || e.key === ' ') onClick();
    });
  }

  return card;
}
