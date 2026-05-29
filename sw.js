const CACHE_NAME = 'kochbuch-cache-v4';
const urlsToCache = [
  '/',
  'index.html',
  'style.css',
  'script.js',
  'settings.html',
  'settings.js',
  'manifest.json',
  'icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // WICHTIG: Anfragen an die Groq KI dürfen NIEMALS offline gesucht werden!
  // Wir leiten sie direkt ans echte Internet weiter.
  if (event.request.url.includes('api.groq.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Alles andere (Bilder, CSS, HTML) normal aus dem Offline-Speicher laden
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
