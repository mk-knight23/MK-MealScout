import { describe, it, expect } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/router'

// Growth slugs held for future SEO pages (docs/v3/ROUTES.md). The SPA router
// must never claim them: until the pages ship they fall through to the 404
// catch-all, and this test breaks the build if anyone defines them as routes.
const RESERVED_GROWTH_SLUGS = [
  '/recipe-finder',
  '/recipes-with-chicken',
  '/recipes-with-rice-and-beans',
  '/leftover-recipe-ideas',
  '/cooking-unit-converter',
  '/recipe-scaler',
  '/ingredient-substitutions',
]

describe('route map', () => {
  const router = createAppRouter(createMemoryHistory())

  it('resolves the three app views and the recipe detail', () => {
    expect(router.resolve('/').name).toBe('discover')
    expect(router.resolve('/pantry').name).toBe('pantry')
    expect(router.resolve('/grocery').name).toBe('grocery')

    const recipe = router.resolve('/recipe/52772')
    expect(recipe.name).toBe('recipe')
    expect(recipe.params.id).toBe('52772')
  })

  it('sends unknown paths to the 404 view', () => {
    expect(router.resolve('/nope/nothing-here').name).toBe('not-found')
  })

  it.each(RESERVED_GROWTH_SLUGS)('keeps reserved growth slug %s unclaimed (404)', (slug) => {
    expect(router.resolve(slug).name).toBe('not-found')
  })
})
