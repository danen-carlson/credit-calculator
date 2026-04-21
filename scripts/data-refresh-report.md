# Credit Data Refresh Report

- **Run:** 2026-04-21T23:10:00.126Z
- **Targets scraped:** 17
- **Changes detected:** 3
- **Errors / blank scrapes:** 4

## 🔔 Changes Detected

### Chase Sapphire Preferred (`chase-sapphire-preferred`)
Source: https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred

| Field | Current | Scraped |
|---|---|---|
| `signupBonus.amount` | `60000` | `75000` |
| `signupBonus.requirement` | `$4` | `5000` |

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
