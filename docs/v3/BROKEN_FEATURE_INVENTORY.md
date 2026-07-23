# MK-MealScout — Broken / Misleading Feature Inventory (V3 Phase 0)

**Date**: 2026-07-23. Every item below is evidence-backed (file:line or live HTTP check). Severity: Critical > High > Medium > Low.

## B1 — SPA deep routes return 404 in production — HIGH (Critical for V3)

- **Evidence**: `curl` 2026-07-23: `/pantry`, `/grocery`, `/discover`, `/foo/bar`, `/recipe/52772` all → `HTTP 404`, body "The page could not be found NOT_FOUND" (Vercel platform 404, not the app).
- `vercel.json:9-11` defines the rewrite `{"source": "/((?!api|assets|.*\\..*).*)", "destination": "/index.html"}` — but it does not take effect, while the `headers` from the *same file* ARE served (verified: `x-frame-options: DENY` etc. present). So the deployed config is current but the rewrite pattern is not matching/compiling on Vercel.
- **Current impact**: masked — the app has zero routes (tab state only), so no internal navigation produces deep URLs. Any shared or bookmarked non-root URL 404s.
- **V3 impact**: fatal. V3 routing (recipe/planner/grocery URLs) cannot ship until this rewrite is fixed and re-verified in production.

## B2 — 3 of 5 advertised keyboard shortcuts can never fire — MEDIUM

- **Evidence**: `src/composables/useKeyboardControls.ts:24-31` — `actionMap` keys are `'KeyS'`, `'KeyF'`, `'KeyH'` (these are `e.code` values) but the lookup at line 38 is `actionMap[e.key]` (`e.key` is `'s'`, `'f'`, `'h'`). Only `'Escape'`, `'/'`, `'?'` are valid `e.key` entries.
- **Result**: "Ctrl + S Save Recipe", "Ctrl + F Focus Search", and "H Toggle Help" — all listed in the SettingsPanel shortcuts table (`src/utils/constants.ts:6-12`) — do nothing.
- **Compounding**: even if the lookup were fixed, `save` and `search` actions have no handler anywhere — `App.vue:56-63` `watchEffect` only handles `help` and `close`. "Save Recipe" / "Focus Search" are advertised features with no implementation behind them.

## B3 — Two SettingsPanel stats are permanently zero — MEDIUM

- **Evidence**: `src/components/ui/SettingsPanel.vue:189,197` displays `statsStore.formatTime()` ("time spent") and `statsStore.totalFavorites`. But `addTimeSpent()` and `updateFavorites()` (`src/stores/stats.ts:53-61`) are **never called** anywhere in `src/` (grep-verified).
- **Result**: users always see "0m" time spent and "0" favorites in stats, regardless of real usage — a fabricated-looking stats display.
- Also: `App.vue:53` calls `statsStore.recordSearch()` inside `onMounted`, so every page load is counted as a "search" — the search counter is inflated by design.

## B4 — Silent global error swallowing — MEDIUM

- **Evidence**: `src/main.ts:9-11`: `app.config.errorHandler = () => { /* Errors are handled silently in production */ }` — an empty handler that discards **every** Vue error in all environments, including dev. Any render/lifecycle exception disappears with no console output, no user message, no telemetry.
- Violates the project's own error-handling standard ("Never silently swallow errors") and will actively hide V3 regressions.

## B5 — Meta description advertises non-existent filters and planner — MEDIUM

- **Evidence**: `index.html:9` (and live prod HTML): "Filter by cuisine, diet, and time. Build shopping lists and plan weekly meals."
  - **Diet filter**: does not exist (no UI, and TheMealDB free API exposes no diet facet).
  - **Time filter**: does not exist (no cooking-time data in the API at all).
  - **"Plan weekly meals"**: no meal planner exists anywhere in `src/`.
- Same overclaim in `public/manifest.webmanifest` description ("meal plans") and OG/Twitter descriptions.

## B6 — Dead footer navigation — LOW

- **Evidence**: `src/App.vue:446-473` — six footer items ("Trending Recipes", "Global Cuisines", "Healthy Options", "Saved Collections", "Meal Planner", "Grocery Integrator") are plain `<li>` with `cursor-pointer` hover styling and **no click handlers or hrefs**. They look interactive, do nothing, and two of them name features that do not exist.

## B7 — Footer GitHub link points at the legacy repo name — LOW

- **Evidence**: `src/App.vue:488` links `https://github.com/mk-knight23/17-web-culinary-discovery`, but the actual remote is `mk-knight23/MK-MealScout`. (Works only if GitHub still redirects the old name; the canonical URL should be used.) Baked into the shipped prod bundle (grep-verified in `index-B9lsdcxx.js`).

## B8 — `npm run production` is broken — LOW

- **Evidence**: `package.json:7` — `"production": "npm run build && npm start"`; there is no `start` script. Running it fails after the build step. Dead/misleading script.

## B9 — README contradicts the shipped product — MEDIUM (docs)

- **Evidence**: `README.md:18-23` lists "Pantry manager with expiration tracking", "Grocery-list generator with unit consolidation" under "Not shipped yet, on the roadmap" — all shipped in PR #2 (`f310966`) and live in the production bundle (storage keys `mealscout:v1:pantry` / `mealscout:v1:grocery` present in deployed JS). The README under-claims; the marketing metadata over-claims (B5). Neither matches reality.

## B10 — PWA manifest without offline capability — LOW

- **Evidence**: `public/manifest.webmanifest` declares `display: standalone` with an installable identity, but there is no service worker — an installed "app" white-screens with no network. Manifest icon is an inline SVG emoji data URI (no real icons, no maskable icon, no 512px raster for install prompts).

## Explicitly NOT broken (verified)

- No fabricated nutrition/time/cost data anywhere — the recipe modal ships an explicit disclaimer ("No verified nutrition information is available").
- No fake reviews, awards, or user counts.
- No "AI" claims in the UI — AI env vars exist only as commented placeholders in `.env.example` labelled "not wired yet".
- No hardcoded analytics IDs; GTM/GA4 injection is correctly build-time gated and regex-validated (`index.html:64-87`).
- Error/empty/loading/partial-failure states exist in all three views — genuinely well done.
