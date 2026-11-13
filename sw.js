
const CACHE_NAME = "rpe-pwa-v4";

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./RPE.html",
  "./menu_opciones.html",
  "./menu_opciones.js",
  "./EntrenamientoFuerza.html",
  "./ConsultarRendimientoFuerza.html",
  "./Final.html",
  "./style.css",
  "./app.js",
  "./RPE.js",
  "./Final.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./RV-Baloncesto-header-1.png"
];

// INSTALACIÓN
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// ACTIVACIÓN
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// PETICIONES DE LA APLICACIÓN
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {

    event.respondWith(
      fetch(event.request)
        .then((response) => {

          if (response.status === 200) {
            const responseClone = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }

          return response;
        })
        .catch(() => caches.match(event.request))
    );

  } else {

    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );

  }
});
