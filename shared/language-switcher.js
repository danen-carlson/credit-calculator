/**
 * Language Switcher JS — CreditStud.io
 * Handles dropdown toggle, language detection, and path switching.
 */

(function () {
  'use strict';

  var SUPPORTED_LANGS = ['en', 'es', 'zh', 'tl', 'ko', 'hi'];

  /**
   * Detect the current language from the URL path.
   * /es/... → 'es', /zh/... → 'zh', /... → 'en'
   */
  function detectLang() {
    var path = window.location.pathname;
    var match = path.match(/^\/(es|zh|tl|ko|hi)\//);
    return match ? match[1] : 'en';
  }

  /**
   * Get the current page path without the language prefix.
   * /es/cards/chase-sapphire-preferred/ → /cards/chase-sapphire-preferred/
   */
  function getPathWithoutLang() {
    var path = window.location.pathname;
    var match = path.match(/^\/(es|zh|tl|ko|hi)(\/.*)?$/);
    if (match) {
      return match[2] || '/';
    }
    return path;
  }

  /**
   * Build the URL for a given language, preserving the current page path.
   */
  function getLangUrl(lang) {
    var cleanPath = getPathWithoutLang();
    if (lang === 'en') {
      return cleanPath;
    }
    return '/' + lang + cleanPath;
  }

  /**
   * Store preferred language in localStorage.
   */
  function saveLangPref(lang) {
    try {
      localStorage.setItem('cs_preferred_lang', lang);
    } catch (e) { /* non-critical */ }
  }

  /**
   * Get stored language preference.
   */
  function getLangPref() {
    try {
      return localStorage.getItem('cs_preferred_lang');
    } catch (e) {
      return null;
    }
  }

  /**
   * Auto-detect browser language and redirect on first visit.
   * Only redirects if no stored preference and browser language matches.
   */
  function autoRedirect() {
    // Don't redirect if user has a stored preference
    if (getLangPref()) return;
    // Don't redirect if already on a non-English page
    if (detectLang() !== 'en') return;

    try {
      var browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
      // Map browser language codes to our supported languages
      var langMap = {
        'es': 'es',
        'zh': 'zh', 'zh-CN': 'zh', 'zh-TW': 'zh', 'zh-Hans': 'zh', 'zh-Hant': 'zh',
        'tl': 'tl', 'fil': 'tl',
        'ko': 'ko',
        'hi': 'hi'
      };
      var target = langMap[browserLang] || langMap[navigator.language];
      if (target && target !== 'en') {
        saveLangPref(target);
        window.location.replace(getLangUrl(target));
      }
    } catch (e) { /* non-critical */ }
  }

  /**
   * Initialize the language switcher UI.
   */
  function initSwitcher() {
    var currentLang = detectLang();

    // Update the toggle button text
    var toggle = document.querySelector('.lang-toggle');
    if (!toggle) return;

    var langLabels = {
      'en': 'EN', 'es': 'ES', 'zh': '中文', 'tl': 'TL', 'ko': '한', 'hi': 'हि'
    };
    var langSpan = toggle.querySelector('.current-lang');
    if (langSpan) {
      langSpan.textContent = langLabels[currentLang] || currentLang.toUpperCase();
    }

    // Mark current language in dropdown
    var links = document.querySelectorAll('.lang-dropdown a');
    links.forEach(function (link) {
      var href = link.getAttribute('href') || '/';
      // Build correct URLs preserving current path
      var linkLang = link.getAttribute('hreflang') || 'en';
      link.href = getLangUrl(linkLang);

      if (linkLang === currentLang) {
        link.classList.add('active-lang');
      } else {
        link.classList.remove('active-lang');
      }
    });

    // Toggle dropdown on click
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var dropdown = toggle.nextElementSibling;
      var isOpen = dropdown.classList.contains('open');
      // Close any other open dropdowns first
      document.querySelectorAll('.lang-dropdown.open').forEach(function (d) {
        d.classList.remove('open');
      });
      if (!isOpen) {
        dropdown.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
      } else {
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close dropdown on outside click
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.language-switcher')) {
        var dropdown = document.querySelector('.lang-dropdown.open');
        if (dropdown) {
          dropdown.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      }
    });

    // Save preference when user clicks a language link
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        var lang = link.getAttribute('hreflang') || 'en';
        saveLangPref(lang);
      });
    });

    // Close on escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var dropdown = document.querySelector('.lang-dropdown.open');
        if (dropdown) {
          dropdown.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initSwitcher();
      // Auto-redirect disabled by default — enable when translations are live
      // autoRedirect();
    });
  } else {
    initSwitcher();
  }

  // Expose for build.js or other scripts
  window.CreditStudLang = {
    detect: detectLang,
    getLangUrl: getLangUrl,
    savePref: saveLangPref,
    getPref: getLangPref,
    supported: SUPPORTED_LANGS
  };

})();