// src/utilities.js

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);

  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined) continue;

    // raw HTML insert
    if (k === 'html') {
      node.innerHTML = v;
      continue;
    }

    // event handlers: onclick -> addEventListener('click', fn)
    if (k.startsWith('on') && typeof v === 'function') {
      const evtName = k.slice(2).toLowerCase();
      node.addEventListener(evtName, v);
      continue;
    }

    // common property mappings
    if (k === 'class' || k === 'className') {
      node.className = v;
      continue;
    }

    if (k === 'style') {
      // accept string or object
      if (typeof v === 'string') node.style.cssText = v;
      else if (typeof v === 'object') {
        Object.assign(node.style, v);
      }
      continue;
    }

    if (k === 'for' || k === 'htmlFor') {
      node.htmlFor = v;
      continue;
    }

    // boolean attributes (disabled, readonly, required)
    if (typeof v === 'boolean') {
      if (v) node.setAttribute(k, '');
      else node.removeAttribute(k);
      continue;
    }

    // id and data-* and aria-* should be set directly
    if (k === 'id' || k.startsWith('data-') || k.startsWith('aria-')) {
      node.setAttribute(k, String(v));
      continue;
    }

    // fallback: set as attribute
    node.setAttribute(k, String(v));
  }

  // children handling
  if (!Array.isArray(children)) children = [children];
  children.forEach(c => {
    if (c === null || c === undefined) return;
    if (typeof c === 'string' || typeof c === 'number') node.appendChild(document.createTextNode(String(c)));
    else if (c instanceof Node) node.appendChild(c);
    else {
      // allow passing object returned by el() as first arg directly
      try {
        node.appendChild(c);
      } catch (e) {
        // ignore invalid child
        console.warn('utilities.el: invalid child', c);
      }
    }
  });

  return node;
}

export function setView(container, node) {
  if (!(node instanceof Element)) {
    console.error('setView: Node bukan elemen DOM yang valid!');
    return;
  }

  const replace = () => {
    container.innerHTML = '';
    node.classList.add('view-transition-enter');
    container.appendChild(node);
  };

  if (document.startViewTransition) {
    try {
      const maybePromise = document.startViewTransition(() => {
        replace();
      });
      // if it returns a promise, wait it to finish
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.catch(() => {
          // fallback to immediate replace on failure
          replace();
        });
      }
    } catch (err) {
      replace();
    }
  } else {
    // fallback animation path (CSS based)
    replace();
  }

  // Aksesibilitas — fokus elemen penting agar keyboard users langsung ke konten
  // Use setTimeout/requestAnimationFrame so focus occurs after paint
  requestAnimationFrame(() => {
    const focusTarget = container.querySelector('h1, h2, main, input, textarea, button, [tabindex]');
    if (focusTarget && typeof focusTarget.focus === 'function') {
      focusTarget.focus();
    }
  });
}
