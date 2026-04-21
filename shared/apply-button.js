// Affiliate Apply Button Component — CreditStud.io
// Generates "Apply Now" / "Learn More" buttons with FTC disclosure

function renderApplyButton(card, context = 'results') {
  if (!card) return '';

  const hasAffiliateLink = card.affiliateLink && card.affiliateLink.trim() !== '';
  const buttonClass = context === 'wallet' ? 'btn-apply btn-apply-sm' : 'btn-apply';

  if (hasAffiliateLink) {
    // Track click and redirect
    return `
      <a href="${card.affiliateLink}" 
         target="_blank" 
         rel="nofollow sponsored noopener"
         class="${buttonClass}"
         data-card-id="${card.id}"
         data-network="${card.affiliateNetwork || ''}"
         onclick="trackAffiliateClick('${card.id}', '${card.affiliateNetwork}')">
        Apply Now →
      </a>
      <div class="ftc-disclosure">
        We may earn a commission when you apply. <a href="/disclosure.html">See our disclosure</a>.
      </div>
    `;
  }

  // No affiliate link — show Learn More that scrolls to card details
  return `
    <a href="#card-${card.id}" 
       class="${buttonClass} btn-learn-more"
       data-card-id="${card.id}">
      Learn More
    </a>
  `;
}

// Track affiliate clicks (client-side for now; can be wired to analytics)
function trackAffiliateClick(cardId, network) {
  // Store click in localStorage for admin review
  try {
    const clicks = JSON.parse(localStorage.getItem('cs_affiliate_clicks') || '[]');
    clicks.push({ cardId, network, timestamp: new Date().toISOString() });
    // Keep only last 500 clicks
    if (clicks.length > 500) clicks.splice(0, clicks.length - 500);
    localStorage.setItem('cs_affiliate_clicks', JSON.stringify(clicks));
  } catch (e) {
    // Non-critical — don't break UX
  }
}