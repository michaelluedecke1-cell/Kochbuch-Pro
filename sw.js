const CACHE_NAME = 'kochbuch-cache-v1';

// Diese Dateien merkt sich die App für den Offline-Modus
const urlsToCache = [
  './',
  './index.html',
  './kategorien.html',
  './settings.html',
  './style.css',
  './script.js',
  './settings.js',
  './icon.png',
  './manifest.json'
];

// Beim ersten Start: Alle Dateien herunterladen und in den Cache legen
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache geöffnet');
        return cache.addAll(urlsToCache);
      })
  );
});

// Wenn die App benutzt wird: Dateien aus dem Cache holen
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Treffer gefunden? Dann nimm die Datei aus dem Cache.
        // Wenn nicht, lade sie normal aus dem Internet.
        return response || fetch(event.request);
      })
  );
});

// Alten Cache aufräumen, falls du später mal 'kochbuch-cache-v2' machst
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
});