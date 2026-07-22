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

### Accessibility (WCAG 2.2 AA)
Wave-2 audit fixes (`src/` only), each browser-verified where observable:
- **Dark-mode theming repaired** (`src/style.css`, `src/stores/settings.ts`): added `@custom-variant dark (&:where(.dark, .dark *))` so Tailwind v4 `dark:` utilities key off the `.dark` class instead of the OS media query. Previously, under OS-dark the explicit light theme rendered light-mode surfaces with dark-mode text (~1.1:1 illegible hero). Also restore the persisted theme on load (the ref had been hard-coded to the default). Verified: light-under-OS-dark hero 14.37:1, dark 19.47:1, system follows OS.
- **Primary CTA contrast** (`src/style.css` + checkbox accents): `--color-culinary-primary` `#f59e0b` → `#b45309` (amber-700) and `--color-culinary-secondary` `#ea580c` → `#c2410c` (orange-700). White text on the primary went 2.15:1 → 5.02:1; on the hover token 3.56:1 → 5.18:1.
- **Favorites counter aria-label** (`src/App.vue`): was the literal string `{{ store.favorites.length }} saved recipes` (unbound attribute); now a real `:aria-label` binding.
- **Dead newsletter form removed** (`src/App.vue`): a placeholder-only, handler-less footer form (a non-feature); footer grid 4→3 columns.
- **CookMatches cards keyboard-operable** (`src/components/pantry/CookMatches.vue`): `role=button` + `tabindex=0` + Enter/Space + focus-visible outline + recipe-naming `aria-label`.
- **Pantry autocomplete keyboard support** (`src/components/pantry/PantryManager.vue`): full combobox/listbox pattern — ArrowUp/Down navigation, Enter to select, Escape to dismiss, `aria-activedescendant`, `aria-expanded`, `aria-controls`.
- **Shortcut editable-target guard** (`src/composables/useKeyboardControls.ts`): shortcuts no-op when typing in an input/textarea/select/contenteditable (Escape still passes through), so `?`/`/` in the search box no longer opens Settings or swallows the character. Adds `isEditableTarget()` + 8 unit tests.
- **Settings modal dialog semantics** (`src/components/ui/SettingsPanel.vue`): `role=dialog`, `aria-modal`, `aria-labelledby`, named close button, focus-on-open, Tab focus trap, and focus restore on close.

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
