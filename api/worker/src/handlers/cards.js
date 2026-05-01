import { CREDIT_CARDS } from '../cards-data.js';

export async function handleCards(params, request) {
  const fields = params.get('fields');
  const id = params.get('id');

  let cards = CREDIT_CARDS;

  // Filter by specific card ID
  if (id) {
    const card = cards.find(c => c.id === id);
    if (!card) {
      return {
        error: `Card not found: ${id}`,
        status: 404,
        availableIds: cards.map(c => c.id),
      };
    }
    cards = [card];
  }

  // Strip affiliate links and internal fields for API
  const cleanCards = cards.map(card => {
    const { affiliateLink, affiliateNetwork, ...rest } = card;
    return rest;
  });

  // Optionally limit fields
  let result = cleanCards;
  if (fields) {
    const fieldList = fields.split(',').map(f => f.trim());
    result = cleanCards.map(card => {
      const filtered = {};
      for (const f of fieldList) {
        if (card[f] !== undefined) filtered[f] = card[f];
      }
      return filtered;
    });
  }

  return {
    cards: result,
    meta: {
      dataVersion: '2026-05-01',
      count: result.length,
      disclaimer: 'Card terms are updated weekly. Verify current terms with the issuer before applying.',
    },
  };
}