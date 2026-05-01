# AI Crawler Monitoring Strategy for CreditStud.io

Since creditstud.io is on GitHub Pages (no access to server logs), we have two options:

## Option 1: Cloudflare Analytics (Recommended — once DNS propagates)

Once Cloudflare is active, we get access to:
- **Bot Analytics** — shows which bots visited, response codes, paths
- **Web Analytics** — page views, referrers
- **Firewall Events** — any blocked requests

Watch for these AI user agents:
- GPTBot (OpenAI)
- PerplexityBot (Perplexity)
- ClaudeBot (Anthropic)
- CCBot (Common Crawl)
- Google-Extended (Google AI training)
- Applebot-Extended (Apple AI)
- Bytespider (ByteDance/TikTok)
- FacebookBot (Meta AI)

### How to check:
1. Cloudflare Dashboard → creditstud.io → Security → Bots
2. Cloudflare Dashboard → creditstud.io → Analytics → Traffic
3. Filter by User Agent containing: GPTBot, PerplexityBot, ClaudeBot, etc.

## Option 2: JS Beacon (Works now, lightweight)

Add a small JS snippet to all pages that:
1. Detects if the request might be from a headless browser (AI crawler)
2. Sends a ping to a lightweight endpoint (Cloudflare Worker)
3. Logs the User-Agent + page URL

This is less reliable than server logs (only detects JS-capable crawlers, not simple HTTP fetchers).

## Option 3: Use the Cloudflare Worker

The API Worker at `/api/*` already logs requests. Once DNS propagates, check:
```bash
# View Worker analytics
wrangler tail creditstud-api
# Or check Cloudflare Dashboard → Workers → creditstud-api → Logs
```

## Recommended: Wait for Cloudflare, then use Bot Analytics

The cleanest approach is to wait for DNS propagation and then use Cloudflare's built-in Bot Analytics dashboard. No code needed.

For now:
- robots.txt explicitly allows all AI crawlers ✓
- llms.txt is accessible ✓
- OpenAPI spec is available ✓
- JSON API is ready ✓