# MK-MealScout — Current State Audit (V3 Phase 0 Discovery)

**Date**: 2026-07-23
**Branch audited**: `docs/release-reports` (up to date with origin; one pre-existing uncommitted formatting-only edit in `src/App.test.ts` — left untouched)
**Production**: https://17-web-culinary-discovery.vercel.app
**Auditor**: Agent 2 (MealScout Lead Product Engineer), read-only audit

## Identity

| Field | Value |
|---|---|
| Product name | MK MealScout |
| package.json name | `17-web-culinary-discovery` (legacy name mismatch) |
| package.json version | `2.1.0` (stale — CHANGELOG top entry is `2.4.0 - unreleased`) |
| Repo remote | `https://github.com/mk-knight23/MK-MealScout.git` |
| Framework | **Vue 3.5 + TypeScript + Vite 7 + Pinia 3 + Tailwind CSS v4** (SPA, no SSR) |
| Router | **None** — `vue-router` is in dependencies but never imported; views are tab state (`activeView` ref) in `src/App.vue` |
| Backend | None. Direct browser `fetch` to TheMealDB. All persistence is `localStorage` |
| Deploy | Vercel via Git (`vercel.json`); stale `firebase.json` + `amplify.yml` also present |

## Toolchain gate results (exact, run 2026-07-23, node v26.5.0 / npm 12.0.1)

| Gate | Command | Result |
|---|---|---|
| Install | `npm ci` | **PASS** — 411 packages in 7s (2 postinstall scripts blocked by allowScripts policy: esbuild, fsevents — harmless) |
| Lint | `npm run lint` (`eslint src --ext .vue,.ts,.tsx`) | **PASS** — exit 0, zero problems |
| Typecheck | `npx vue-tsc -b` | **PASS** — exit 0 |
| Tests | `npm test` (vitest) | **PASS** — `Test Files 8 passed (8)`, `Tests 81 passed (81)` in 3.13s |
| Build | `npm run build` (vite) | **PASS** — `dist/index.html 4.47 kB`, `assets/index-CvIDbbJz.css 41.07 kB (gzip 7.61)`, `assets/index-B9lsdcxx.js 144.12 kB (gzip 49.28)`. Two benign warnings: `(!) %VITE_GTM_ID% is not defined in env variables found in /index.html` (same for GA4) — the runtime guard rejects the literal placeholder by design |
| Broken script | `npm run production` | **FAIL by construction** — defined as `npm run build && npm start`, but no `start` script exists |

## API client (TheMealDB)

- **Provider**: TheMealDB free tier, base `https://www.themealdb.com/api/json/v1/1` (overridable via `VITE_MEALDB_API_BASE`). The `/1` path segment is TheMealDB's public developer test key — not a secret.
- **Auth**: none. **Rate limits**: TheMealDB free tier limits are informal/unpublished; nothing client-side throttles or caches requests.
- **Client**: `src/utils/mealdb.ts` (121 lines) is a genuinely solid centralized client: 12s `AbortController` timeout, external-signal merging, typed `MealDbError` (`upstream_<status>` / `timeout` / `aborted` / `network_error`), `meals: null` normalized to `[]`. Endpoints used: `search.php?s=`, `filter.php?c=`, `filter.php?i=`, `list.php?c=list`, `list.php?i=list`, `lookup.php?i=`, `random.php`. Verified live: `search.php?s=chicken` returns data.
- **Hot spot**: `CookMatches.vue` fires up to **8 parallel** `filter.php?i=` requests per click (`Promise.allSettled`, partial-failure UI). No caching, no debounce, no retry/backoff — the only real rate-limit exposure.
- **Offline behavior**: pantry/grocery/favorites work offline (localStorage). All recipe fetches fail with user-visible error states (verified in code: error/empty/partial states exist in Discover, CookMatches, RecipeDetailModal). No service worker, so the app shell itself does NOT load offline despite a PWA manifest.

## Feature truth table

| Feature | Advertised | Reality | Status |
|---|---|---|---|
| Recipe search / category browse | Yes | Real (`recipeStore` + mealdb client), error states included | **Production-verified** (prod bundle `index-B9lsdcxx.js` byte-identical to local build) |
| Favorites | Yes | Real, `localStorage` key `recipe-favorites` | Production-verified |
| Pantry (CRUD, expiry, presets, autocomplete) | README says "Not shipped yet" | **Actually shipped** (PR #2, `f310966`) and live in prod bundle (`mealscout:v1:pantry` present in deployed JS) | Production code confirmed; README stale |
| Ingredient-first matching ("What can I cook?") | README says not shipped | Shipped and in prod bundle; pure merge/score logic in `src/utils/matching.ts` with tests | Production code confirmed |
| Recipe detail + serving scaler | Yes | Real; scaler honestly labelled "Approximate — scaled from a 4-serving baseline" | Production code confirmed |
| Grocery list (consolidation, export) | README says not shipped | Shipped; `mealscout:v1:grocery` in prod bundle; copy/.txt/.json export real | Production code confirmed |
| JSON backup/restore | Not in README | Shipped (`DataStrip.vue` + `src/utils/backup.ts`, schema-validated) | Implemented, tested |
| Meal planner | **Advertised** in meta description ("plan weekly meals"), manifest ("meal plans"), footer link "Meal Planner" | **Does not exist** | UI-only claim / not implemented |
| Diet & time filters | **Advertised** in meta description ("Filter by cuisine, diet, and time") | Only category/ingredient/name filters exist; TheMealDB free API has no time or diet data | Not implemented — metadata overclaims |
| AI recipe generation | `.env.example` placeholders, honestly commented "not wired yet" | **Zero LLM calls anywhere in src/** (grep-verified) | Not implemented (honestly labelled) |
| Nutrition data | Not claimed | In-app disclaimer explicitly says no verified nutrition info | Honest — good |
| Keyboard shortcuts | SettingsPanel lists 5 (Ctrl+S, Ctrl+F, Esc, H, ?) | **3 of 5 dead** — see BROKEN_FEATURE_INVENTORY | Partially broken |
| Session stats (searches, views, time, favorites) | Displayed in SettingsPanel | "Time spent" and "Favorites" counters are never updated (dead writers) — permanently 0 | Partially fake display |

## Production verification (exact)

- `GET /` → 200, 4474 bytes. Title, meta description, canonical, OG tags, JSON-LD (`WebApplication`, author "Kazi Musharraf") all present. Literal `%VITE_GTM_ID%`/`%VITE_GA4_ID%` present in shipped HTML (guarded at runtime — no analytics fires).
- Prod JS bundle `/assets/index-B9lsdcxx.js` is **byte-identical** to the local `npm run build` output from this branch (`cmp` verified) → production runs the current P1 code.
- `robots.txt` → 200, allows all, points to sitemap. `sitemap.xml` → 200, single URL.
- **`GET /pantry`, `/grocery`, `/discover`, `/foo/bar`, `/recipe/52772` → all HTTP 404** ("The page could not be found NOT_FOUND", Vercel platform 404). The `vercel.json` SPA rewrite is NOT working in production even though the headers from the same file ARE applied. Currently masked because the app has no routes; fatal for V3 routing. See BROKEN_FEATURE_INVENTORY B1.
- Security headers live: `x-content-type-options: nosniff`, `x-frame-options: DENY`, `referrer-policy`, `permissions-policy`, `strict-transport-security` (preload). No CSP.
- No localhost URLs, no API keys, no analytics IDs in the shipped bundle (grep-verified).

## Docs vs reality

- `README.md` (updated Jul 22) still lists pantry/matching/grocery under "Not shipped yet, on the roadmap" — contradicted by code, CHANGELOG 2.4.0, and the deployed bundle. Needs one honest refresh.
- `CHANGELOG.md` 2.4.0 (unreleased) accurately describes the shipped P1/wave-2 work — the best source of truth.
- `docs/release-reports/*` are multi-repo reports (also cover MK-TypeSprint and ViralCanvas) — accurate but cross-project noise inside this repo.
- `docs/` also carries marketing artifacts (posts, video scripts, podcast script, linkedin post) plus a `Project-Brain/` set — several predate the P1 reality.
- Root `CLAUDE.md` / `AGENTS.md` are the generic "Kazi's Agents Army" personas, not repo-specific instructions.

## Overall verdict

The core product (Discover + Pantry + Matching + Grocery, local-first, honest disclaimers) is real, tested (81 tests), typechecked, lint-clean, and deployed. The main problems are: broken SPA rewrite in production, stale/overclaiming metadata and README, dead shortcuts/stats, unused dependencies and dead files, and version/name identity drift. Architecture is a good springboard for V3 — see ARCHITECTURE_DEBT.md for the restructure map.
