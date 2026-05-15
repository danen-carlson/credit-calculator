// Personal Loan Rates & Balance Transfer Card Data — CreditStud.io
// Last verified: 2026-05-12
//
// BT cards: btFee = intro/promo BT fee (applies if you transfer within the promo window,
// usually 60-120 days). btFeeStandard = standard fee after that window.
// Most users will hit the intro fee since they transfer right after opening the card.

const LOAN_RATES = {
  excellent: { aprMin: 5.99, aprMax: 12.49, originationMin: 0, originationMax: 3, label: 'Excellent (720+)', examples: ['SoFi', 'LightStream', 'Marcus by Goldman Sachs'] },
  good: { aprMin: 8.99, aprMax: 17.99, originationMin: 1, originationMax: 5, label: 'Good (670-719)', examples: ['Upstart', 'LendingClub', 'Discover'] },
  fair: { aprMin: 14.99, aprMax: 24.99, originationMin: 3, originationMax: 6, label: 'Fair (580-669)', examples: ['OneMain Financial', 'Avant', 'Upstart'] },
  poor: { aprMin: 20.99, aprMax: 35.99, originationMin: 5, originationMax: 8, label: 'Poor (<580)', examples: ['OneMain Financial', 'Avant'] }
};

const BT_CARDS = [
  {
    name: 'Citi Diamond Preferred',
    issuer: 'Citi',
    introAPR: 0,
    introMonths: 21,
    btFee: 3,           // Intro: 3% (first 4 months)
    btFeeStandard: 5,    // Standard: 5% after
    introFeeWindowDays: 120,
    btFeeMin: 5,
    regularAPR: 18.24,
    regularAPRRange: '18.24% - 28.99% Variable',
    minCredit: 'good',
    creditScoreRange: '670-739',
    affiliateLink: '',
    highlights: ['0% intro APR for 21 months on BT', 'No annual fee', '0% intro APR for 12 months on purchases', '3% intro BT fee (first 4 months), then 5%']
  },
  {
    name: 'Wells Fargo Reflect',
    issuer: 'Wells Fargo',
    introAPR: 0,
    introMonths: 21,
    btFee: 3,           // Intro: 3% (first 120 days)
    btFeeStandard: 5,
    introFeeWindowDays: 120,
    btFeeMin: 5,
    regularAPR: 17.49,
    regularAPRRange: '17.49% - 29.49% Variable',
    minCredit: 'good',
    creditScoreRange: '670-739',
    affiliateLink: '',
    highlights: ['0% intro APR for up to 21 months on BT', 'No annual fee', '3% intro BT fee (first 120 days), then 5%', 'Up to $600 cell phone protection']
  },
  {
    name: 'Citi Simplicity',
    issuer: 'Citi',
    introAPR: 0,
    introMonths: 21,
    btFee: 3,
    btFeeStandard: 5,
    introFeeWindowDays: 120,
    btFeeMin: 5,
    regularAPR: 19.24,
    regularAPRRange: '19.24% - 29.99% Variable',
    minCredit: 'good',
    creditScoreRange: '670-739',
    affiliateLink: '',
    highlights: ['0% intro APR for 21 months on BT', 'No late fees ever', 'No annual fee', 'No penalty APR', '3% intro BT fee, then 5%']
  },
  {
    name: 'Chase Slate Edge',
    issuer: 'Chase',
    introAPR: 0,
    introMonths: 18,
    btFee: 3,
    btFeeStandard: 5,
    introFeeWindowDays: 60,
    btFeeMin: 5,
    regularAPR: 20.49,
    regularAPRRange: '20.49% - 28.99% Variable',
    minCredit: 'good',
    creditScoreRange: '670-739',
    affiliateLink: '',
    highlights: ['0% intro APR for 18 months on BT', '3% intro BT fee (first 60 days), then 5%', 'No annual fee']
  },
  {
    name: 'Bank of America Customized Cash',
    issuer: 'Bank of America',
    introAPR: 0,
    introMonths: 15,
    btFee: 3,
    btFeeStandard: 4,
    introFeeWindowDays: 60,
    btFeeMin: 10,
    regularAPR: 19.24,
    regularAPRRange: '19.24% - 29.24% Variable',
    minCredit: 'good',
    creditScoreRange: '670-739',
    affiliateLink: '',
    highlights: ['0% intro APR for 15 billing cycles on BT', '3% cash back in choice category', 'No annual fee']
  },
  {
    name: 'Discover it Balance Transfer',
    issuer: 'Discover',
    introAPR: 0,
    introMonths: 15,
    btFee: 3,
    btFeeStandard: 5,
    introFeeWindowDays: 120,
    btFeeMin: 0,
    regularAPR: 18.24,
    regularAPRRange: '18.24% - 27.24% Variable',
    minCredit: 'good',
    creditScoreRange: '670-739',
    affiliateLink: '',
    highlights: ['0% intro APR for 15 months on BT', 'Cashback Match in first year', 'No annual fee']
  },
  {
    name: 'Capital One Quicksilver',
    issuer: 'Capital One',
    introAPR: 0,
    introMonths: 15,
    btFee: 3,
    btFeeStandard: 4,
    introFeeWindowDays: 60,
    btFeeMin: 0,
    regularAPR: 19.99,
    regularAPRRange: '19.99% - 29.99% Variable',
    minCredit: 'fair',
    creditScoreRange: '580-739',
    affiliateLink: '',
    highlights: ['0% intro APR for 15 months on BT', '1.5% cash back on everything', 'No annual fee']
  },
  {
    name: 'Amex EveryDay',
    issuer: 'Amex',
    introAPR: 0,
    introMonths: 15,
    btFee: 3,
    btFeeStandard: 3, // Amex generally doesn't tier BT fees
    introFeeWindowDays: 60,
    btFeeMin: 5,
    regularAPR: 18.49,
    regularAPRRange: '18.49% - 29.49% Variable',
    minCredit: 'good',
    creditScoreRange: '670-739',
    affiliateLink: '',
    highlights: ['0% intro APR for 15 months on BT', '2x points at supermarkets', 'No annual fee', '3% flat BT fee']
  }
];

// Export for Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LOAN_RATES, BT_CARDS };
}