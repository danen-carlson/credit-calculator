// CreditStud.io Service Worker
// Strategy: cache-first for static assets, network-first for HTML navigations.
const CACHE_VERSION = 'creditstud-v2-2026-04-28';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/rewards/',
  '/rewards/index.html',
  '/debt-planner/',
  '/debt-planner/index.html',
  '/blog/',
  '/blog/index.html',
  '/style.css',
  '/app.js',
  '/calc.js',
  '/data.js',
  '/rewards/rewards.js',
  '/rewards/rewards.css',
  '/debt-planner/planner.js',
  '/debt-planner/planner.css',
  '/debt-planner/charts.js',
  '/manifest.webmanifest',
  '/icon.svg',
  '/shared/share.js',
  '/shared/share.css',
  '/shared/email-capture.js',
  '/shared/email-capture.css',
  '/shared/apply-button.js',
  '/shared/components.css',
  '/shared/pwa.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html',
  '/og-images/home.png'
];

// Install: pre-cache core assets.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // Tolerant: ignore individual fetch failures so install always succeeds.
      return Promise.all(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch(() => null)
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: wipe old cache versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: HTML → network-first with cache fallback; static → cache-first.
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Skip cross-origin (CDNs, analytics, etc.) — let browser handle it.
  if (url.origin !== self.location.origin) return;

  // Skip URL-state shared links (they're dynamic by design).
  if (url.searchParams.has('share')) return;

  // HTML navigations: network-first, fall back to cached page, then offline.html.
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          // Cache a clone for next time.
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone)).catch(() => {});
          return response;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  // Static assets: cache-first, update cache in background.
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone)).catch(() => {});
        }
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});