import { el } from '../../utilities.js';

export default class Header {
  constructor(presenter) {
    this.presenter = presenter;
  }

  render() {
    const header = el('header', {
      className: 'header',
      style: `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        background: white;
        z-index: 1000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.08);
        padding: 12px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `
    });

    header.appendChild(el('h1', { className: 'logo' }, 'Story App'));

    const nav = el('nav', { className: 'nav' });
    const currentHash = window.location.hash;
    const links = [];

    const homeLink = el(
      'a',
      {
        href: '#/home',
        className: this._isActive(currentHash, '#/home') ? 'btn-alt active' : 'btn-alt',
      },
      'Home'
    );
    links.push(homeLink);

    if (this.presenter && this.presenter.token) {
      const addLink = el(
        'a',
        {
          href: '#/add',
          className: this._isActive(currentHash, '#/add') ? 'btn-alt active' : 'btn-alt',
        },
        'Add Story'
      );
      links.push(addLink);

      const archiveLink = el(
        'a',
        {
          href: '#/archive',
          className: this._isActive(currentHash, '#/archive') ? 'btn-alt active' : 'btn-alt',
        },
        'Archive'
      );
      links.push(archiveLink);
    }

    // Inject style hanya sekali
    if (!document.getElementById('header-hover-style')) {
      const style = document.createElement('style');
      style.id = 'header-hover-style';
      style.textContent = `
        body { margin: 0; padding-top: 80px; } /* ✅ Tambahkan padding agar konten tidak ketimpa header */
        .nav { display:flex; align-items:center; gap:8px; }
        .nav .btn-alt {
          color: #333;
          text-decoration: none;
          padding: 8px 14px;
          border-radius: 8px;
          transition: all 0.15s ease-in-out;
          font-weight: 500;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .nav .btn-alt:hover {
          background: rgba(0,0,0,0.05);
        }
        .nav .btn-alt.active {
          background: #2ecc71;
          color: #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
        }
        .nav .btn {
          padding: 8px 12px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          background: #2b6cb0;
          color: white;
          font-weight: 600;
        }
      `;
      document.head.appendChild(style);
    }

    links.forEach((l) => nav.appendChild(l));

    const pushEnabled = localStorage.getItem('pushEnabled') === 'true';
    const pushBtn = el(
      'button',
      {
        id: 'pushToggle',
        className: pushEnabled ? 'btn-alt active' : 'btn-alt',
        title: 'Toggle push notifications',
        style: 'margin-left:8px;',
      },
      pushEnabled ? '🔔 Notifikasi ON' : '🔕 Notifikasi OFF'
    );
    nav.appendChild(pushBtn);

    const statusIndicator = el(
      'span',
      {
        id: 'networkStatus',
        style: `
          margin-left:10px;
          font-size:14px;
          font-weight:500;
          padding: 4px 8px;
          border-radius:6px;
          color:white;
          background: ${navigator.onLine ? '#2ecc71' : '#e74c3c'};
        `,
        role: 'status',
        'aria-live': 'polite'
      },
      navigator.onLine ? 'Online' : 'Offline'
    );
    nav.appendChild(statusIndicator);

    window.addEventListener('online', () => this.updateStatus());
    window.addEventListener('offline', () => this.updateStatus());

    if (this.presenter && this.presenter.token) {
      const logoutBtn = el(
        'button',
        {
          className: 'btn',
          onclick: () => {
            this.presenter.clearSession();
            window.location.hash = '#/login';
          },
        },
        'Logout'
      );
      nav.appendChild(logoutBtn);
    } else {
      const loginLink = el(
        'a',
        {
          href: '#/login',
          className: this._isActive(currentHash, '#/login') ? 'btn-alt active' : 'btn-alt',
        },
        'Login'
      );
      const registerLink = el(
        'a',
        {
          href: '#/register',
          className: this._isActive(currentHash, '#/register') ? 'btn active' : 'btn',
        },
        'Register'
      );
      nav.append(loginLink, registerLink);
    }

    header.appendChild(nav);
    return header;
  }

  _isActive(currentHash, target) {
    return currentHash === target || (target === '#/home' && (currentHash === '' || currentHash === '#/'));
  }

  update() {
    const oldHeader = document.querySelector('header');
    if (!oldHeader || !oldHeader.parentNode) return;
    const newHeader = this.render();
    oldHeader.parentNode.replaceChild(newHeader, oldHeader);
  }

  updateStatus() {
    const elStatus = document.getElementById('networkStatus');
    if (!elStatus) return;
    if (navigator.onLine) {
      elStatus.textContent = 'Online';
      elStatus.style.background = '#2ecc71';
    } else {
      elStatus.textContent = 'Offline';
      elStatus.style.background = '#e74c3c';
    }
  }
}
