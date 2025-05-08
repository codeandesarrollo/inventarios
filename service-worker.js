// service-worker.js
const CACHE_NAME = 'inventario-cache-v3';
const urlsToPreCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/agregaproductos.html',
  '/login.html',
  '/main.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToPreCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  // Si NO quieres borrar nunca cachés antiguas, comenta todo este bloque.
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Solo interceptamos GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResp => {
      if (cachedResp) {
        // 1) Si está en caché, lo devolvemos inmediatamente
        return cachedResp;
      }
      // 2) Si no, lo pedimos a red y lo almacenamos
      return fetch(event.request).then(networkResp => {
        return caches.open(CACHE_NAME).then(cache => {
          // Clonamos porque la respuesta solo se puede leer una vez
          cache.put(event.request, networkResp.clone());
          return networkResp;
        });
      }).catch(() => {
        // 3) Si estamos offline y es navegación de página, leo el shell
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
