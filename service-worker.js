/**
 * service-worker.js — basic offline cache for core pages and assets.
 *
 * Lives at the project root so its scope covers the whole site (a worker in
 * /assets/js/ could only control /assets/js/). Cache-first for static assets,
 * network-first for HTML so content updates are picked up when online.
 */

const CACHE_NAME = 'tribubeti-v1';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/pages/history.html',
  '/pages/languages.html',
  '/pages/traditions.html',
  '/pages/games.html',
  '/pages/gallery.html',
  '/pages/stories.html',
  '/pages/learn-language.html',
  '/pages/about.html',
  '/pages/contact.html',
  '/_layouts/header.html',
  '/_layouts/footer.html',
  '/locales/fr.json',
  '/locales/en.json',
  '/assets/css/reset.css',
  '/assets/css/variables.css',
  '/assets/css/base.css',
  '/assets/css/components.css',
  '/assets/css/layout.css',
  '/assets/css/responsive.css',
  '/assets/js/main.js',
  '/assets/js/i18n.js',
  '/assets/js/gallery.js',
  '/assets/js/audio-player.js',
  '/assets/js/lessons.js',
  '/assets/img/registry.json',
  '/assets/audio/registry.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

  const isHTML = request.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    // Network-first for pages: fresh content when online, cache offline.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
    );
  } else {
    // Cache-first for static assets.
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
  }
});
