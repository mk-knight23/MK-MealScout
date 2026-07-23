# MK-MealScout — Architecture Debt & V3 Restructure Map (Phase 0)

**Date**: 2026-07-23. Scope: `src/` (3,844 lines total incl. tests), config, dependencies.

## What is architecturally healthy (keep for V3)

- **Pure-logic utility layer with tests**: `utils/pantry.ts`, `utils/grocery.ts`, `utils/matching.ts`, `utils/scaling.ts`, `utils/backup.ts` are framework-free, schema-guarded (corrupt localStorage never throws), immutable, and covered by 72 of the 81 tests. This is exactly the seam V3 needs — swap the persistence adapter without touching domain logic.
- **Centralized API client** (`utils/mealdb.ts`): timeout, abort-merge, typed errors, null-normalization. Extend, don't rewrite.
- **Store discipline**: pantry/grocery stores are thin wrappers over the pure utils with a `_persist()` choke point — the single place IndexedDB will slot in.
- Versioned storage envelope already exists: `mealscout:v1:pantry` / `mealscout:v1:grocery` with `{version: 1, entries/items}` wrappers → migration path to v2/IndexedDB is clean.

## Debt register

### D1 — No router (HIGH for V3)
`vue-router@4.6.4` is a declared dependency but never imported (grep-verified). Views are a `ref<'discover'|'pantry'|'grocery'>` in `App.vue:31,41`. No deep links, no per-view titles/meta, no recipe URLs. V3 planner/grocery/recipe pages require real routes — and the production rewrite is broken (BROKEN_FEATURE_INVENTORY B1), so routing work is blocked on the Vercel fix.

### D2 — App.vue is a god component (MEDIUM)
`src/App.vue` = 511 lines: header, two nav variants, hero, search, category chips, recipe grid, loading/empty states, footer, modal wiring, theme toggle, stats calls. The whole Discover view lives inline. **V3 restructure**: extract `DiscoverView.vue`, `AppHeader.vue`, `AppFooter.vue`, `RecipeCard.vue` (the card markup is already duplicated between `App.vue:315-370` and `CookMatches.vue:168-200` — see D3), then let a router own view switching.

### D3 — Duplicated recipe-card markup (MEDIUM)
Two near-identical `article.recipe-card` blocks (image + heart/badge + title + meta) in `App.vue` and `CookMatches.vue`. Any V3 card change (nutrition badges, planner "add to day" button) must be made twice. Extract a shared `RecipeCard.vue` with slots.

### D4 — Dead code (LOW, easy win)
- `src/components/common/Button.jsx`, `Card.jsx`, `Input.jsx` — **React** JSX components in a Vue app, never imported; they even contain escaped-backtick template literals (`\`${...}\``) that would not compile if imported. Delete.
- `src/test/setup.ts` + `src/test/vitest.d.ts` — orphaned; `vitest.config.ts:19` uses `src/__tests__/setup.ts` only.
- `src/__tests__/App.test.ts` — a single redundant "mounts without crashing" test duplicating `src/App.test.ts`. Consolidate into one App spec location.
- `public/css/premium-design.css` — zero references anywhere (grep-verified). Delete.
- `firebase.json`, `amplify.yml` — deploy configs for platforms not in use (Vercel is prod). Delete or move to an infra archive.
- `src/utils/constants.ts` `STORAGE_KEYS` — defined but not imported by the stores (settings.ts:13 and stats.ts:12 hardcode their own copies).

### D5 — Unused dependencies (LOW)
`vue-router` and `@vueuse/core` are dependencies with **zero imports** in `src/` (grep-verified). Either adopt (router is needed for V3 anyway) or remove. Tree-shaking keeps them out of the bundle today, but they rot the lockfile and audit surface.

### D6 — Legacy naming drift (LOW)
- Storage keys `culinara-settings` / `culinara-stats` (settings.ts, stats.ts) vs the newer `mealscout:v1:*` convention — "Culinara" is a dead brand. V3 migration should read-old/write-new.
- `package.json` name `17-web-culinary-discovery`, version `2.1.0` (CHANGELOG says 2.4.0-unreleased). Footer GitHub link uses the old repo slug.

### D7 — Three-store persistence inconsistency (MEDIUM)
`recipeStore` favorites use bare key `recipe-favorites` (raw array, unversioned); pantry/grocery use versioned envelopes; settings/stats use `culinara-*`. Five keys, three conventions. V3 local-first work should unify behind one storage service.

### D8 — Test setup duplication + noise
Vitest runs with jsdom while `src/test/setup.ts` (unused) mocks localStorage; node 26 prints `ExperimentalWarning: localStorage` noise on every run. One canonical setup file fixes both.

## V3 readiness assessment

| V3 requirement | Verdict | What must change |
|---|---|---|
| **IndexedDB local-first pantry** | READY with adapter work | Introduce a `storage/` service (async get/put, migration from `localStorage` v1 envelopes). `pantryStore._persist()` / `groceryStore._persist()` are the only write choke points, but IndexedDB is async — store hydration must become async (currently `state: () => readPantry()` is sync). Plan: keep pure utils unchanged; add async `loadFromStorage()` action + a top-level ready gate. |
| **Meal planner** | GREENFIELD | Nothing exists. Needs `plannerStore` + `utils/planner.ts` (pure), a route, and a week model. Grocery consolidation (`consolidateItems`) is already reusable for "generate list from plan". |
| **Grocery consolidation** | MOSTLY DONE | `utils/grocery.ts` consolidates by name and merges qty notes as free text (`"2 cups + 1 can"`). True *unit* consolidation needs `parseMeasure`/`convertVolume`/`convertMass` from `utils/scaling.ts` wired into `consolidateItems` — the pieces exist and are tested, they are just not connected. |
| **AI gateway** | GREENFIELD, architecture decision required | This is a pure static SPA with no server. Client-side LLM calls would expose keys — **not acceptable**. V3 needs a serverless proxy (Vercel Functions / AI Gateway) before any AI feature; the `vercel.json` rewrite exclusion already reserves the `/api` path prefix. `.env.example` AI placeholders are server-style names (no `VITE_` prefix) — correct instinct, they must stay server-side. |
| **Routing / deep links** | BLOCKED | Adopt vue-router (already installed) + fix the broken Vercel rewrite (B1) + expand sitemap. |

## Named modules needing restructure (priority order)

1. `vercel.json` — fix/verify SPA rewrite in production (prerequisite for everything route-shaped).
2. `src/App.vue` — split into `views/DiscoverView.vue` + `layout/AppHeader.vue` + `layout/AppFooter.vue` + shared `components/recipe/RecipeCard.vue`; hand navigation to vue-router.
3. **NEW** `src/storage/` — async storage service (IndexedDB via `idb` or hand-rolled, with localStorage migration + fallback). Rewire the three `_persist`/read functions in `pantryStore`, `groceryStore`, `recipeStore`.
4. `src/stores/*` — async hydration pattern; unify the five storage keys; migrate `culinara-*` keys.
5. `src/utils/grocery.ts` + `src/utils/scaling.ts` — connect unit-aware consolidation.
6. **NEW** `api/` (Vercel serverless) — AI gateway endpoint(s); never expose provider keys to the client.
7. `src/composables/useKeyboardControls.ts` — fix `e.key`/`e.code` mismatch or delete the dead shortcuts and their SettingsPanel listing.
8. `src/main.ts` — replace the swallow-everything error handler with logging + optional user-facing toast.
9. Delete list: `src/components/common/*.jsx`, `src/test/`, `src/__tests__/App.test.ts` (merge), `public/css/premium-design.css`, `firebase.json`, `amplify.yml`.

**Verdict**: the domain/util layer is V3-ready as-is; the shell (App.vue, routing, persistence wiring, deploy config) needs a focused restructure — roughly a Tier M refactor, not a rewrite.
