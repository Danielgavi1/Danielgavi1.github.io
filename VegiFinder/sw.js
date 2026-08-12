const CACHE_NAME = 'vegifinder-static-v2.2.0';
const APP_SHELL = [
  './',
  './index.html',
  './acerca.html',
  './privacidad.html',
  './404.html',
  './manifest.webmanifest',
  './assets/css/styles.css?v=2.2.0',
  './assets/js/app.js?v=2.2.0',
  './assets/js/api.js?v=2.2.0',
  './assets/js/classification.js?v=2.2.0',
  './assets/js/scanner.js?v=2.2.0',
  './assets/js/storage.js?v=2.2.0',
  './assets/js/theme-static.js',
  './assets/img/logo.svg',
  './assets/img/product-placeholder.svg',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('vegifinder-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, fallbackUrl = null) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request, { cache: 'no-cache' });
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: false });
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl, { ignoreSearch: true });
      if (fallback) return fallback;
    }
    return new Response('Sin conexión', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, './index.html'));
    return;
  }

  event.respondWith(networkFirst(request));
});
