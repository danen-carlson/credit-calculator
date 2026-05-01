#!/bin/bash
# Monitor AI crawler activity and citations for CreditStud.io
# Run weekly via cron or manually
# 
# Usage: ./monitor-ai-citations.sh [--verbose]
#
# What it checks:
# 1. Google search for "creditstud.io" mentions
# 2. Known AI crawler User-Agent strings
# 3. Search engine index counts
# 4. AI directory listings

set -e

VERBOSE="${1:-}"

echo "=== CreditStud.io AI Citation Monitor ==="
echo "Date: $(date -u '+%Y-%m-%d %H:%M UTC')"
echo ""

# 1. Check what search engines have indexed
echo "--- Search Engine Index Status ---"

# Google (approximate via site: search)
echo -n "Google indexed pages: "
GOOGLE_COUNT=$(curl -s "https://www.google.com/search?q=site:creditstud.io" \
  -H "User-Agent: Mozilla/5.0" \
  | grep -o 'About [0-9,]* results' | grep -o '[0-9,]*' | head -1)
echo "${GOOGLE_COUNT:-unknown}"

# Bing
echo -n "Bing indexed pages: "
BING_COUNT=$(curl -s "https://www.bing.com/search?q=site%3Acreditstud.io" \
  -H "User-Agent: Mozilla/5.0" \
  | grep -o '[0-9,]* results' | head -1 | grep -o '[0-9,]*')
echo "${BING_COUNT:-unknown}"

echo ""

# 2. Check AI directory listings
echo "--- AI Directory Listings ---"

for dir in "thereisanaiforthat.com" "futurepedia.io" "toolify.ai"; do
  echo -n "  $dir: "
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://www.$dir/search/creditstud" 2>/dev/null || echo "error")
  if [ "$STATUS" = "200" ]; then
    # Check if actually listed
    BODY=$(curl -s "https://www.$dir/search/creditstud" -H "User-Agent: Mozilla/5.0" 2>/dev/null || echo "")
    if echo "$BODY" | grep -qi "creditstud"; then
      echo "LISTED ✓"
    else
      echo "not found (HTTP $STATUS)"
    fi
  else
    echo "not checked (HTTP ${STATUS})"
  fi
done

echo ""

# 3. Check crawler access
echo "--- Crawler Access ---"
for bot in "GPTBot" "PerplexityBot" "ClaudeBot" "CCBot" "Google-Extended" "Applebot-Extended" "Bytespider"; do
  echo -n "  $bot: "
  RESPONSE=$(curl -s -A "$bot" -o /dev/null -w "%{http_code}" "https://creditstud.io/robots.txt" 2>/dev/null || echo "error")
  if [ "$RESPONSE" = "200" ]; then
    echo "allowed (HTTP 200)"
  elif [ "$RESPONSE" = "403" ]; then
    echo "BLOCKED ✗"
  else
    echo "HTTP $RESPONSE"
  fi
done

echo ""

# 4. Check llms.txt accessibility
echo "--- LLM Resources ---"
for resource in "llms.txt" ".well-known/ai-plugin.json" ".well-known/openapi.json" "robots.txt" "sitemap.xml" "blog/feed.xml" "data/cards.json"; do
  echo -n "  /$resource: "
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://creditstud.io/$resource" 2>/dev/null || echo "dns-fail")
  if [ "$STATUS" = "200" ]; then
    SIZE=$(curl -s "https://creditstud.io/$resource" 2>/dev/null | wc -c | xargs)
    echo "OK (${SIZE} bytes)"
  else
    echo "HTTP $STATUS"
  fi
done

echo ""
echo "=== Monitor Complete ==="
echo ""
echo "Next steps if citations are low:"
echo "  - Submit to more AI directories"
echo "  - Post on Reddit r/personalfinance, r/creditcards"
echo "  - Create ChatGPT custom GPT (#144)"
echo "  - Check server logs for AI user agents (#143)"