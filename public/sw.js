const CACHE_NAME = 'games-are-no-joke-v1';
const APP_SHELL = [
  '/Games-are-No-Joke-Arcade/',
  '/Games-are-No-Joke-Arcade/ganj-logo.png',
  '/Games-are-No-Joke-Arcade/ganj-cover.jpeg',
  '/Games-are-No-Joke-Arcade/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => undefined);
      return response;
    }).catch(() => caches.match('/Games-are-No-Joke-Arcade/')))
  );
});
