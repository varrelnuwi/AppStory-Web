// src/views/registerView.js
import { register } from '../api.js';

export default class RegisterView {
  constructor(presenter) {
    this.presenter = presenter;
  }

  async render() {
    return `
      <section class="auth-page register-page">
        <h1>Register</h1>
        <form id="registerForm" class="form">
          <label class="label" for="name">Nama</label>
          <input id="name" name="name" class="input" type="text" required>
          
          <label class="label" for="email">Email</label>
          <input id="email" name="email" class="input" type="email" required>
          
          <label class="label" for="password">Password</label>
          <input id="password" name="password" class="input" type="password" minlength="8" required>
          
          <button class="btn" type="submit">Register</button>
          <p>Sudah punya akun? <a href="#/login">Login di sini</a></p>
        </form>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById('registerForm');
    if (form) {
      form.addEventListener('submit', (e) => this.onSubmit(e));
    }
  }

  async onSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value.trim();
    
    try {
      const res = await register({ name, email, password });
      if (!res.error) {
        alert('Register berhasil, silakan login');
        location.hash = '#/login';
      } else {
        alert(res.message || 'Gagal register');
      }
    } catch (err) {
      console.error(err);
      alert('Error saat register');
    }
  }
}
