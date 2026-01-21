// Service Worker para FinanGest PWA
const CACHE_NAME = 'finangest-v2';
const STATIC_CACHE = 'finangest-static-v2';
const API_CACHE = 'finangest-api-v2';

// Archivos estáticos para cachear
const urlsToCache = [
  '/',
  '/index.html',
  '/index2.html',
  '/finangest.html',
  '/manifest.json',
  // CDN resources
  'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('✅ Cache estático abierto');
        return cache.addAll(urlsToCache)
          .catch((error) => {
            console.warn('⚠️ Algunos archivos no pudieron cachearse:', error);
            // No fallar si no se pueden cachear todos los archivos
          });
      })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar caches antiguos
          if (cacheName !== STATIC_CACHE && 
              cacheName !== API_CACHE && 
              cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia de cache mejorada
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo cachear GET
  if (request.method !== 'GET') {
    return;
  }

  // Estrategia especial para API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      // Network First: Intentar red primero, fallback a cache
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Si falla la red, usar cache
          return caches.match(request);
        })
    );
    return;
  }

  // Estrategia para archivos estáticos: Cache First
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Si está en cache, devolverlo
        if (response) {
          // Actualizar en background
          fetch(request).then((freshResponse) => {
            if (freshResponse && freshResponse.status === 200) {
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, freshResponse);
              });
            }
          }).catch(() => {});
          return response;
        }

        // Si no está en cache, traer de red
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
            return response;
          })
          .catch(() => {
            // Si falla todo, devolver página offline
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
            return new Response('Offline - recurso no disponible', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({ 'Content-Type': 'text/plain' })
            });
          });
      })
  );
});

// Escuchar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
