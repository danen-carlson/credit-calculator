import { minPaymentCalculator } from '../engine.js';

export async function handleMinPayment(params, request) {
  const balance = parseFloat(params.get('balance'));
  const apr = parseFloat(params.get('apr'));
  const minPct = params.has('minPct') ? parseFloat(params.get('minPct')) : 2;

  if (!balance || balance <= 0 || isNaN(balance)) {
    return {
      error: 'Missing or invalid required parameter: balance (must be a positive number)',
      status: 400,
      docs: 'https://creditstud.io/api/',
      example: '/api/min-payment?balance=5000&apr=22.24',
    };
  }

  if (!apr || apr < 0 || isNaN(apr)) {
    return {
      error: 'Missing or invalid required parameter: apr (must be a non-negative number)',
      status: 400,
      docs: 'https://creditstud.io/api/',
      example: '/api/min-payment?balance=5000&apr=22.24',
    };
  }

  return minPaymentCalculator({ balance, apr, minPct });
}