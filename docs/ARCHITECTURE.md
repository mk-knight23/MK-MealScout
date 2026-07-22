# Architecture — MK MealScout

## High-level

Vue 3 SPA that talks directly to [TheMealDB](https://www.themealdb.com/api.php) from the browser. No custom backend, no auth, no database. Favorites persist to `localStorage`.

```
Browser (Vue 3 + Pinia)
    │
    └── fetch  https://www.themealdb.com/api/json/v1/1/*
                (search.php, filter.php, list.php, lookup.php, random.php)
```

## API client

`src/utils/mealdb.ts` centralizes every upstream call. It provides:

- Typed error class `MealDbError` carrying `status` + `cause`.
- 12-second `AbortController` timeout per request, plus support for an external `AbortSignal` (used to cancel in-flight requests when the user changes filters mid-fetch).
- Explicit result shapes; `data.meals: null` from TheMealDB is normalized to `[]`.
- Consumers only see `Recipe[]` or a thrown `MealDbError` — no leaky `data.meals?.[0]?....` chains.

## Store

`src/stores/recipeStore.ts` is a Pinia store with `errorCode` + `errorMessage` state that the UI must render. Errors are no longer swallowed silently.

State surface:

```
recipes:        Recipe[]
categories:     string[]
favorites:      string[]  (persisted to localStorage)
loading:        boolean
selectedCategory: string
searchQuery:    string
errorCode:      string | null
errorMessage:   string | null
```

## Scaling and unit conversion

`src/utils/scaling.ts` is pure, deterministic, and framework-agnostic. Handles:

- Whole numbers, decimals, ASCII fractions (`1/2`), mixed fractions (`1 1/2`), unicode fractions (`½`, `⅓`, `¾`), and ranges (`2-3`).
- Known units: cup, tbsp, tsp, oz, lb, g, kg, ml, l, pinch, dash, clove, can, slice, piece, stick.
- Volume conversions (tsp/tbsp/cup/ml/l) and mass conversions (oz/lb/g/kg).

The pure functions have 23 unit tests in `src/utils/__tests__/scaling.test.ts`.

## Bundle

Single-chunk Vue app, ~100kB minified (~37kB gzipped) after removing `axios` in favor of native `fetch`. Well below any warning threshold.

## Security surface

- No user input reaches a server operated by us (no server at all).
- TheMealDB query params are URL-encoded.
- No secrets exist in this repo. The only env variable is a base URL override for hitting a mirror or a mock during testing.

## What is intentionally not built

- Auth / user accounts.
- Server-side pantry storage. `localStorage` is enough for a lookup tool.
- Nutrition data. TheMealDB does not provide verified nutrition per recipe, and fabricating that would be dangerous. Nutrition claims are explicitly disclaimed in the UI.
