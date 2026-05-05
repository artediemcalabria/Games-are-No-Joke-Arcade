const CACHE_NAME = 'games-are-no-joke-v4';
const scope = new URL(self.registration.scope);
const appUrl = (path = '') => new URL(path, scope).toString();
const APP_SHELL = [
  appUrl('ganj-logo.png'),
  appUrl('ganj-cover.jpeg')
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

  const requestUrl = new URL(event.request.url);
  if (requestUrl.pathname.startsWith(`${scope.pathname}api/`)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(appUrl(), copy)).catch(() => undefined);
          return response;
        })
        .catch(() => caches.match(appUrl()))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => (
      fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => undefined);
        }
        return response;
      }).catch(() => {
        if (cached) return cached;
        throw new Error('Cached asset unavailable');
      })
    ))
  );
});
