import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => registrations.forEach((registration) => {
        registration.unregister().catch(() => undefined);
      }))
      .catch(() => undefined);
    if ('caches' in window) {
      caches.keys()
        .then((keys) => keys
          .filter((key) => key.startsWith('games-are-no-joke-'))
          .forEach((key) => {
            caches.delete(key).catch(() => undefined);
          }))
        .catch(() => undefined);
    }
  });
}
