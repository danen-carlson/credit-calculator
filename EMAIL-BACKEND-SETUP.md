# Email Backend Setup — CreditStud.io → Beehiiv via Cloudflare Worker

This guide walks you through wiring the credit calculator email capture to Beehiiv (your ESP) through a Cloudflare Worker.

## Prerequisites

- A [Beehiiv](https://beehiiv.com) account with a publication
- A Cloudflare account with Workers enabled
- `wrangler` CLI installed (`npm install -g wrangler`)

---

## Step 1: Get your Beehiiv API credentials

1. Log in to Beehiiv → **Settings** → **API**
2. Click **Generate API Key** — copy it somewhere safe
3. Note your **Publication ID** (found in Settings → General, format: `pub_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

You now have:
- `BEEHIIV_API_KEY` — your API key
- `BEEHIIV_PUBLICATION_ID` — your publication ID

## Step 2: Deploy the Cloudflare Worker

```bash
# Install wrangler if you haven't
npm install -g wrangler

# Log in to Cloudflare
wrangler login

# Navigate to the workers directory
cd workers/

# Set secrets (these are encrypted, never appear in code)
wrangler secret put BEEHIIV_API_KEY
# → paste your API key when prompted

wrangler secret put BEEHIIV_PUBLICATION_ID
# → paste your publication ID when prompted
```

### Optional: Enable KV rate limiting

```bash
# Create a KV namespace
wrangler kv:namespace create "EMAIL_RATE_LIMITS"

# Copy the `id` from the output, then uncomment the [[kv_namespaces]]
# section in wrangler.toml and paste the id
```

### Deploy

```bash
wrangler deploy
```

After deploy, note the Worker URL (e.g., `https://creditstud-email-capture.<your-subdomain>.workers.dev`).

## Step 3: Configure the site endpoint

In your credit calculator site, add this **before** the email-capture.js script tag:

```html
<script>
  window.CREDITSTUD_EMAIL_ENDPOINT = 'https://creditstud-email-capture.<your-subdomain>.workers.dev/subscribe';
</script>
```

Or, if you route through your own domain (recommended):

```html
<script>
  window.CREDITSTUD_EMAIL_ENDPOINT = 'https://creditstud.io/api/subscribe';
</script>
```

## Step 4: Set up routes (custom domain, recommended)

1. In `wrangler.toml`, uncomment the `[[routes]]` section and set your domain
2. In Cloudflare Dashboard → your domain → Workers Routes, add:
   - Pattern: `creditstud.io/api/subscribe*` → Worker: `creditstud-email-capture`
   - Pattern: `www.creditstud.io/api/subscribe*` → Worker: `creditstud-email-capture`
3. Re-deploy: `wrangler deploy`

## Step 5: Test

1. Load any calculator page on creditstud.io
2. Submit an email in the modal or inline capture
3. Check Beehiiv → **Subscribers** for the new entry
4. Check the browser console for any errors
5. Test `?admin=emails` to see local storage status (synced column should show ✓)

## Step 6: Verify in production

- Submit a real email → should see "✓ Subscribed!" in the UI
- Check Beehiiv dashboard for the subscriber
- Try a duplicate email → should reactivate (not error)
- Try an invalid email → should show validation error inline

---

## How it works

```
Browser (email-capture.js)
  → POST /subscribe { email, source, context, captured_at }
  → Cloudflare Worker (validates, rate-limits)
  → POST Beehiiv API v2/publications/{id}/subscriptions
  → { ok: true } back to browser
```

If the backend fails, the client falls back to `localStorage` and retries aren't automatic (the next submission will push again). The `?admin=emails` panel shows which emails are synced vs local-only.

---

## Switching to Resend or ConvertKit

### Resend

Resend is transactional email, not a newsletter ESP — but you can use it to add contacts to an audience:

**Worker changes:**
- URL: `https://api.resend.com/audiences/{audience_id}/contacts`
- Header: `Authorization: Bearer ${RESEND_API_KEY}`
- Body: `{ email, first_name: '', audience_id }`
- No concept of `reactivate_existing` or `send_welcome_email`
- Set secrets: `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`

**Key differences:**
- No `reactivate_existing` — re-subscribing the same email is idempotent
- No `send_welcome_email` — you'd need a separate workflow/automation
- Custom fields go in a separate `contacts/{id}` PATCH call
- Rate limit: 10 req/s per account

### ConvertKit

**Worker changes:**
- URL: `https://api.convertkit.com/v3/forms/{form_id}/subscribe`
- Header: None (uses API key in body)
- Body: `{ api_key: CONVERTKIT_API_KEY, email, first_name: '', tags: [...] }`
- Set secrets: `CONVERTKIT_API_KEY`, `CONVERTKIT_FORM_ID`

**Key differences:**
- Auth via body param (`api_key`), not Bearer header
- Tags instead of custom fields — pass `context.intent` as a tag
- `form_id` determines the sequence/automation the subscriber enters
- No `reactivate_existing` — ConvertKit handles this natively
- Welcome emails are configured in ConvertKit automations, not the API call