// CreditStud.io Service Worker
// Strategy: cache-first for static assets, network-first for HTML navigations.
const CACHE_VERSION = 'creditstud-v9-2026-04-30';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/rewards/',
  '/rewards/index.html',
  '/debt-planner/',
  '/debt-planner/index.html',
  '/blog/',
  '/blog/index.html',
  '/compare/',
  '/compare/index.html',
  '/blog/best-0-apr-credit-cards.html',
  '/data-version.json',
  '/min-payment/',
  '/min-payment/index.html',
  '/min-payment/calc.js',
  '/min-payment/calc.css',
  '/score-simulator/',
  '/score-simulator/index.html',
  '/score-simulator/sim.js',
  '/score-simulator/sim.css',
  '/af-worth-it/',
  '/af-worth-it/index.html',
  '/af-worth-it/calc.js',
  '/af-worth-it/calc.css',
  '/af-worth-it/fee-cards.js',
  '/loan-vs-bt/',
  '/loan-vs-bt/index.html',
  '/loan-vs-bt/calc.js',
  '/loan-vs-bt/calc.css',
  '/loan-vs-bt/rates.js',
  '/cards/',
  '/cards/index.html',
  '/cards/card.css',
  '/cards/cards-data.js',
  '/cards/chase-sapphire-preferred/',
  '/cards/amex-gold/',
  '/cards/capital-one-venture-x/',
  '/cards/chase-sapphire-reserve/',
  '/cards/amex-platinum/',
  '/cards/bilt-mastercard/',
  '/cards/capital-one-savorone/',
  '/cards/citi-double-cash/',
  '/cards/wells-fargo-autograph/',
  '/cards/us-bank-altitude-go/',
  '/cards/citi-custom-cash/',
  '/cards/capital-one-quicksilver/',
  '/cards/discover-it-cash-back/',
  '/cards/bofa-customized-cash-rewards/',
  '/cards/us-bank-cash-plus/',
  '/cards/capital-one-savor/',
  '/cards/southwest-priority-card/',
  '/cards/ihg-one-rewards-premier/',
  '/cards/barclays-uber-pro/',
  '/cards/amazon-prime-visa-signature/',
  '/cards/apple-card/',
  '/cards/citi-premier/',
  '/cards/chase-ink-business-preferred/',
  '/merchant/uber-lyft.html',
  '/merchant/insurance.html',
  '/merchant/subscription.html',
  '/merchant/rent.html',
  '/blog/best-credit-cards-for-travel.html',
  '/blog/how-to-build-credit-from-scratch.html',
  '/cards/amex-blue-cash-preferred/',
  '/cards/chase-freedom-flex/',
  '/cards/amex-blue-cash-everyday/',
  '/cards/citi-strata-premier/',
  '/cards/wells-fargo-active-cash/',
  '/blog/best-credit-cards-for-groceries.html',
  '/blog/best-balance-transfer-credit-cards.html',
  '/blog/minimum-payment-trap.html',
  '/blog/amex-gold-worth-it.html',
  '/blog/snowball-vs-avalanche.html',
  '/shared/skeleton.js',
  '/merchant/',
  '/merchant/index.html',
  '/merchant/amazon.html',
  '/merchant/costco.html',
  '/merchant/target.html',
  '/merchant/walmart.html',
  '/merchant/groceries.html',
  '/merchant/home-improvement.html',
  '/merchant/gas-stations.html',
  '/merchant/restaurants.html',
  '/merchant/streaming.html',
  '/merchant/travel.html',
  '/merchant/pharmacy.html',
  '/merchant/warehouse-clubs.html',
  '/merchant/online-shopping.html',
  '/merchant/utilities.html',
  '/merchant/fitness.html',
  '/merchant/travel-hotels.html',
  '/merchant/dining.html',
  '/merchant/ev-charging.html',
  '/merchant/student.html',
  '/style.css',
  '/app.js',
  '/calc.js',
  '/data.js',
  '/rewards/rewards.js',
  '/rewards/rewards.css',
  '/rewards/wallet-optimizer.js',
  '/rewards/cards-data.js',
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