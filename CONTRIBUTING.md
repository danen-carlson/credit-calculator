# Contributing

## Development Workflow

1. Edit HTML partials in `shared/` (header.html, footer.html, disclosure-banner.html)
2. Run `npm run build` to propagate changes to all pages
3. Test with `npm test`
4. Commit changes

## Build System

The `build.js` script makes shared components DRY:
- Replaces `<header>`, `<footer>`, and disclosure banner blocks with marked partials
- Idempotent: safe to run multiple times
- Targets: index.html, rewards/index.html, debt-planner/index.html, blog/index.html, disclosure.html

After editing shared partials or CSS, always run `npm run build`.

## CSS Components

Common styles live in `shared/components.css`. Page-specific CSS can override.

**Add to each page head:**
```html
<link rel="stylesheet" href="/shared/components.css">
```
