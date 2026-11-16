# Credit Data Refresh Report

- **Run:** 2026-11-16T23:38:52.654Z
- **Targets scraped:** 18
- **Changes detected:** 7
- **Errors / blank scrapes:** 5

## 🔔 Changes Detected

### Chase Sapphire Preferred (`chase-sapphire-preferred`)
Source: https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred

| Field | Current | Scraped |
|---|---|---|
| `signupBonus.amount` | `75000` | `100000` |
| `signupBonus.requirement` | `$5` | `6000` |

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

### Wells Fargo Active Cash (`wells-fargo-active-cash`)
Source: https://creditcards.wellsfargo.com/active-cash-credit-card

| Field | Current | Scraped |
|---|---|---|
| `signupBonus.amount` | `200` | `100` |

### Amazon Prime Rewards Visa Signature (`amazon-prime-visa`)
Source: https://creditcards.chase.com/cash-back-credit-cards/amazon-prime-rewards

| Field | Current | Scraped |
|---|---|---|
| `signupBonus.amount` | `150` | `200` |

### Afterpay (`afterpay`)
Source: https://www.afterpay.com/en-US/how-it-works

| Field | Current | Scraped |
|---|---|---|
| `intervalDays` | `14` | `2` |

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
