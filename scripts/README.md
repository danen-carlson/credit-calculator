# Data Refresh System

Weekly automated refresh of card and BNPL offer data for CreditStud.io.

## What it does

1. **Scrapes** card/BNPL provider pages (targets defined in `targets.json`)
2. **Extracts** key fields (signup bonuses, annual fees, interest rates, payment terms) via regex on page text
3. **Diffs** against current `rewards/cards-data.js` and `data.js`
4. **Writes** a report (`data-refresh-report.md`)
5. **Opens a PR** via GitHub Actions when changes are detected

The PR contains only the refresh report for human review. Data files are **not** auto-edited — a human reviews scraped values and updates the source of truth manually. This prevents bad scrapes (broken selectors, promo text masquerading as offers) from corrupting production data.

## Schedule

- Weekly: every Monday at 15:00 UTC (8:00 AM PT)
- Manual: run `workflow_dispatch` from the Actions tab for ad-hoc checks

## Local usage

```bash
# Dry run — scrape + print report, don't write files
node scripts/refresh-data.mjs --dry-run

# Normal run — scrape, write report, exit 1 if changes
node scripts/refresh-data.mjs

# Scrape a single target
node scripts/refresh-data.mjs --target=chase-sapphire-preferred
```

Exit codes:
- `0` — no changes detected
- `1` — changes detected (CI opens a PR)
- `2` — framework error (something broke badly)

## Adding a new target

Edit `scripts/targets.json`:

```json
{
  "id": "new-card-id",              // must match id in cards-data.js or data.js
  "name": "Friendly Name",
  "url": "https://issuer.com/card-page",
  "fields": {
    "annualFee": "regex:\\$(\\d+)\\s*annual fee",
    "signupBonus.amount": "regex:(\\d[\\d,]*)\\s*bonus"
  }
}
```

Field rules use the `regex:<pattern>` syntax. The first capture group (or full match if no group) becomes the scraped value. Numbers are auto-coerced. Nested dot-paths like `signupBonus.amount` are read/compared against the existing record.

## When a scrape goes blank

If a target returns no extracted fields, the selector probably broke (site redesigned, anti-bot challenge, etc.). Update the regex in `targets.json` and commit. The report will flag blank scrapes in the "Errors / Blank Scrapes" section.

## Rate limiting & politeness

- 2s delay between requests
- 20s timeout per request
- Descriptive User-Agent identifying the bot
- Respects `robots.txt` in spirit (no aggressive crawling; only the specific landing page per target)

## Future: Option C (affiliate feeds)

Once enrolled in CJ Affiliate / Impact / FlexOffers / Bankrate publisher programs, their daily feeds can supplement this scraper. The adapter layer would live in `scripts/feeds/` alongside `scripts/scrapers/`.
