import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root') as HTMLElement;
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// скрываем экран-загрузку, когда приложение смонтировалось
window.setTimeout(() => {
  const boot = document.getElementById('boot');
  if (boot) boot.classList.add('gone');
}, 350);

// PWA: регистрируем service worker (только в production/preview)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
