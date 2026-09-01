const CACHE_NAME = 'rpe-pwa-v2'; // Subimos de v1 a v2 para borrar la caché antigua del móvil

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './RPE.html',
  './Final.html',
  './style.css',
  './app.js',
  './RPE.js',
  './Final.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalación: Guardar archivos e intentar tomar el control de inmediato
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activación: Borra la versión v1 inmediatamente al detectar cambios
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia Network First para JavaScript y CSS: intenta la red para tener cambios al momento, si no hay internet usa la caché
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Si son archivos de la app, intenta primero red y luego caché
  if (requestUrl.origin === location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Si la red responde bien, actualiza la caché dinámicamente
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request)) // Si está offline, sirve desde caché
    );
  } else {
    // Para peticiones externas (Google Forms/Apps Script)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
  }
});
