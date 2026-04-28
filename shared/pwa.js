// PWA boot: service worker registration + install prompt.
(function () {
  'use strict';

  // --- Service worker registration (all pages) ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function (err) {
        console.warn('SW registration failed:', err);
      });
    });
  }

  // --- Install prompt logic ---
  // Home page: show immediately (existing behavior).
  // Calculator pages (compare, debt-planner, rewards): show after 60s OR when
  // the custom event 'creditstud:results-ready' fires, whichever comes first.

  var CALC_PATHS = ['/compare/', '/debt-planner/', '/rewards/',
                    '/compare/index.html', '/debt-planner/index.html', '/rewards/index.html'];
  var isHome = location.pathname === '/' || location.pathname === '/index.html';
  var isCalc = CALC_PATHS.some(function (p) { return location.pathname === p || location.pathname.startsWith(p.replace('/index.html', '/')); });

  // Only show on home or calculator pages.
  if (!isHome && !isCalc) return;

  var DISMISS_KEY = 'creditstud_install_dismissed_until';
  var dismissedUntil = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
  if (Date.now() < dismissedUntil) return;

  var deferredPrompt = null;
  var bannerShown = false;
  var delayTimer = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    maybeShowBanner();
  });

  function maybeShowBanner() {
    if (!deferredPrompt || bannerShown) return;
    if (isHome) {
      showInstallBanner();
      return;
    }
    // Calculator pages: wait 60s or results-ready event.
    delayTimer = setTimeout(function () {
      showInstallBanner();
    }, 60000);
  }

  // Listen for the custom results-ready event to show prompt sooner.
  window.addEventListener('creditstud:results-ready', function () {
    if (delayTimer) {
      clearTimeout(delayTimer);
      delayTimer = null;
    }
    if (!bannerShown && deferredPrompt) {
      showInstallBanner();
    }
  });

  function showInstallBanner() {
    if (document.getElementById('pwa-install-banner')) return;
    bannerShown = true;

    var banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Install CreditStud.io as an app');
    banner.innerHTML =
      '<span class="pwa-install-text">Install CreditStud.io for quick access</span>' +
      '<button type="button" id="pwa-install-accept" class="pwa-install-btn pwa-install-accept">Install</button>' +
      '<button type="button" id="pwa-install-dismiss" class="pwa-install-btn pwa-install-dismiss" aria-label="Dismiss install prompt">Not now</button>';
    document.body.appendChild(banner);

    document.getElementById('pwa-install-accept').addEventListener('click', async function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      try {
        var choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'dismissed') dismissForAWeek();
      } catch (err) { /* ignore */ }
      deferredPrompt = null;
      banner.remove();
    });

    document.getElementById('pwa-install-dismiss').addEventListener('click', function () {
      dismissForAWeek();
      banner.remove();
    });
  }

  function dismissForAWeek() {
    var weekMs = 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(Date.now() + weekMs));
  }

  window.addEventListener('appinstalled', function () {
    var el = document.getElementById('pwa-install-banner');
    if (el) el.remove();
  });
})();