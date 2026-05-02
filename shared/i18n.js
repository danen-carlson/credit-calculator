/**
 * i18n.js — CreditStud.io Internationalization Helper
 * Phase 0: Foundation
 *
 * Provides t() and tfallback() functions for string translation.
 * When window.__lang is 'en' or undefined, falls back to key (which
 * matches the English hardcoded strings, so the site works as before).
 *
 * Usage:
 *   <script>window.__lang = 'es';</script>
 *   <script src="/locales/es.js"></script>
 *   <script src="/shared/i18n.js"></script>
 *   ...
 *   alert(t('alerts.enterPurchaseAmount'));
 *   alert(t('results.inclRewards', { amount: '$50' }));
 */

(function () {
  'use strict';

  /**
   * Translate a key using the current locale.
   * Supports parameterized strings: t('key', { name: 'value' })
   * replaces {name} in the translated string.
   *
   * @param {string} key  - Locale key (e.g. 'results.bestChoice')
   * @param {object} params - Optional params to interpolate
   * @returns {string} Translated string, or the key if not found
   */
  function t(key, params) {
    var lang = window.__lang || 'en';
    var locale = window.LOCALE && window.LOCALE[lang];
    var val = (locale && locale[key]) || key;

    if (params) {
      var keys = Object.keys(params);
      for (var i = 0; i < keys.length; i++) {
        val = val.replace('{' + keys[i] + '}', params[keys[i]]);
      }
    }
    return val;
  }

  /**
   * Translate with English fallback.
   * If the current locale doesn't have the key, try English before returning the raw key.
   *
   * @param {string} key  - Locale key
   * @param {object} params - Optional params
   * @returns {string} Translated string with fallback chain: current lang → English → key
   */
  function tfallback(key, params) {
    var lang = window.__lang || 'en';
    var locale = window.LOCALE && window.LOCALE[lang];
    var enLocale = window.LOCALE && window.LOCALE.en;
    var val = (locale && locale[key]) || (enLocale && enLocale[key]) || key;

    if (params) {
      var keys = Object.keys(params);
      for (var i = 0; i < keys.length; i++) {
        val = val.replace('{' + keys[i] + '}', params[keys[i]]);
      }
    }
    return val;
  }

  // Expose globally
  window.t = t;
  window.tfallback = tfallback;

})();