const CACHE_NAME = 'my-sites-hub-v2';
const STATIC_ASSETS = [
  '/',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean ALL old caches (including freedom-journey-v1)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first strategy for pages/API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: always network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'أنت غير متصل بالإنترنت' }),
          { headers: { 'Content-Type': 'application/json' }, status: 503 }
        );
      })
    );
    return;
  }

  // Page navigation: always network-first (to avoid serving old cached pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match('/').then((cached) => {
            return cached || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for images
        if (request.destination === 'image') {
          return caches.match('/icon-192.png');
        }
      });
    })
  );
});
