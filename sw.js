const CACHE_NAME = 'finangest-v3';
const urlsToCache = [
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg'
];

// Instalar - solo cachear assets estáticos, NO el HTML
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activar - limpiar cachés viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - Network first para HTML, cache first para assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Para HTML y API, siempre ir a la red
  if (url.pathname.endsWith('.html') || url.pathname.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Para assets estáticos, usar caché
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
