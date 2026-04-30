// Affiliate Apply Button Component — CreditStud.io
// Generates "Apply Now" / "Learn More" buttons with FTC disclosure

function renderApplyButton(card, context = 'results') {
  if (!card) return '';

  const hasRealAffiliateLink = card.affiliateLink && card.affiliateLink.trim() !== '' && card.affiliateLink.trim() !== '#';
  const network = card.affiliateNetwork || '';
  const buttonClass = context === 'wallet' ? 'btn-apply btn-apply-sm' : 'btn-apply';

  if (hasRealAffiliateLink) {
    // Real affiliate link — show "Apply Now" with FTC disclosure
    return `
      <a href="${card.affiliateLink}" 
         target="_blank" 
         rel="nofollow sponsored noopener"
         class="${buttonClass}"
         data-card-id="${card.id || card.slug}"
         data-affiliate-network="${network}"
         onclick="trackAffiliateClick('${card.id || card.slug}', '${network}')">
        Apply Now →
      </a>
      <div class="ftc-disclosure">
        CreditStud.io may earn commissions from credit card applications. This does not affect our rankings.
      </div>
    `;
  }

  // No affiliate link — show "Learn More" linking to the card review page
  const reviewUrl = `/cards/${card.slug}/`;
  return `
    <a href="${reviewUrl}" 
       class="${buttonClass} btn-learn-more"
       data-card-id="${card.id || card.slug}">
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