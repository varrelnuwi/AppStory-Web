// src/views/loginView.js
import { login } from '../api.js';

class LoginView {
  constructor(presenter) {
    this.presenter = presenter;
  }

  async render() {
    return `
    <section class="auth-page login-page" tabindex="-1">
      <h1>Login</h1>
      <form id="loginForm" class="form" novalidate>
        <label class="label" for="email">Email</label>
        <input id="email" name="email" class="input" type="email" required>

        <label class="label" for="password">Password</label>
        <input id="password" name="password" class="input" type="password" minlength="8" required>

        <button class="btn" type="submit" id="loginBtn">Login</button>
        <p>Belum punya akun? <a href="#/register">Daftar di sini</a></p>
      </form>
    </section>
    `;
  }

  async afterRender() {
    // pastikan DOM sudah ter-paint sebelum query elemen
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));

    // cari form *di dalam* main untuk mengurangi risiko clash id
    const main = document.getElementById('main');
    const form = main ? main.querySelector('#loginForm') : document.getElementById('loginForm');

    if (!form) {
      // fallback: jika tetap tidak ditemukan, log dan hentikan (agar tidak melempar error)
      console.warn('LoginView.afterRender: form #loginForm tidak ditemukan di DOM.');
      return;
    }

    const button = form.querySelector('#loginBtn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (button) {
        button.disabled = true;
        button.innerText = 'Loading...';
      }

      try {
        const email = form.email.value.trim();
        const password = form.password.value.trim();

        // basic client-side validation
        if (!email || !password) {
          alert('Email dan password harus diisi.');
          return;
        }

        const res = await login({ email, password });

        if (!res || res.error) {
          alert(res?.message || 'Login gagal');
          return;
        }

        // simpan session via presenter
        this.presenter.setSession({
          token: res.loginResult.token,
          userId: res.loginResult.userId,
          name: res.loginResult.name,
        });

        // navigasi ke home
        location.hash = '#/home';
      } catch (err) {
        console.error('LoginView afterRender error:', err);
        alert('Terjadi kesalahan jaringan atau server.');
      } finally {
        if (button) {
          button.disabled = false;
          button.innerText = 'Login';
        }
      }
    });
  }
}

export default LoginView;
