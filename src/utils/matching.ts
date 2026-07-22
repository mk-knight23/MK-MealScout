// Ingredient-first recipe matching: merge per-ingredient filter results and
// score each recipe by how many pantry ingredients it matched. Pure logic.

import type { Recipe } from '@/types/recipe'

/** Cap on how many pantry ingredients are queried per search. */
export const MAX_MATCH_INGREDIENTS = 8

export interface IngredientResult {
  ingredient: string
  recipes: Recipe[]
}

export interface RecipeMatch {
  recipe: Recipe
  /** Distinct pantry ingredients that matched this recipe. */
  matchedIngredients: string[]
  /** Number of distinct pantry ingredients matched. */
  score: number
}

/**
 * Merge per-ingredient filter results into one deduplicated, scored list,
 * sorted by score descending, then recipe name ascending for stable output.
 */
export function mergeIngredientMatches(results: IngredientResult[]): RecipeMatch[] {
  const byId = new Map<string, { recipe: Recipe; matched: Set<string> }>()

  for (const { ingredient, recipes } of results) {
    const label = ingredient.trim()
    if (!label) continue
    for (const recipe of recipes) {
      if (!recipe?.idMeal) continue
      const existing = byId.get(recipe.idMeal)
      if (existing) {
        existing.matched.add(label)
      } else {
        byId.set(recipe.idMeal, { recipe, matched: new Set([label]) })
      }
    }
  }

  return Array.from(byId.values())
    .map(({ recipe, matched }) => ({
      recipe,
      matchedIngredients: Array.from(matched).sort((a, b) => a.localeCompare(b)),
      score: matched.size,
    }))
    .sort((a, b) => b.score - a.score || a.recipe.strMeal.localeCompare(b.recipe.strMeal))
}

/** Human label for the match badge, e.g. "Matches 3 of your ingredients". */
export function matchBadgeLabel(score: number): string {
  return score === 1 ? 'Matches 1 of your ingredients' : `Matches ${score} of your ingredients`
}
