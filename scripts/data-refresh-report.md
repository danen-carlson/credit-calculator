# Credit Data Refresh Report

- **Run:** 2026-04-27T16:26:08.476Z
- **Targets scraped:** 18
- **Changes detected:** 4
- **Errors / blank scrapes:** 5

## 🔔 Changes Detected

### Chase Sapphire Preferred (`chase-sapphire-preferred`)
Source: https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred

| Field | Current | Scraped |
|---|---|---|
| `signupBonus.requirement` | `$5` | `5000` |

### Chase Freedom Flex (`chase-freedom-flex`)
Source: https://creditcards.chase.com/cash-back-credit-cards/freedom/flex

| Field | Current | Scraped |
|---|---|---|
| `signupBonus.amount` | `500` | `200` |

### Capital One Venture (`capital-one-venture`)
Source: https://www.capitalone.com/credit-cards/venture/

| Field | Current | Scraped |
|---|---|---|
| `signupBonus.requirement` | `$4` | `4000` |

### Zip (Quadpay) (`zip`)
Source: https://zip.co/us/how-it-works

| Field | Current | Scraped |
|---|---|---|
| `numPayments` | `4` | `2` |

## ⚠️ Errors / Blank Scrapes

These targets returned no extractable data. Selectors may be stale or the site may have blocked the request.

- **American Express Gold** (`amex-gold`): manual-check: JS-rendered page, requires manual verification
- **Amex Blue Cash Preferred** (`amex-blue-cash-preferred`): manual-check: JS-rendered page, requires manual verification
- **Amex Blue Cash Everyday** (`amex-blue-cash-everyday`): manual-check: JS-rendered page, requires manual verification
- **Capital One Venture X** (`capital-one-venture-x`): manual-check: JS-rendered page, requires manual verification
- **Klarna Pay in 4** (`klarna-pay4`): no fields extracted (selectors may be stale)
