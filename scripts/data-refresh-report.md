# Credit Data Refresh Report

- **Run:** 2026-04-20T16:08:42.750Z
- **Targets scraped:** 17
- **Changes detected:** 3
- **Errors / blank scrapes:** 11

## 🔔 Changes Detected

### Capital One Venture (`capital-one-venture`)
Source: https://www.capitalone.com/credit-cards/venture/

| Field | Current | Scraped |
|---|---|---|
| `signupBonus.requirement` | `$4` | `4000` |

### Affirm Pay in 4 (`affirm-pay4`)
Source: https://www.affirm.com/how-it-works

| Field | Current | Scraped |
|---|---|---|
| `interestRate` | `0` | `36` |

### Zip (Quadpay) (`zip`)
Source: https://zip.co/us/how-it-works

| Field | Current | Scraped |
|---|---|---|
| `numPayments` | `4` | `2` |

## ⚠️ Errors / Blank Scrapes

These targets returned no extractable data. Selectors may be stale or the site may have blocked the request.

- **Chase Sapphire Preferred** (`chase-sapphire-preferred`): fetch failed: HTTP 404
- **Chase Freedom Flex** (`chase-freedom-flex`): fetch failed: HTTP 404
- **American Express Gold** (`amex-gold`): no fields extracted (selectors may be stale)
- **Amex Blue Cash Preferred** (`amex-blue-cash-preferred`): no fields extracted (selectors may be stale)
- **Amex Blue Cash Everyday** (`amex-blue-cash-everyday`): no fields extracted (selectors may be stale)
- **Capital One Venture X** (`capital-one-venture-x`): no fields extracted (selectors may be stale)
- **Citi Custom Cash** (`citi-custom-cash`): fetch failed: fetch failed
- **Wells Fargo Active Cash** (`wells-fargo-active-cash`): fetch failed: HTTP 404
- **Klarna Pay in 4** (`klarna-pay4`): no fields extracted (selectors may be stale)
- **Afterpay** (`afterpay`): no fields extracted (selectors may be stale)
- **PayPal Pay in 4** (`paypal-pay4`): fetch failed: HTTP 404
