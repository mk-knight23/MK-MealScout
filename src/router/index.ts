import {
  createRouter,
  createWebHistory,
  type Router,
  type RouterHistory,
  type RouteRecordRaw,
} from 'vue-router'
import DiscoverView from '@/views/DiscoverView.vue'

/**
 * Route table.
 *
 * `/recipe/:id` makes the recipe detail route-addressable while keeping the
 * modal UX: it renders the discover catalogue as the page content and the
 * App-level RecipeDetailModal opens over it, driven by the route param.
 *
 * RESERVED GROWTH SLUGS — never define routes on these paths (they are held
 * for future SEO growth pages, see docs/v3/ROUTES.md): /recipe-finder,
 * /recipes-with-*, /leftover-recipe-ideas, /cooking-unit-converter,
 * /recipe-scaler, /ingredient-substitutions. Until those pages ship they
 * intentionally fall through to the catch-all 404 below.
 */
export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'discover', component: DiscoverView },
  { path: '/recipe/:id', name: 'recipe', component: DiscoverView },
  { path: '/pantry', name: 'pantry', component: () => import('@/views/PantryView.vue') },
  { path: '/grocery', name: 'grocery', component: () => import('@/views/GroceryView.vue') },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

/** History is injectable so tests can pass createMemoryHistory(). */
export function createAppRouter(
  history: RouterHistory = createWebHistory(import.meta.env.BASE_URL)
): Router {
  return createRouter({
    history,
    routes,
    scrollBehavior(to, _from, savedPosition) {
      // Opening the recipe modal must not scroll the page underneath.
      if (to.name === 'recipe') return false
      return savedPosition ?? { top: 0 }
    },
  })
}
