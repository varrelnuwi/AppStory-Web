// src/router.js
import HomeView from './views/homeView.js';
import AddStoryView from './views/addStoryView.js';
import DetailView from './views/detailView.js';
import ArchiveView from './views/archiveView.js';
import LoginView from './views/loginView.js';
import RegisterView from './views/registerView.js';

// Router mapping
const routes = {
  '/': HomeView,
  '/home': HomeView,
  '/add': AddStoryView,
  '/archive': ArchiveView,
  '/login': LoginView,
  '/register': RegisterView,
};

const Router = {
  parseActiveUrl() {
    // Hilangkan `#/`
    const raw = window.location.hash.slice(2).toLowerCase() || 'home';
    return raw;
  },

  async renderPage(presenter) {
    const root = document.getElementById('main');
    if (!root) return;

    const url = this.parseActiveUrl();

    // route dynamic detail
    if (url.startsWith('detail/')) {
      const id = url.split('/')[1];
      const page = new DetailView(presenter, id);
      const view = await page.render();
      root.innerHTML = '';
      root.appendChild(view);
      if (page.afterRender) await page.afterRender();
      return;
    }

    const PageClass = routes[`/${url}`] || HomeView;
    const page = new PageClass(presenter);
    const view = await page.render();

    // render DOM
    root.innerHTML = '';
    root.appendChild(view);

    if (page.afterRender) await page.afterRender();
  },
};

export default Router;
