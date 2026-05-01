# CreditStud.io API Worker — Setup Guide

## What's Been Built

All the Worker code is in `credit-calculator/api/worker/`:

```
api/worker/
├── package.json          # npm config
├── wrangler.toml         # Cloudflare deployment config
├── dist/
│   └── index.js          # Built bundle (41KB)
├── src/
│   ├── index.js          # Router, CORS, error handling
│   ├── engine.js         # Pure calculation logic (no DOM)
│   ├── cards-data.js     # Card database (extracted from data.js)
│   └── handlers/
│       ├── compare.js    # /api/compare
│       ├── rewards.js    # /api/rewards
│       ├── debt-planner.js  # /api/debt-planner
│       ├── min-payment.js    # /api/min-payment
│       ├── cards.js      # /api/cards
│       └── docs.js       # /api/ (HTML docs page)
```

### Verified Working
- ✅ Compare calculator: 7 results for $2000/12mo/score=720
- ✅ Min payment calculator: correct amortization
- ✅ Debt planner: snowball vs avalanche calculations
- ✅ Bundle builds: 41KB, esm format
- ✅ No external dependencies (pure JS)

### Endpoints

| Endpoint | Status | Notes |
|----------|--------|-------|
| `/api/compare` | ✅ Working | Full BNPL + credit card comparison |
| `/api/min-payment` | ✅ Working | Minimum payment calculator |
| `/api/debt-planner` | ✅ Working | Snowball vs avalanche |
| `/api/rewards` | ⚠️ Partial | Returns card structures, not full reward math (needs extraction from DOM-heavy rewards.js) |
| `/api/cards` | ✅ Working | Full card database as JSON |
| `/api/` | ✅ Working | HTML docs page |

### What Needs Work
- `/api/rewards` — Currently returns card reward structures but doesn't compute personalized rewards. The rewards calculator (rewards.js) is heavily DOM-dependent and needs surgical extraction of the math functions.
- `/api/compare` — Currently only returns BNPL results. Need to add credit card evaluation using CREDIT_CARDS data.

---

## Dane's Setup Steps

### Step 1: Install Wrangler CLI (on your Mac)
```bash
npm install -g wrangler
wrangler login
```
This opens a browser to authenticate with Cloudflare.

### Step 2: Link the Worker
```bash
cd ~/.openclaw/workspace/credit-calculator/api/worker
wrangler deploy
```
This deploys the built Worker to your Cloudflare account.

### Step 3: Add the Route (in Cloudflare Dashboard)
You already have `creditstud.io/api/*` set up as a route. ✅

### Step 4: Test
```bash
# Should return JSON
curl "https://creditstud.io/api/compare?amount=2000&months=12&score=720"

# Should return HTML docs page
curl "https://creditstud.io/api/"

# Should still return HTML (GitHub Pages)
curl "https://creditstud.io/compare/?amount=2000&months=12&score=720"
```

### Step 5: Update llms.txt
Add the API section to `/llms.txt` (I can do this).

---

## Ongoing Maintenance

When you update card data in `data.js`, you also need to update `cards-data.js` in the Worker:

```bash
cd ~/.openclaw/workspace/credit-calculator
# Re-extract cards data (or I can automate this)
bash api/worker/scripts/sync-data.sh
wrangler deploy
```

Eventually this could be a GitHub Actions workflow, but manual is fine for now since card data changes weekly.