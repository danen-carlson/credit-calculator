/**
 * Skeleton Screen Loader — CreditStud.io
 * Shows placeholder skeleton screens while calculators compute results.
 * Ensures a minimum 300ms display time to avoid flash on fast loads.
 */

const SkeletonLoader = {
  MIN_DISPLAY_MS: 300,
  _startTime: 0,
  _skeletonEl: null,
  _resultsEl: null,

  /**
   * Show a skeleton screen in the given container.
   * @param {string} containerId - ID of the element to show skeleton in
   * @param {string} type - 'compare', 'rewards', or 'debt'
   */
  show(containerId, type) {
    this._startTime = Date.now();
    const container = document.getElementById(containerId);
    if (!container) return;

    // Save reference for later removal
    this._containerId = containerId;

    // Create skeleton HTML based on type
    const skeletonHTML = this._getSkeletonHTML(type);

    // Create skeleton container
    const skeletonDiv = document.createElement('div');
    skeletonDiv.id = 'skeleton-' + containerId;
    skeletonDiv.className = 'skeleton-container';
    skeletonDiv.innerHTML = skeletonHTML;

    // Insert skeleton before results (or replace current content)
    container.innerHTML = '';
    container.appendChild(skeletonDiv);
    this._skeletonEl = skeletonDiv;
  },

  /**
   * Hide the skeleton screen and reveal real results.
   * Ensures the skeleton was visible for at least MIN_DISPLAY_MS.
   * @param {string} containerId - ID of the element containing the skeleton
   */
  hide(containerId) {
    const elapsed = Date.now() - this._startTime;
    const delay = Math.max(0, this.MIN_DISPLAY_MS - elapsed);

    setTimeout(() => {
      const skeletonDiv = document.getElementById('skeleton-' + containerId);
      if (skeletonDiv) {
        skeletonDiv.classList.add('skeleton-fading');
        setTimeout(() => {
          skeletonDiv.remove();
        }, 300); // match CSS transition
      }
    }, delay);
  },

  /**
   * Generate skeleton HTML for each calculator type.
   */
  _getSkeletonHTML(type) {
    switch (type) {
      case 'compare':
        return this._compareSkeleton();
      case 'rewards':
        return this._rewardsSkeleton();
      case 'debt':
        return this._debtSkeleton();
      default:
        return this._rewardsSkeleton();
    }
  },

  _compareSkeleton() {
    let html = '';
    for (let i = 0; i < 3; i++) {
      html += `
        <div class="skeleton-compare-row">
          <div class="skeleton skeleton-line wide"></div>
          <div class="skeleton skeleton-line medium"></div>
          <div style="display:flex;gap:12px;margin-top:8px;">
            <div class="skeleton skeleton-line stat"></div>
            <div class="skeleton skeleton-line stat"></div>
            <div class="skeleton skeleton-line stat"></div>
          </div>
          <div class="skeleton skeleton-line narrow" style="margin-top:8px;"></div>
        </div>`;
    }
    return html;
  },

  _rewardsSkeleton() {
    let html = '';
    for (let i = 0; i < 4; i++) {
      const borderStyle = i === 0 ? 'border-color:#2563eb;box-shadow:0 0 0 2px #2563eb22;' : '';
      html += `
        <div class="skeleton-result-card" style="${borderStyle}">
          <div class="skeleton skeleton-line title" style="width:${55 + Math.random() * 20}%;"></div>
          <div class="skeleton skeleton-line subtitle" style="width:${30 + Math.random() * 20}%;"></div>
          <div style="display:flex;gap:12px;margin-top:8px;">
            <div class="skeleton skeleton-line stat"></div>
            <div class="skeleton skeleton-line stat"></div>
            <div class="skeleton skeleton-line stat"></div>
          </div>
          <div class="skeleton skeleton-line narrow" style="width:${25 + Math.random() * 15}%;margin-top:8px;"></div>
        </div>`;
    }
    return html;
  },

  _debtSkeleton() {
    return `
      <div class="skeleton-debt-row">
        <div class="skeleton skeleton-line" style="width:70%;height:18px;"></div>
        <div class="skeleton skeleton-line" style="width:50%;"></div>
        <div class="skeleton skeleton-line" style="width:35%;"></div>
      </div>
      <div class="skeleton-debt-row">
        <div class="skeleton skeleton-line" style="width:60%;height:18px;"></div>
        <div class="skeleton skeleton-line" style="width:45%;"></div>
        <div class="skeleton skeleton-line" style="width:40%;"></div>
      </div>
      <div class="skeleton skeleton-chart"></div>
      <div class="skeleton skeleton-line" style="width:90%;height:20px;margin-top:12px;"></div>
      <div class="skeleton skeleton-line" style="width:65%;"></div>`;
  }
};

// Export for use in calculator pages
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkeletonLoader;
}