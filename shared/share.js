/**
 * share.js — Shareable URL state + "last updated" data stamps
 *
 * Tiny, dependency-free module used by all three calculators to:
 *   1. Serialize key form inputs into the URL on every change
 *   2. Hydrate those inputs from the URL on page load
 *   3. Render a "Copy share link" button and a "Data last updated" badge
 *
 * Each page supplies a config object describing which inputs to track and
 * how the share button + data-freshness badge should be mounted.
 *
 * Design notes:
 *   - Uses history.replaceState so the URL stays in sync without polluting back-button history
 *   - Debounces URL updates to 300ms to avoid thrashing on slider drags
 *   - Encodes only non-default values (keeps URLs short)
 *   - Supports: <input type=text/number/range/checkbox/radio>, <select>, custom toggles
 *   - Arrays/objects (e.g., debt list, custom cards) are serialized as JSON in a single "data" param
 */

(function () {
  'use strict';

  // Single source of truth for data freshness.
  // Fallback defaults — overridden by /data-version.json at runtime.
  const DATA_VERSION_DEFAULTS = {
    lastUpdated: '2026-04-18',
    displayDate: 'April 18, 2026',
    source: 'Provider websites + manual verification',
    refreshSchedule: 'Weekly automated scrape + manual review'
  };

  let DATA_VERSION = { ...DATA_VERSION_DEFAULTS };

  let debounceTimer = null;

  /**
   * Initialize shareable URL + last-updated stamp for a calculator page.
   *
   * @param {Object} config
   * @param {string} config.pageKey                - 'home' | 'rewards' | 'debt'
   * @param {Array<string>} config.simpleInputs    - element ids for simple inputs (input/select)
   * @param {Array<Object>} config.customFields    - [{ name, get, set }] for custom state
   * @param {string} config.shareButtonMount       - CSS selector where to mount the share button
   * @param {string} config.stampMount             - CSS selector where to mount the "last updated" stamp
   * @param {Function} [config.onHydrate]          - called after URL params are applied to the DOM
   */
  function init(config) {
    hydrateFromUrl(config);
    wireChangeListeners(config);
    mountShareButton(config);
    mountDataStamp(config);
  }

  function hydrateFromUrl(config) {
    const params = new URLSearchParams(window.location.search);
    if (!params.toString()) return;

    (config.simpleInputs || []).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const val = params.get(id);
      if (val === null) return;
      if (el.type === 'checkbox') {
        el.checked = val === '1' || val === 'true';
      } else if (el.type === 'radio') {
        // For radio groups we match the value param
        const group = document.querySelectorAll(`input[name="${el.name}"]`);
        group.forEach(r => { r.checked = r.value === val; });
      } else {
        el.value = val;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    (config.customFields || []).forEach(field => {
      const raw = params.get(field.name);
      if (raw === null) return;
      try {
        const val = field.json ? JSON.parse(decodeURIComponent(raw)) : raw;
        field.set(val);
      } catch (e) {
        console.warn(`share.js: failed to restore ${field.name}`, e);
      }
    });

    if (typeof config.onHydrate === 'function') {
      try { config.onHydrate(); } catch (e) { console.error(e); }
    }
  }

  function wireChangeListeners(config) {
    (config.simpleInputs || []).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const evt = el.type === 'range' ? 'input' : 'change';
      el.addEventListener(evt, () => scheduleUrlUpdate(config));
    });
    // Custom fields need explicit calls to share.notifyChange() from their own code.
  }

  function scheduleUrlUpdate(config) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => updateUrl(config), 300);
  }

  function updateUrl(config) {
    const params = new URLSearchParams();

    (config.simpleInputs || []).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === 'checkbox') {
        // Only serialize if not at default (unchecked assumed default)
        if (el.checked) params.set(id, '1');
      } else if (el.type === 'radio') {
        // Only serialize the checked radio for each group once
        if (el.checked && !params.has(el.name)) params.set(el.name, el.value);
      } else {
        const v = el.value;
        if (v !== '' && v !== null && v !== undefined) params.set(id, v);
      }
    });

    (config.customFields || []).forEach(field => {
      try {
        const val = field.get();
        if (val === null || val === undefined) return;
        if (field.json) {
          const json = JSON.stringify(val);
          if (json && json !== '[]' && json !== '{}') {
            params.set(field.name, encodeURIComponent(json));
          }
        } else if (val !== '') {
          params.set(field.name, String(val));
        }
      } catch (e) { /* skip */ }
    });

    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    try {
      window.history.replaceState(null, '', url);
    } catch (e) { /* some browsers/iframes block this; fail silently */ }
  }

  function mountShareButton(config) {
    if (!config.shareButtonMount) return;
    const mount = document.querySelector(config.shareButtonMount);
    if (!mount) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'share-btn';
    btn.setAttribute('aria-label', 'Copy a shareable link to this scenario');
    btn.innerHTML = '<span aria-hidden="true">🔗</span> Share this scenario';
    btn.addEventListener('click', async () => {
      updateUrl(config); // force-refresh URL before copying
      const url = window.location.href;
      try {
        await navigator.clipboard.writeText(url);
        const orig = btn.innerHTML;
        btn.innerHTML = '<span aria-hidden="true">✓</span> Link copied!';
        btn.classList.add('share-btn-success');
        setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('share-btn-success'); }, 2500);
      } catch (e) {
        // Fallback: select-and-prompt
        window.prompt('Copy this link:', url);
      }
    });
    mount.appendChild(btn);
  }

  async function mountDataStamp(config) {
    if (!config.stampMount) return;
    const mount = document.querySelector(config.stampMount);
    if (!mount) return;

    // Fetch live data version from /data-version.json (written by weekly scraper).
    // Falls back to hardcoded defaults if fetch fails.
    try {
      const resp = await fetch('/data-version.json');
      if (resp.ok) {
        const json = await resp.json();
        DATA_VERSION = { ...DATA_VERSION, ...json };
      }
    } catch (_) { /* network error or missing file — use defaults */ }

    const stamp = document.createElement('div');
    stamp.className = 'data-stamp';
    stamp.setAttribute('title', `${DATA_VERSION.source}. ${DATA_VERSION.refreshSchedule}.`);
    stamp.innerHTML =
      `<span class="data-stamp-dot" aria-hidden="true">●</span>` +
      `<span class="data-stamp-text">Data last updated: <strong>${DATA_VERSION.displayDate}</strong></span>`;
    mount.appendChild(stamp);
  }

  // Public API for calculators that need to trigger a URL update after non-DOM state changes
  const api = {
    init,
    notifyChange: (config) => scheduleUrlUpdate(config),
    DATA_VERSION,
  };
  window.CreditStudShare = api;
})();
