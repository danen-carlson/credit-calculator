/**
 * CreditStud.io API — Cloudflare Worker
 *
 * Intercepts /api/* routes on creditstud.io
 * Returns JSON for LLM consumption; everything else falls through to GitHub Pages.
 */

import { handleCompare } from './handlers/compare.js';
import { handleRewards } from './handlers/rewards.js';
import { handleDebtPlanner } from './handlers/debt-planner.js';
import { handleMinPayment } from './handlers/min-payment.js';
import { handleCards } from './handlers/cards.js';
import { handleDocs } from './handlers/docs.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(data, status = 200, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300',
    ...CORS_HEADERS,
    ...extraHeaders,
  };
  return new Response(JSON.stringify(data, null, 2), { status, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Only handle /api/* routes
    if (!path.startsWith('/api/')) {
      return new Response('Not found', { status: 404 });
    }

    // Strip /api prefix to get handler path
    const handlerPath = path.replace(/^\/api/, '').replace(/\/$/, '') || '/';

    let result;
    try {
      switch (handlerPath) {
        case '/':
        case '':
          result = await handleDocs(url);
          break;
        case '/compare':
          result = await handleCompare(url.searchParams, request);
          break;
        case '/rewards':
          result = await handleRewards(url.searchParams, request);
          break;
        case '/debt-planner':
          result = await handleDebtPlanner(url.searchParams, request);
          break;
        case '/min-payment':
          result = await handleMinPayment(url.searchParams, request);
          break;
        case '/cards':
          result = await handleCards(url.searchParams, request);
          break;
        default:
          return jsonResponse({
            error: 'Not found',
            status: 404,
            availableEndpoints: ['/api/compare', '/api/rewards', '/api/debt-planner', '/api/min-payment', '/api/cards'],
            docs: 'https://creditstud.io/api/',
          }, 404);
      }
    } catch (err) {
      return jsonResponse({
        error: 'Internal server error',
        message: err.message,
        status: 500,
      }, 500);
    }

    // Add CORS headers to all responses
    if (result instanceof Response) {
      const newHeaders = new Headers(result.headers);
      for (const [k, v] of Object.entries(CORS_HEADERS)) {
        newHeaders.set(k, v);
      }
      if (!newHeaders.has('Cache-Control')) {
        newHeaders.set('Cache-Control', 'public, max-age=300');
      }
      return new Response(result.body, {
        status: result.status,
        headers: newHeaders,
      });
    }

    return jsonResponse(result);
  },
};