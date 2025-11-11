// src/index.js
import './app.css';
import '../public/sw-register';
import AppPresenter from './presenter/appPresenter';

// Tunggu DOM siap
document.addEventListener('DOMContentLoaded', () => {
  // buat instance AppPresenter
  new AppPresenter(document.getElementById('app'));
});

// 🔁 Auto reload saat service worker update app shell
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'NEW_VERSION_AVAILABLE') {
      console.log('🔄 Versi baru terdeteksi, reload otomatis...');
      window.location.reload();
    }
  });
}
