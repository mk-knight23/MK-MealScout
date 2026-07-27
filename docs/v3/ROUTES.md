# V3 Route Map & Reserved Growth Slugs

Status: live as of the `feat/v3-mealscout-architecture` branch.
Router: vue-router v4, HTML5 history mode (`createWebHistory`), defined in
`src/router/index.ts`. `vercel.json` already rewrites all non-asset paths to
`/`, so deep links work in production without any config change.

## Route map

| Path          | Name        | View                        | Notes |
|---------------|-------------|-----------------------------|-------|
| `/`           | `discover`  | `views/DiscoverView.vue`    | Landing catalogue: hero, search, categories, recipe grid. Eagerly bundled. |
| `/recipe/:id` | `recipe`    | `views/DiscoverView.vue`    | Route-addressable recipe detail. Renders the discover catalogue as the page; the App-level `RecipeDetailModal` opens over it, driven by the route param (modal UX preserved). Closing goes `history.back()` when in-app history exists, otherwise to `/`. |
| `/pantry`     | `pantry`    | `views/PantryView.vue`      | DataStrip + PantryManager + CookMatches. Lazy chunk. |
| `/grocery`    | `grocery`   | `views/GroceryView.vue`     | DataStrip + GroceryList. Lazy chunk. |
| `/:pathMatch(.*)*` | `not-found` | `views/NotFoundView.vue` | In-app 404 (the Vercel rewrite serves `index.html` for unknown paths, so the SPA must render the 404). |

Views are wrapped in `<KeepAlive>` (see `App.vue`) so per-view state — e.g.
cook-match results — survives navigation, including behind the recipe modal.

## Reserved growth slugs — DO NOT CLAIM

The following paths are **reserved for future SEO growth pages** (prerendered
or otherwise search-indexable content). The SPA router must **never** define
routes on them; until each page ships, the path intentionally falls through
to the `not-found` catch-all.

- `/recipe-finder`
- `/recipes-with-*` (entire prefix, e.g. `/recipes-with-chicken`)
- `/leftover-recipe-ideas`
- `/cooking-unit-converter`
- `/recipe-scaler`
- `/ingredient-substitutions`

Why: these slugs are keyword-targeted landing pages in the V3 growth plan.
If the SPA claims them now, shipping the real pages later becomes a breaking
route migration (and the interim SPA versions would get indexed as thin
content). Keeping them 404 until launch is deliberate.

Enforcement: `src/router/__tests__/router.test.ts` asserts every reserved
slug resolves to `not-found` and fails the suite if anyone adds a colliding
route. A warning comment also sits on the route table in
`src/router/index.ts`.
