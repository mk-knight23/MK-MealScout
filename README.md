# MK MealScout

**Ingredient-first recipe finder. Turn what you have into something to cook. Free, open source, no signup.**

Live: https://17-web-culinary-discovery.vercel.app

MK MealScout lets you enter the ingredients already in your kitchen and see what you can make. Recipe data comes from [TheMealDB](https://www.themealdb.com/), a free community recipe API.

## What actually ships today

- Recipe search by name, category, and ingredient via TheMealDB.
- Categorized browse with graceful degradation when the API is slow or unavailable.
- Favorites persisted locally to `localStorage`. Nothing is stored server-side.
- Recipe scaling + unit conversion (`src/utils/scaling.ts`) with 23 unit tests covering fractions, ranges, unicode fractions, volume, and mass.
- Centralized API client with 12s timeout, `AbortController` cancellation, and typed errors (`src/utils/mealdb.ts`).
- Analytics: nothing loads unless `VITE_GTM_ID` or `VITE_GA4_ID` is set at build time, or Vercel Analytics is enabled in the dashboard. See [docs/ANALYTICS.md](docs/ANALYTICS.md).

Not shipped yet, on the roadmap:

- Pantry manager with expiration tracking.
- Meal planner + drag-drop weekly schedule.
- Grocery-list generator with unit consolidation.
- AI recipe generation (env placeholders exist; no LLM calls wired).

## Tech stack

- Vue 3 + TypeScript
- Vite 7
- Pinia
- Native `fetch` (axios removed)
- Vitest

## Getting started

```bash
npm install
npm run dev
npm test
npm run build
```

## Environment variables

Copy `.env.example` to `.env.local` for local dev.

```
VITE_MEALDB_API_BASE=https://www.themealdb.com/api/json/v1/1
VITE_GTM_ID=
VITE_GA4_ID=
```

## Deployment

Deploys to Vercel via Git integration. Framework: Vite (auto). Output: `dist/`.

## Project structure

```
src/
  App.vue
  main.ts
  stores/recipeStore.ts     # Pinia store, exposes errorCode/errorMessage
  utils/mealdb.ts           # timeout + abort + typed errors
  utils/scaling.ts          # parseMeasure / scaleMeasure / convertVolume / convertMass
  types/recipe.ts
  components/
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md).

## License

MIT — see [LICENSE](LICENSE).

Built and maintained by [Kazi Musharraf](https://www.mkazi.live) (`mk-knight23`).
