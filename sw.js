const CACHE_NAME = "edward-torangga-v3";
const urlsToCache = [
  "/",
  "/index.html",
  "/css/style.css",
  "/css/dark-mode.css",
  "/css/apps.css",
  "/js/main.js",
  "/js/apps.js",
  "/js/background-canvas.js",
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

// Fetch from network first for HTML/CSS/JS, fallback to cache, to avoid stale styling
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and store in cache
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Update service worker & delete old caches immediately
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
