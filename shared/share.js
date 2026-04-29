/**
 * share.js — Shareable URL state + "last updated" data stamps
 *
 * Tiny, dependency-free module used by all calculator pages to:
 *   1. Serialize key form inputs into the URL on every change
 *   2. Hydrate those inputs from the URL on page load
 *   3. Render share + print buttons and a "Data last updated" badge
 *   4. Parse cross-tool URL params (e.g. ?balance=10000 from another calculator)
 *   5. Use native share API when available, fallback to copy-link
 *   6. Show toast notifications on copy/share
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

  // ---------------------------------------------------------------------------
  // Cross-tool URL parameter parsing
  // ---------------------------------------------------------------------------

  /**
   * Parse cross-tool parameters from the URL and apply them to the current
   * page's DOM. Feature-detects every element before touching it.
   *
   * Parameters recognized:
   *   ?balance=10000       → debt-planner: pre-fill starter debt balance
   *   ?amount=500          → compare: pre-fill purchase amount
   *   ?methods=bnpl        → compare: pre-select BNPL methods
   *   ?methods=intro-apr   → compare: pre-select intro-APR credit cards
   *   ?purchase=500        → rewards: pre-fill spending amount
   *   ?category=groceries  → rewards: bias spending toward that category
   *   ?filter=crypto       → rewards: pre-set filter chip
   */
  function applyCrossToolParams() {
    const params = new URLSearchParams(window.location.search);

    // Determine which page we're on by checking for known elements
    const path = window.location.pathname;

    // --- debt-planner ---
    if (path.includes('debt') || document.getElementById('debt-list')) {
      const balance = params.get('balance');
      if (balance !== null) {
        // Try common debt-planner input fields
        const amountInput = document.getElementById('debt-amount') ||
                            document.getElementById('debt-balance') ||
                            document.getElementById('starting-balance');
        if (amountInput) {
          amountInput.value = balance;
          amountInput.dispatchEvent(new Event('input', { bubbles: true }));
          amountInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        // Also try setting a starter debt via a named field if it exists
        const starterField = document.getElementById('starter-debt-balance');
        if (starterField) {
          starterField.value = balance;
          starterField.dispatchEvent(new Event('input', { bubbles: true }));
          starterField.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }

    // --- compare ---
    if (path.includes('compare') || document.getElementById('compare-results')) {
      const amount = params.get('amount');
      if (amount !== null) {
        const amountInput = document.getElementById('purchase-amount') ||
                            document.getElementById('loan-amount') ||
                            document.getElementById('amount');
        if (amountInput) {
          amountInput.value = amount;
          amountInput.dispatchEvent(new Event('input', { bubbles: true }));
          amountInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      const methods = params.get('methods');
      if (methods !== null) {
        // Pre-select method checkboxes or toggles
        const methodMap = {
          'bnpl': ['bnpl', 'method-bnpl', 'filter-bnpl'],
          'intro-apr': ['intro-apr', 'method-intro-apr', 'filter-intro-apr']
        };
        const keys = methodMap[methods];
        if (keys) {
          keys.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
              if (el.type === 'checkbox') {
                el.checked = true;
                el.dispatchEvent(new Event('change', { bubbles: true }));
              } else if (el.tagName === 'SELECT') {
                el.value = methods;
                el.dispatchEvent(new Event('change', { bubbles: true }));
              } else {
                el.value = methods;
                el.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }
          });
        }
      }
    }

    // --- rewards ---
    if (path.includes('reward') || document.getElementById('rewards-calculator')) {
      const purchase = params.get('purchase');
      if (purchase !== null) {
        const spendInput = document.getElementById('monthly-spend') ||
                           document.getElementById('annual-spend') ||
                           document.getElementById('purchase-amount') ||
                           document.getElementById('spending');
        if (spendInput) {
          spendInput.value = purchase;
          spendInput.dispatchEvent(new Event('input', { bubbles: true }));
          spendInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      const category = params.get('category');
      if (category !== null) {
        const catSelect = document.getElementById('spending-category') ||
                          document.getElementById('category') ||
                          document.getElementById('reward-category');
        if (catSelect) {
          // Try matching the option value or text
          const option = Array.from(catSelect.options).find(
            o => o.value.toLowerCase() === category.toLowerCase() ||
                 o.textContent.toLowerCase() === category.toLowerCase()
          );
          if (option) {
            catSelect.value = option.value;
            catSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }

      const filter = params.get('filter');
      if (filter !== null) {
        // Try to click/activate a filter chip
        const chip = document.getElementById('filter-' + filter) ||
                     document.querySelector(`[data-filter="${filter}"]`) ||
                     document.querySelector(`.filter-chip[data-value="${filter}"]`);
        if (chip) {
          chip.click();
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Toast notification
  // ---------------------------------------------------------------------------

  /**
   * Show a small toast notification that auto-dismisses after 2s.
   * Creates the toast container on first use.
   */
  function showToast(message, duration) {
    duration = duration || 2000;

    let container = document.getElementById('share-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'share-toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'share-toast';
    toast.textContent = message;
    container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.add('share-toast-visible');
    });

    setTimeout(() => {
      toast.classList.remove('share-toast-visible');
      toast.classList.add('share-toast-exit');
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, duration);
  }

  // ---------------------------------------------------------------------------
  // Core share logic
  // ---------------------------------------------------------------------------

  /**
   * Initialize shareable URL + last-updated stamp for a calculator page.
   *
   * @param {Object} config
   * @param {string} config.pageKey                - 'home' | 'rewards' | 'debt' | 'compare'
   * @param {Array<string>} config.simpleInputs    - element ids for simple inputs (input/select)
   * @param {Array<Object>} config.customFields    - [{ name, get, set }] for custom state
   * @param {string} config.shareButtonMount       - CSS selector where to mount the share button
   * @param {string} config.stampMount             - CSS selector where to mount the "last updated" stamp
   * @param {Function} [config.onHydrate]          - called after URL params are applied to the DOM
   */
  function init(config) {
    // Apply cross-tool params FIRST, then page-specific hydration
    applyCrossToolParams();
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

    // Share button
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'share-btn';
    btn.setAttribute('aria-label', 'Share a link to this scenario');
    btn.innerHTML = '<span aria-hidden="true">🔗</span> Share';

    btn.addEventListener('click', async () => {
      updateUrl(config); // force-refresh URL before sharing
      const url = window.location.href;

      // Use native share API if available
      if (navigator.share) {
        try {
          await navigator.share({
            title: document.title || 'Credit Calculator',
            text: 'Check out this credit calculator scenario',
            url: url
          });
          // Native share completed (user chose a target)
          showToast('Shared successfully!');
          return;
        } catch (err) {
          // User cancelled or share failed — fall through to copy-link
          if (err.name === 'AbortError') return;
          // Fall through to clipboard fallback
        }
      }

      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        showToast('Link copied!');
      } catch (e) {
        // Ultimate fallback: select-and-prompt
        window.prompt('Copy this link:', url);
      }
    });

    // Print button
    const printBtn = document.createElement('button');
    printBtn.type = 'button';
    printBtn.className = 'share-btn share-btn-print';
    printBtn.setAttribute('aria-label', 'Print these results');
    printBtn.innerHTML = '<span aria-hidden="true">🖨️</span> Print results';
    printBtn.addEventListener('click', () => {
      window.print();
    });

    // Wrap both in a button group
    const group = document.createElement('div');
    group.className = 'share-btn-group';
    group.appendChild(btn);
    group.appendChild(printBtn);

    mount.appendChild(group);
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
    applyCrossToolParams,   // exposed for testing / manual calls
    showToast               // exposed for external use
  };
  window.CreditStudShare = api;
})();