// src/presenter/appPresenter.js
import Header from '../views/shared/header.js';
import HomeView from '../views/homeView.js';
import LoginView from '../views/loginView.js';
import RegisterView from '../views/registerView.js';
import AddStoryView from '../views/addStoryView.js';
import DetailView from '../views/detailView.js';
import ArchiveView from '../views/archiveView.js';

export default class AppPresenter {
  constructor(container) {
    this.container = container;

    this.token = localStorage.getItem('token');
    this.userId = localStorage.getItem('userId');
    this.name = localStorage.getItem('name');

    this.init();
  }

  init() {
    const root = document.getElementById('app');
    root.innerHTML = '';

    this.header = new Header(this);
    // header.render returns an Element
    root.appendChild(this.header.render(this));

    this.main = document.createElement('main');
    this.main.id = 'main';
    this.main.className = 'container';
    root.appendChild(this.main);

    this.handleRoute(window.location.hash);

    window.addEventListener('hashchange', () => {
      this.handleRoute(window.location.hash);
    });
  }

  /**
   * setView: replace current main content with new view element.
   * - Uses document.startViewTransition (if available) to get native view transitions.
   * - Ensures we wait for a paint (via requestAnimationFrame) before returning,
   *   so afterRender() can safely query DOM (e.g. init Leaflet maps).
   */
  async setView(container, newViewEl) {
    const doReplace = () => {
      if (container.firstElementChild) {
        container.removeChild(container.firstElementChild);
      }
      container.appendChild(newViewEl);
    };

    if (document.startViewTransition) {
      try {
        const maybePromise = document.startViewTransition(() => {
          doReplace();
        });
        if (maybePromise && typeof maybePromise.then === 'function') {
          await maybePromise;
        }
      } catch (err) {
        doReplace();
      }
    } else {
      doReplace();
    }

    // ensure browser has painted the new content
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  async loadAndRenderView(viewInstance) {
    const result = await viewInstance.render();

    // support both: render() returns string OR Node
    let viewEl;
    if (typeof result === 'string') {
      const temp = document.createElement('div');
      temp.innerHTML = result;
      viewEl = temp.firstElementChild;
    } else if (result instanceof Node) {
      viewEl = result;
    } else {
      throw new Error('Unsupported view render return type');
    }

    // swap into DOM and wait for paint
    await this.setView(this.main, viewEl);

    // AFTER the view element is appended to DOM and painted, call afterRender
    if (viewInstance.afterRender) {
      await viewInstance.afterRender();
    }
  }

  async handleRoute(path) {
    switch (path) {
      case '':
      case '#/':
      case '#/home':
        await this.loadAndRenderView(new HomeView(this));
        break;
      case '#/login':
        await this.loadAndRenderView(new LoginView(this));
        break;
      case '#/register':
        await this.loadAndRenderView(new RegisterView(this));
        break;
      case '#/add':
        await this.loadAndRenderView(new AddStoryView(this));
        break;
      case '#/archive':
        await this.loadAndRenderView(new ArchiveView(this));
        break;
      default:
        if (path.startsWith('#/detail/')) {
          const id = path.split('/')[2];
          await this.loadAndRenderView(new DetailView(this, id));
        } else {
          await this.loadAndRenderView(new HomeView(this));
        }
    }
  }

  setSession({ token, userId, name }) {
    this.token = token;
    this.userId = userId;
    this.name = name;

    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('name', name);

    this.header.update(this);

    location.hash = '#/home';
  }

  clearSession() {
    this.token = null;
    this.userId = null;
    this.name = null;

    localStorage.clear();
    this.header.update(this);
  }
}
