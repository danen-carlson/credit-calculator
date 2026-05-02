import { compareCalculator } from '../engine.js';

export async function handleCompare(params, request) {
  const amount = parseFloat(params.get('amount'));
  const months = params.has('months') ? parseInt(params.get('months')) : null;
  const payment = params.has('payment') ? parseFloat(params.get('payment')) : null;
  const score = params.has('score') ? parseInt(params.get('score')) : null;
  const category = params.get('category') || 'everything';

  if (!amount || amount <= 0 || isNaN(amount)) {
    return {
      error: 'Missing or invalid required parameter: amount (must be a positive number)',
      status: 400,
      docs: 'https://creditstud.io/api/',
      example: '/api/compare?amount=2000&months=12&score=720&category=restaurants',
    };
  }

  if (!months && !payment) {
    return {
      error: 'Provide either months or payment parameter',
      status: 400,
      docs: 'https://creditstud.io/api/',
      example: '/api/compare?amount=2000&months=12',
    };
  }

  const result = compareCalculator({
    amount,
    months: months || 12,
    payment,
    score: score || 700,
    category,
  });

  return result;
}