// Cloudflare Worker: creditstud-email-capture
// Proxies subscription requests to Beehiiv API
// POST /subscribe → Beehiiv subscriptions endpoint

addEventListener('fetch', function(event) {
  event.respondWith(handleRequest(event.request, event));
});

var ALLOWED_ORIGIN = 'https://creditstud.io';
var ALLOWED_ORIGIN_WWW = 'https://www.creditstud.io';
var RATE_LIMIT_WINDOW = 60; // seconds
var RATE_LIMIT_MAX = 5; // requests per window per IP

async function handleRequest(request, event) {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request)
    });
  }

  // Only POST /subscribe
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405, corsHeaders(request));
  }

  var url = new URL(request.url);
  if (url.pathname !== '/subscribe') {
    return jsonResponse({ ok: false, error: 'Not found' }, 404, corsHeaders(request));
  }

  // Rate limiting (KV-based, graceful fallback if KV not bound)
  var clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (EMAIL_RATE_LIMITS) {
    try {
      var rateKey = 'rate:' + clientIP;
      var now = Math.floor(Date.now() / 1000);
      var record = await EMAIL_RATE_LIMITS.get(rateKey, 'json');
      if (record) {
        var elapsed = now - record.windowStart;
        if (elapsed < RATE_LIMIT_WINDOW && record.count >= RATE_LIMIT_MAX) {
          return jsonResponse({ ok: false, error: 'Rate limit exceeded. Try again in a moment.' }, 429, corsHeaders(request));
        }
        if (elapsed >= RATE_LIMIT_WINDOW) {
          await EMAIL_RATE_LIMITS.put(rateKey, JSON.stringify({ windowStart: now, count: 1 }), { expirationTtl: RATE_LIMIT_WINDOW + 10 });
        } else {
          await EMAIL_RATE_LIMITS.put(rateKey, JSON.stringify({ windowStart: record.windowStart, count: record.count + 1 }), { expirationTtl: RATE_LIMIT_WINDOW + 10 });
        }
      } else {
        await EMAIL_RATE_LIMITS.put(rateKey, JSON.stringify({ windowStart: now, count: 1 }), { expirationTtl: RATE_LIMIT_WINDOW + 10 });
      }
    } catch (e) {
      // KV not available or error — pass through with a log
      console.error('Rate limit KV error (passing through):', e.message);
    }
  }

  // Parse body
  var body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ ok: false, error: 'Invalid JSON body' }, 400, corsHeaders(request));
  }

  var email = (body.email || '').trim();
  var source = body.source || '';
  var context = body.context || {};
  var capturedAt = body.captured_at || new Date().toISOString();

  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ ok: false, error: 'Invalid email address' }, 400, corsHeaders(request));
  }

  // Forward to Beehiiv
  var apiKey = BEEHIIV_API_KEY;
  var publicationId = BEEHIIV_PUBLICATION_ID;

  if (!apiKey || !publicationId) {
    console.error('Missing BEEHIIV_API_KEY or BEEHIIV_PUBLICATION_ID');
    return jsonResponse({ ok: false, error: 'Server configuration error' }, 500, corsHeaders(request));
  }

  // Determine utm_source from source URL host
  var utmSource = 'direct';
  try {
    if (source) utmSource = new URL(source).hostname || 'direct';
  } catch (e) { /* keep default */ }

  var beehiivBody = {
    email: email,
    reactivate_existing: true,
    send_welcome_email: true,
    utm_source: utmSource,
    utm_campaign: 'site_capture',
    custom_fields: [
      { name: 'context', value: JSON.stringify(context) },
      { name: 'captured_at', value: capturedAt },
      { name: 'source_url', value: source }
    ]
  };

  try {
    var resp = await fetch('https://api.beehiiv.com/v2/publications/' + publicationId + '/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'Accept': 'application/json'
      },
      body: JSON.stringify(beehiivBody)
    });

    if (resp.ok || resp.status === 201 || resp.status === 202) {
      return jsonResponse({ ok: true }, 200, corsHeaders(request));
    }

    var errBody;
    try { errBody = await resp.json(); } catch (e) { errBody = { message: resp.statusText }; }
    console.error('Beehiiv API error:', resp.status, JSON.stringify(errBody));
    return jsonResponse({ ok: false, error: 'Subscription service error' }, 502, corsHeaders(request));
  } catch (e) {
    console.error('Beehiiv fetch error:', e.message);
    return jsonResponse({ ok: false, error: 'Network error contacting subscription service' }, 502, corsHeaders(request));
  }
}

function corsHeaders(request) {
  var origin = request.headers.get('Origin') || '';
  var allowed = '';
  if (origin === ALLOWED_ORIGIN || origin === ALLOWED_ORIGIN_WWW) {
    allowed = origin;
  }
  return {
    'Access-Control-Allow-Origin': allowed || ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function jsonResponse(data, status, extraHeaders) {
  var headers = Object.assign({ 'Content-Type': 'application/json' }, extraHeaders);
  return new Response(JSON.stringify(data), { status: status, headers: headers });
}