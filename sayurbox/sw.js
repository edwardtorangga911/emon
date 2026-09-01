// SayurBox Service Worker
// Cache strategy:
//   - Static assets  → Cache-First  (serve from cache, fall back to network)
//   - API calls       → Network-First (fetch fresh, fall back to cache)

const CACHE_NAME = 'sayurbox-v1';
const STATIC_ASSETS = [
  './index.html',
  './manifest.json'
];

// ─── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  // Pre-cache static assets and activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Skip the waiting phase so the new SW activates right away
  self.skipWaiting();
});

// ─── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener('activate', event => {
  // Claim all clients so this SW controls pages opened before registration
  event.waitUntil(
    clients.claim().then(() => {
      // Remove old caches that are no longer needed
      return caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      );
    })
  );
});

// ─── FETCH ────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-First for Google Apps Script API calls
  if (url.hostname === 'script.google.com') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Cache-First for everything else (HTML, assets, fonts, etc.)
  event.respondWith(cacheFirst(event.request));
});

// ─── STRATEGIES ───────────────────────────────────────────────

/**
 * Cache-First: Return cached response if available,
 * otherwise fetch from network and cache the result.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    // Only cache successful GET responses
    if (request.method === 'GET' && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    // Network unavailable and no cache — return a simple offline fallback
    return new Response('Offline — SayurBox tidak tersedia saat ini.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

/**
 * Network-First: Try the network first (for fresh API data),
 * fall back to cache if the network fails.
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    // Cache successful GET responses for future offline fallback
    if (request.method === 'GET' && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    // Network failed — try cache
    const cached = await caches.match(request);
    if (cached) return cached;

    return new Response(JSON.stringify({ error: 'Offline', data: [] }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
