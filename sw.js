const CACHE_NAME = "edward-torangga-v2";
const urlsToCache = [
  "/",
  "/index.html",
  "/css/style.css",
  "/css/dark-mode.css",
  "/css/apps.css",
  "/js/main.js",
  "/js/apps.js",
  "/js/particles-config.js",
  "/assets/favicon.png",
  "/assets/profile.jpeg",
  "/data/tools.json",
  "/data/projects.json",
  "/data/skills.json",
  "/data/apps.json"
];

// Install service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Fetch from cache or network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

// Update service worker & clear old cache
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
