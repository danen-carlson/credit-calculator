# CreditStud.io JSON API — Cloudflare Worker Spec

## Architecture

```
creditstud.io (GitHub Pages)
    ├── /compare/          → HTML (static)
    ├── /rewards/           → HTML (static)
    ├── /debt-planner/      → HTML (static)
    ├── ...                 → HTML (static)
    └── /data/cards.json    → static JSON (build output)

creditstud.io/api/* (Cloudflare Worker)
    ├── /api/compare        → JSON
    ├── /api/rewards         → JSON
    ├── /api/debt-planner    → JSON
    ├── /api/min-payment     → JSON
    ├── /api/cards           → JSON (card data)
    └── /api/                → HTML docs page (same as /tools/)
```

The Worker intercepts `/api/*` requests. Everything else falls through to GitHub Pages (origin). Same domain, same SSL, same CORS origin.

---

## Endpoints

### 1. `GET /api/compare`

Compare credit cards, BNPL services, and payment plans side by side.

**Params:**
| Param | Type | Required | Example | Description |
|-------|------|----------|---------|-------------|
| `amount` | number | yes* | 2000 | Purchase amount in dollars |
| `months` | number | yes* | 12 | Payoff timeline in months |
| `payment` | number | yes* | 200 | Monthly payment (use instead of months) |
| `score` | integer | no | 720 | Credit score (350–850, default 700) |
| `category` | string | no | restaurants | Purchase category |

*One of `months` or `payment` required. If `payment` given, switches to payment mode.

**Response:**
```json
{
  "input": {
    "amount": 2000,
    "months": 12,
    "creditScore": 720,
    "category": "restaurants",
    "payoffMode": "months"
  },
  "results": [
    {
      "name": "Chase Sapphire Preferred",
      "type": "credit-card",
      "totalCost": 2107.42,
      "interestPaid": 107.42,
      "fees": 0,
      "rewardsEarned": 120.00,
      "netCost": 1987.42,
      "monthlyPayment": 175.62,
      "apr": 22.24,
      "verdict": "Best for travel and dining",
      "deepLink": "https://creditstud.io/compare/?amount=2000&months=12&score=720&category=restaurants"
    },
    {
      "name": "Klarna Pay-in-4",
      "type": "bnpl-pay4",
      "totalCost": 2000.00,
      "interestPaid": 0,
      "fees": 0,
      "rewardsEarned": 0,
      "netCost": 2000.00,
      "monthlyPayment": 500.00,
      "apr": 0,
      "verdict": "Interest-free if you pay on time",
      "deepLink": "https://creditstud.io/compare/?amount=2000&months=12&score=720&category=restaurants"
    }
  ],
  "meta": {
    "dataVersion": "2026-04-28",
    "calculator": "compare",
    "disclaimer": "Estimates based on published card terms. Actual terms may vary. See creditstud.io for full details."
  }
}
```

### 2. `GET /api/rewards`

Calculate rewards value for credit cards based on monthly spending.

**Params:**
| Param | Type | Required | Example | Description |
|-------|------|----------|---------|-------------|
| `monthly` | number | yes | 3000 | Total monthly spend |
| `dining` | number | no | 300 | Monthly dining spend |
| `groceries` | number | no | 400 | Monthly grocery spend |
| `gas` | number | no | 150 | Monthly gas spend |
| `travel` | number | no | 200 | Monthly travel spend |
| `streaming` | number | no | 50 | Monthly streaming spend |
| `online` | number | no | 500 | Monthly online spend |
| `yearView` | string | no | "first" | "first" (incl. signup bonus) or "ongoing" (default) |

**Response:**
```json
{
  "input": { "monthly": 3000, "dining": 300, "yearView": "ongoing" },
  "results": [
    {
      "name": "Chase Sapphire Preferred",
      "annualRewards": 820,
      "annualFee": 95,
      "netValue": 725,
      "signupBonus": 75000,
      "signupBonusValue": 937.50,
      "deepLink": "https://creditstud.io/rewards/?monthly=3000&category=dining"
    }
  ],
  "meta": { "dataVersion": "2026-04-28", "calculator": "rewardsc" }
}
```

### 3. `GET /api/debt-planner`

Snowball vs avalanche debt payoff calculator.

**Params:**
| Param | Type | Required | Example | Description |
|-------|------|----------|---------|-------------|
| `debts` | JSON string | yes | see below | JSON array of debts |
| `extra` | number | no | 200 | Extra monthly payment |

**`debts` format:** `[{"name":"Card 1","balance":5000,"apr":22.24,"minPayment":125}]`

**Response:**
```json
{
  "input": { "debts": [...], "extra": 200 },
  "results": {
    "snowball": { "totalInterest": 1842, "totalPaid": 6842, "monthsFree": 28, "monthByMonth": [...] },
    "avalanche": { "totalInterest": 1620, "totalPaid": 6620, "monthsFree": 26, "monthByMonth": [...] },
    "savingsVsMin": 2340
  },
  "meta": { "dataVersion": "2026-04-28", "calculator": "debt-planner" }
}
```

### 4. `GET /api/min-payment`

Calculate the true cost of making only minimum payments.

**Params:**
| Param | Type | Required | Example | Description |
|-------|------|----------|---------|-------------|
| `balance` | number | yes | 5000 | Current balance |
| `apr` | number | yes | 22.24 | Annual percentage rate |
| `minPaymentPct` | number | no | 2 | Minimum payment as % of balance |

**Response:**
```json
{
  "input": { "balance": 5000, "apr": 22.24, "minPaymentPct": 2 },
  "results": {
    "totalPaid": 12647,
    "totalInterest": 7647,
    "monthsToPayoff": 211,
    "monthlyPayment": { "first": 100, "last": 50.02, "average": 60.03 }
  },
  "meta": { "dataVersion": "2026-04-28", "calculator": "min-payment" }
}
```

### 5. `GET /api/cards`

Return the full card database as structured JSON. This is the same data that powers the site.

**No params.**

**Response:** Array of card objects with all terms, rates, fees, and rewards data.

```json
{
  "cards": [ ... ],
  "meta": { "dataVersion": "2026-04-28", "count": 28 }
}
```

### 6. `GET /api/`

Human-readable API documentation page. Lists all endpoints, params, and example requests with copy-paste curl commands. Links from `llms.txt`.

---

## Worker Implementation

### File Structure

```
creditstud-api/
├── wrangler.toml             # Cloudflare config
├── src/
│   ├── index.js             # Router + CORS + error handling
│   ├── calc.js              # Pure calc functions (symlinked from main repo)
│   ├── data.js              # Card/BNPL database (symlinked from main repo)
│   └── handlers/
│       ├── compare.js       # /api/compare handler
│       ├── rewards.js       # /api/rewards handler
│       ├── debt-planner.js  # /api/debt-planner handler
│       ├── min-payment.js   # /api/min-payment handler
│       └── cards.js         # /api/cards handler
└── package.json
```

### Key Design Decisions

1. **Shared calculation logic** — The Worker imports the same `calc.js` and `data.js` from the main repo. No duplication. When you update card data, both the site and API get it.

2. **No DOM dependencies** — `calc.js` and `data.js` are pure JS (verified: zero DOM references). Rewards and debt-planner have DOM mixed in, so those handlers extract just the math functions.

3. **CORS** — All responses include `Access-Control-Allow-Origin: *` and handle OPTIONS preflight. LLMs and third-party devs can call from anywhere.

4. **Rate limiting** — Cloudflare free tier includes 100K req/day. Add a simple in-worker rate limiter (10 req/min per IP) if abuse becomes an issue. Probably won't.

5. **Caching** — Responses include `Cache-Control: public, max-age=300` (5 min). Cloudflare caches at the edge. Card data changes weekly, so 5 min is fine.

6. **Error format:**
```json
{
  "error": "Missing required parameter: amount",
  "status": 400,
  "docs": "https://creditstud.io/api/"
}
```

7. **Versioning** — All responses include `meta.dataVersion` matching the site's "Rates as of [date]" stamp. Future breaking changes go to `/api/v2/compare` etc.

### Router (src/index.js)

```javascript
import { handleCompare } from './handlers/compare.js';
import { handleRewards } from './handlers/rewards.js';
import { handleDebtPlanner } from './handlers/debt-planner.js';
import { handleMinPayment } from './handlers/min-payment.js';
import { handleCards } from './handlers/cards.js';

const DOCS_HTML = `<!DOCTYPE html>...`; // API documentation page

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Route /api/* requests
    const path = url.pathname.replace('/api', '').replace(/\/$/, '');
    
    let handler;
    switch (path) {
      case '':           handler = () => new Response(DOCS_HTML, { headers: { 'Content-Type': 'text/html' } }); break;
      case '/compare':   handler = handleCompare; break;
      case '/rewards':   handler = handleRewards; break;
      case '/debt-planner': handler = handleDebtPlanner; break;
      case '/min-payment':  handler = handleMinPayment; break;
      case '/cards':      handler = handleCards; break;
      default:
        return jsonResponse({ error: 'Not found', status: 404 }, 404);
    }

    try {
      const response = await handler(url.searchParams, request);
      // Add CORS headers to all responses
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Cache-Control', 'public, max-age=300');
      return new Response(response.body, { status: response.status, headers });
    } catch (err) {
      return jsonResponse({ error: err.message, status: 500 }, 500);
    }
  },
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### Compare Handler Example (src/handlers/compare.js)

```javascript
import { calculateOptions } from '../calc.js';
import { PAYMENT_METHODS } from '../data.js';

export function handleCompare(params) {
  const amount = parseFloat(params.get('amount'));
  const months = params.has('months') ? parseInt(params.get('months')) : null;
  const payment = params.has('payment') ? parseFloat(params.get('payment')) : null;
  const score = parseInt(params.get('score')) || 700;
  const category = params.get('category') || 'everything';

  if (!amount || amount <= 0) {
    return jsonResponse({ error: 'Missing required parameter: amount', status: 400, docs: 'https://creditstud.io/api/' }, 400);
  }
  if (!months && !payment) {
    return jsonResponse({ error: 'Provide either months or payment parameter', status: 400 }, 400);
  }

  const options = calculateOptions({
    amount,
    creditScore: scoreToTier(score),
    targetMonths: months,
    monthlyPaymentMode: !!payment,
    monthlyPmtValue: payment,
    purchaseCategory: category,
    selectedMethods: new Set(PAYMENT_METHODS.map(m => m.id)),
    isWorstCase: false,
  });

  // Transform results for API output
  const results = options.results.map(r => ({
    name: r.name,
    type: r.type,
    totalCost: r.totalCost,
    interestPaid: r.interestPaid,
    fees: r.fees || 0,
    rewardsEarned: r.rewardsEarned || 0,
    netCost: r.netCost,
    monthlyPayment: r.monthlyPayment,
    apr: r.apr,
    verdict: r.verdict,
    deepLink: `https://creditstud.io/compare/?amount=${amount}&${months ? `months=${months}` : `payment=${payment}`}&score=${score}&category=${category}`,
  }));

  return jsonResponse({
    input: { amount, months, creditScore: score, category, payoffMode: payment ? 'payment' : 'months' },
    results,
    meta: { dataVersion: DATA_VERSION, calculator: 'compare', disclaimer: 'Estimates based on published card terms. Actual terms may vary.' },
  });
}
```

---

## Deployment Steps (Dane's side)

### Prerequisites
- Cloudflare account (you already have one for the tunnel)
- The Workers free plan (100K requests/day, more than enough)

### Step 1: Create the Worker

1. Go to **cloudflare.com → Workers & Pages → Create**
2. Name it `creditstud-api`
3. Select "Hello World" starter

### Step 2: Configure the Route

1. Go to **Workers → creditstud-api → Settings → Triggers → Routes**
2. Add route: `creditstud.io/api/*`
3. Zone: `creditstud.io`

This tells Cloudflare: "When a request hits `creditstud.io/api/*`, send it to the Worker instead of GitHub Pages."

### Step 3: Set GitHub Pages as the Worker's Origin

In `wrangler.toml`:
```toml
name = "creditstud-api"
main = "src/index.js"
compatibility_date = "2026-05-01"

# Route /api/* to this Worker, everything else goes to GitHub Pages
routes = [
  { pattern = "creditstud.io/api/*", zone_name = "creditstud.io" }
]
```

**Important:** Since creditstud.io DNS already points to GitHub Pages (via CNAME or Cloudflare proxy), the Worker needs a "fallback route" setup. The Worker only intercepts `/api/*`. All other traffic flows to GitHub Pages as before.

### Step 4: Deploy the Code

Option A — **Wrangler CLI** (recommended):
```bash
npm install -g wrangler
wrangler login
cd creditstud-api/
wrangler deploy
```

Option B — **Cloudflare Dashboard** (quick start):
Paste the Worker code directly in the dashboard editor. Good for testing, but wrangler is better for ongoing dev.

### Step 5: Update llms.txt

Add to the end of `/llms.txt`:

```
## JSON API

CreditStud.io provides a JSON API for programmatic access. LLMs and developers can call these endpoints directly:

- GET /api/compare?amount=2000&months=12&score=720&category=restaurants
- GET /api/rewards?monthly=3000&dining=300
- GET /api/debt-planner?debts=[...]&extra=200
- GET /api/min-payment?balance=5000&apr=22.24
- GET /api/cards — Full card database as JSON

Full documentation: https://creditstud.io/api/
All endpoints return JSON, accept CORS, and require no authentication.
```

### Step 6: Verify

```bash
# Should return JSON
curl https://creditstud.io/api/compare?amount=2000&months=12&score=720

# Should return HTML (GitHub Pages still works)
curl https://creditstud.io/compare/?amount=2000&months=12&score=720
```

---

## What Hank Will Build

I'll create the Worker project in the credit-calculator repo:

1. **`/api/worker/`** — Worker source code (separate from static site)
2. **`/api/worker/src/handlers/`** — One handler per endpoint
3. **Shared logic** — Symlink or copy `calc.js` and `data.js` into the worker build
4. **`wrangler.toml`** — Deployment config
5. **`/api/worker/package.json`** — Dependencies (none beyond wrangler)
6. **Documentation handler** — The `/api/` page that lists all endpoints

The handlers will extract the pure math from `calc.js` (which has zero DOM deps) and adapt the rewards/debt-planner math into standalone functions.

### Estimated Effort

| Task | Time |
|------|------|
| Worker scaffold (router, CORS, error handling) | 30 min |
| Compare handler | 1 hr |
| Rewards handler (extract math from DOM-heavy file) | 1.5 hrs |
| Debt-planner handler (extract math from DOM-heavy file) | 1.5 hrs |
| Min-payment handler | 30 min |
| Cards handler (static JSON) | 15 min |
| Documentation page | 30 min |
| Testing & edge cases | 1 hr |
| **Total** | **~6.5 hrs** |

This can be split across Sprint 2 (JSON API) and Sprint 4 (/data/cards.json + /tools/ docs page) per the sprint plan, or done all at once.

---

## Security Notes

- **No auth required** — This is public calculator data, same as the website
- **Rate limiting** — 10 req/min per IP should be plenty (can add later if needed)
- **No PII** — Calculations are stateless, no user data stored
- **Input validation** — All numeric params are clamped to sane ranges
- **Cost** — Free tier covers ~3M requests/month. You'll never hit that.