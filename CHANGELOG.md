# Changelog - MK MealScout

All notable changes to this project will be documented in this file.

## [2.4.0] - unreleased

Core workflow: pantry → recipe matching → grocery list. All data local (localStorage), no login, works offline except recipe lookups.

### Added
- **Pantry** (`src/stores/pantryStore.ts`, `src/utils/pantry.ts`): add/edit/remove ingredients with optional quantity note and expiry date; persisted to `mealscout:v1:pantry` with schema-guarded parsing (corrupt JSON degrades to empty pantry, never crashes); expiring-soon indicator (5-day window); "Basics" and "Vegetarian staples" presets verified against TheMealDB ingredient names; autocomplete backed by new `listIngredients()` in `src/utils/mealdb.ts`.
- **"What can I cook?"** (`src/components/pantry/CookMatches.vue`, `src/utils/matching.ts`): queries `filter.php?i=` per pantry ingredient (first 8, parallel via `Promise.allSettled`), merges client-side, scores each recipe by distinct pantry ingredients matched, sorts by score; match-count badges; empty-pantry, API-failure, partial-failure, and zero-result states.
- **Recipe detail** (`src/components/recipe/RecipeDetailModal.vue`): full lookup with image, category/area, ingredient checkboxes, approximate serving scaler (4-serving baseline, labelled), source/YouTube links, allergen + no-verified-nutrition disclaimer, and "add missing ingredients to grocery list".
- **Grocery list** (`src/stores/groceryStore.ts`, `src/utils/grocery.ts`, `src/components/grocery/GroceryView.vue`): persisted to `mealscout:v1:grocery`; case-insensitive duplicate consolidation with origin appending; check/uncheck, manual add, edit, delete, clear-completed, copy-to-clipboard, .txt/.json download.
- **Dashboard strip + backup** (`src/components/ui/DataStrip.vue`, `src/utils/backup.ts`): live pantry/expiring/grocery/favorites counts; JSON backup and validated restore of pantry + grocery + favorites.
- Tab navigation (Discover / Pantry / Grocery) with desktop and mobile variants.
- 41 new unit tests (72 total): pantry persistence corruption handling, match scoring, grocery consolidation, backup validation, measure parsing.

### Fixed
- `parseMeasure` now splits units glued to quantities ("400g" → "400 g"), so scaled ingredient lists keep their units.
- All `noUncheckedIndexedAccess` typecheck errors resolved; `vue-tsc -b` passes clean.
- Hero copy no longer implies verified nutrition data.

## [2.3.0] - 2026-07-22
- P0 upgrade pass: fixed brand spelling (Qazi → Kazi), removed stale deploy artifacts, replaced legacy Vercel builds config with modern SPA rewrites + security headers.
- Truthful docs: real README, docs/ARCHITECTURE.md, docs/ANALYTICS.md, docs/PRIVACY.md, updated SECURITY.md.
- Analytics: GTM + GA4 only inject at build time when a valid env var is set; no fake tracking.
- PWA manifest added or corrected; JSON-LD upgraded with creator + author URLs.
- Centralized TheMealDB client (src/utils/mealdb.ts) with 12s timeout, AbortController cancellation, typed MealDbError. Store now surfaces errorCode/errorMessage instead of silently swallowing.
- Added src/utils/scaling.ts with 23 unit tests: fractions, unicode fractions, ranges, volume/mass conversion.
- Removed axios in favor of native fetch; bundle down from 133KB to 100KB.

## [2.2.0] - 2026-07-19
- Redesigned with premium glassmorphism.
- Unified brand identification under Kazi Musharraf.
- Modernized project dependencies.
- Added SEO pages, analytics wrapper, and sitemaps.
