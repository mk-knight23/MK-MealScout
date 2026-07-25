# Content-Security-Policy — MK-MealScout

Header set in `vercel.json` (applies on Vercel only; `vite dev`/`vite preview`
do not serve it). Every directive below was derived from **actual usage** in
the built app — nothing speculative.

## Directives and why

| Directive | Value | Reason (verified usage) |
|---|---|---|
| `default-src` | `'self'` | Deny-by-default baseline. |
| `script-src` | `'self' 'sha256-C3x3…8bk=' https://www.googletagmanager.com` | App bundles from `/assets`; the sha256 hash allowlists the single inline analytics bootstrap in `index.html`; GTM/GA4 loader scripts come from googletagmanager.com when analytics IDs are set. The JSON-LD block is a data block and needs no allowance. |
| `style-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com` | Built CSS from `/assets`; Google Fonts stylesheet; `'unsafe-inline'` needed for style *attributes* (Vue `:style` bindings, the global error notice's `cssText`). |
| `img-src` | `'self' https://www.themealdb.com data:` | Recipe thumbnails/images from TheMealDB; `data:` for the manifest's inline SVG icon. |
| `font-src` | `https://fonts.gstatic.com` | Google Fonts font files (Inter, Playfair Display). No self-hosted fonts today. |
| `connect-src` | `'self' https://www.themealdb.com` | `fetch` to the TheMealDB API (`src/utils/mealdb.ts`); no other runtime calls. |
| `manifest-src` | `'self'` | `/manifest.webmanifest`. |
| `object-src` | `'none'` | No plugins. |
| `base-uri` | `'self'` | Block `<base>` injection. |
| `form-action` | `'self'` | No external form posts. |
| `frame-ancestors` | `'none'` | Site must not be framed (belt-and-braces with `X-Frame-Options: DENY`). |

Not needed (checked): `media-src` (sounds are WebAudio oscillators, no audio
files), `frame-src` (YouTube recipe videos are plain links, not embeds),
`worker-src` (no workers).

## Maintenance caveats

1. **Inline-script hash.** `script-src` allowlists the inline analytics
   bootstrap by hash. The hash was computed from `dist/index.html` built with
   `VITE_GTM_ID`/`VITE_GA4_ID` **unset** (Vite leaves the `%VITE_*%`
   placeholders verbatim, so the output is deterministic). If those env vars
   are ever set at build time, the script body changes and the hash MUST be
   regenerated:

   ```bash
   npm run build
   node -e "const c=require('crypto'),f=require('fs');const h=f.readFileSync('dist/index.html','utf8');const m=[...h.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].find(x=>!/ld\+json/.test(x[0]));console.log('sha256-'+c.createHash('sha256').update(m[1],'utf8').digest('base64'))"
   ```

2. **Enabling analytics** also requires extending `connect-src` (and possibly
   `img-src`) with `https://www.google-analytics.com` /
   `https://*.googletagmanager.com` for beacons — GA4 will be silently
   blocked otherwise.

3. **Self-hosting fonts** (a Wave 3 candidate) would move
   `fonts.googleapis.com`/`fonts.gstatic.com` out of the policy in favour of
   `'self'`.

## Verification performed (2026-07-25)

- `npm run build`, then served `dist/` locally with the exact CSP header
  value and loaded the app in a browser: recipes render, TheMealDB images
  load, Google Fonts load, pantry/grocery views work, settings dialog opens.
- Browser console showed no CSP violation reports.
