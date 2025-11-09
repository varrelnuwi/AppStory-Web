// src/index.js
import './app.css';
import './sw-register';
import AppPresenter from './presenter/appPresenter';

// Tunggu DOM siap
document.addEventListener('DOMContentLoaded', () => {
  // buat instance AppPresenter
  new AppPresenter(document.getElementById('app'));
});
