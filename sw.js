const CACHE_NAME = 'rpe-pwa-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './RPE.html',
  './style.css',
  './script.js',
  './rpe.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalación: guardar archivos en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activación: limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Intercepción de peticiones: servir desde la caché si no hay red
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});