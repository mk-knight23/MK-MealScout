# MK-MealScout — Performance Baseline (V3 Phase 0)

**Date**: 2026-07-23. Method: build-output measurement + shipped-asset inspection + code review. No Lighthouse/field data was collected in this audit (stated honestly); the numbers below are the reproducible baseline for V3 before/after comparison.

## Bundle baseline (vite 7.3.1 production build, exact)

| Asset | Raw | Gzip |
|---|---|---|
| `dist/index.html` | 4.47 kB | 1.64 kB |
| `dist/assets/index-CvIDbbJz.css` | 41.07 kB | 7.61 kB |
| `dist/assets/index-B9lsdcxx.js` | 144.12 kB | **49.28 kB** |
| Build time | 2.65s (1,726 modules) | |

Production serves byte-identical assets (cmp-verified against local build). Single JS chunk — no code splitting; acceptable at 49 kB gzip, but the V3 planner/AI additions should introduce route-level splitting before the chunk grows past ~80 kB gzip.

## What is already good

- Immutable 1-year caching on hashed `/assets/*` (curl-verified: `cache-control: public, max-age=31536000, immutable`); HTML `max-age=0, must-revalidate`. Vercel edge cache HIT observed.
- `lucide-vue-next` icons are tree-shaken (named imports only).
- Sourcemaps off in prod, `es2020` target, CSS code-split enabled (`vite.config.ts`).
- Recipe grid images: TheMealDB thumbs, `loading="lazy"` on CookMatches cards.
- Axios removed in 2.3.0 (133 kB → 100 kB then; now 144 kB raw after P1 features — still lean).

## Findings, ranked

### P1 — Render-blocking Google Fonts — HIGH (biggest LCP lever)
`index.html:89-94` loads Inter (5 weights) + Playfair Display (2 styles) via blocking `<link rel="stylesheet">` from fonts.googleapis.com. This is third-party, render-blocking CSS on the critical path, plus a CSP/privacy dependency. V3: self-host with `@font-face` + `font-display: swap`, subset weights (8 variants requested; the UI predominantly uses 400/700/black).

### P2 — Discover grid renders full-size thumbs without dimensions — MEDIUM
`App.vue:321-325` recipe `<img>` has no `width`/`height`/`aspect-ratio` attributes (container has `aspect-video`, which contains layout shift — OK) and no `loading="lazy"` on the Discover grid (CookMatches has it; Discover does not). TheMealDB supports `/preview` suffix for smaller thumbs — Discover loads ~25 full 700×700 images on first paint. Easy win: `strMealThumb + '/medium'` (documented TheMealDB variant) + lazy-load below the fold.

### P3 — Initial load fires two API calls serially-ish on mount — LOW
`App.vue:50-54`: `fetchCategories()` + `searchRecipes('')` on mount (parallel, fine) — but `search.php?s=` with empty query returns the full default set; acceptable. No caching layer: revisits refetch everything. V3 IndexedDB work should add a stale-while-revalidate cache for `list.php` (categories/ingredients change ~never).

### P4 — CookMatches burst: up to 8 parallel API calls per click — LOW/MEDIUM
Uncached, unthrottled (see SECURITY R5). Repeated clicks re-fetch identical data. Cache per-ingredient results for the session.

### P5 — Two Pinia stores + audio init on every keystroke path — INFO
`useAudio` creates an AudioContext lazily (good). `watchEffect` in App.vue re-evaluates on every `lastAction` tick — negligible. No virtualization needed at current list sizes.

### P6 — No web-vitals measurement — MEDIUM (process)
No Vercel Speed Insights, no analytics, no Lighthouse CI. There is literally no RUM or lab data for this product. Before V3 lands, enable Vercel Speed Insights (dashboard toggle, zero code) so V3 has a before/after LCP/CLS/INP record.

## Baseline numbers to beat in V3

- JS ≤ 49.3 kB gzip on the initial route (with splitting, ideally lower)
- CSS ≤ 7.6 kB gzip
- Zero render-blocking third-party requests (currently 2: two fonts CSS requests)
- First recipe-image bytes: switch to `/medium` previews (≈4-10× smaller per image)
