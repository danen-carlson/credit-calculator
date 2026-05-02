import { CREDIT_CARDS } from '../cards-data.js';
import { scoreToTier, getScoreAdjustedApr, getCategoryRewardsRate } from '../engine.js';

export async function handleRewards(params, request) {
  const monthly = parseFloat(params.get('monthly')) || 3000;
  const dining = parseFloat(params.get('dining')) || 0;
  const groceries = parseFloat(params.get('groceries')) || 0;
  const gas = parseFloat(params.get('gas')) || 0;
  const travel = parseFloat(params.get('travel')) || 0;
  const streaming = parseFloat(params.get('streaming')) || 0;
  const online = parseFloat(params.get('online')) || 0;
  const yearView = params.get('yearView') || 'ongoing';

  // Return card reward structures with basic calculations
  // Full per-card rewards calculation requires extraction of client-side DOM logic
  const cards = CREDIT_CARDS.map(card => {
    const pointValue = card.pointValue || card.blendedPointValue || 0.01;
    const rewardTiers = card.rewardTiers || [];

    // Calculate basic annual rewards estimate
    const categoryRates = {};
    for (const tier of rewardTiers) {
      categoryRates[tier.category] = (tier.rate || 0) / 100 * pointValue;
    }

    return {
      id: card.id,
      name: card.name,
      annualFee: card.annualFee || 0,
      rewardTiers,
      signupBonus: card.signupBonus || null,
      pointValue,
      categoryRates,
      deepLink: `https://creditstud.io/rewards/?monthly=${monthly}`,
    };
  });

  return {
    input: { monthly, dining, groceries, gas, travel, streaming, online, yearView },
    cards,
    meta: {
      dataVersion: '2026-05-01',
      calculator: 'rewards',
      disclaimer: 'Reward values are estimates based on published card terms. Actual rewards may vary by category caps and spending patterns. Use the interactive calculator at creditstud.io/rewards for detailed personalized results.',
    },
  };
}