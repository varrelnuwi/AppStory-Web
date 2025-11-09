// src/views/shared/header.js
import { el } from '../../utilities.js';

export default class Header {
  constructor(presenter) {
    this.presenter = presenter;
  }

  render() {
    const header = el('header', { className: 'header' });

    // Logo
    const logo = el('h1', { className: 'logo' }, 'Story App');
    header.appendChild(logo);

    const nav = el('nav', { className: 'nav' });

    // Home selalu tampil
    const homeLink = el('a', { href: '#/home', className: 'btn-alt' }, 'Home');
    nav.appendChild(homeLink);

    // Archive link
    const archiveLink = el('a', { href: '#/archive', className: 'btn-alt' }, 'Archive');
    nav.appendChild(archiveLink);

    // Tombol push toggle
    const pushBtn = el('button', {
      id: 'pushToggle',
      className: 'btn-alt',
      style: 'margin-left:8px;'
    }, 'Enable Notifications');
    nav.appendChild(pushBtn);

    // Status online/offline
    const statusIndicator = el('span', {
      id: 'networkStatus',
      style: `
        margin-left:10px;
        font-size:14px;
        font-weight:500;
        color:green;
      `
    }, '🟢 Online');
    nav.appendChild(statusIndicator);

    if (this.presenter && this.presenter.token) {
      // Jika sudah login
      const addLink = el('a', { href: '#/add', className: 'btn-alt' }, 'Add Story');
      nav.appendChild(addLink);

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
      // Jika belum login
      const loginLink = el('a', { href: '#/login', className: 'btn-alt' }, 'Login');
      const registerLink = el('a', { href: '#/register', className: 'btn' }, 'Register');

      nav.appendChild(loginLink);
      nav.appendChild(registerLink);
    }

    header.appendChild(nav);
    return header;
  }

  update() {
    const oldHeader = document.querySelector('header');
    if (!oldHeader || !oldHeader.parentNode) return;

    const newHeader = this.render();
    oldHeader.parentNode.replaceChild(newHeader, oldHeader);
  }
}
