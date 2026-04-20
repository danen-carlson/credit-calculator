// PWA boot: service worker registration + install prompt (home page only).
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

  // --- Install prompt (home page only, keeps it subtle) ---
  var isHome = location.pathname === '/' || location.pathname === '/index.html';
  if (!isHome) return;

  var DISMISS_KEY = 'creditstud_install_dismissed_until';
  var dismissedUntil = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
  if (Date.now() < dismissedUntil) return;

  var deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner();
  });

  function showInstallBanner() {
    if (document.getElementById('pwa-install-banner')) return;
    var banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Install CreditStudio as an app');
    banner.innerHTML =
      '<span class="pwa-install-text">Install CreditStudio for quick access</span>' +
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
