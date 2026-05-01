#!/bin/bash
# Ping search engines with updated sitemap
# Usage: ./ping-search-engines.sh [sitemap_url]
# Called automatically by post-commit hook or manually

SITEMAP_URL="${1:-https://creditstud.io/sitemap.xml}"
ENCODED_URL=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$SITEMAP_URL', safe=''))")

echo "Pinging search engines with sitemap: $SITEMAP_URL"
echo ""

# Google — deprecated their ping endpoint, use Search Console instead
# https://search.google.com/search-console → Sitemaps → Submit
echo "Google: Use Search Console (ping endpoint deprecated)"

# Bing / IndexNow
echo -n "Bing (IndexNow)... "
BING_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://www.bing.com/indexnow?url=https://creditstud.io&key=creditstud2026")
echo "HTTP $BING_RESPONSE"

# Bing sitemap ping — deprecated, IndexNow is the current method
echo "Bing sitemap ping: Deprecated (use IndexNow instead)"

echo ""
echo "Done. For full indexing:"
echo "  - Google: Submit sitemap at https://search.google.com/search-console"
echo "  - Bing: IndexNow accepted (HTTP $INDEXNOW_RESPONSE)"