import { describe, it, expect } from 'vitest'
import { matchBadgeLabel, mergeIngredientMatches } from '@/utils/matching'
import type { Recipe } from '@/types/recipe'

function recipe(id: string, name: string): Recipe {
  return {
    idMeal: id,
    strMeal: name,
    strCategory: 'Test',
    strArea: 'Test',
    strInstructions: '',
    strMealThumb: '',
  }
}

const omelette = recipe('1', 'Omelette')
const carbonara = recipe('2', 'Carbonara')
const friedRice = recipe('3', 'Fried Rice')

describe('mergeIngredientMatches (pantry match scoring)', () => {
  it('returns empty list for no results', () => {
    expect(mergeIngredientMatches([])).toEqual([])
  })

  it('scores a recipe once per distinct matching ingredient', () => {
    const merged = mergeIngredientMatches([
      { ingredient: 'Eggs', recipes: [omelette, carbonara, friedRice] },
      { ingredient: 'Rice', recipes: [friedRice] },
      { ingredient: 'Cheese', recipes: [carbonara, friedRice] },
    ])
    const byName = Object.fromEntries(merged.map((m) => [m.recipe.strMeal, m]))
    expect(byName['Fried Rice']!.score).toBe(3)
    expect(byName['Carbonara']!.score).toBe(2)
    expect(byName['Omelette']!.score).toBe(1)
    expect(byName['Fried Rice']!.matchedIngredients).toEqual(['Cheese', 'Eggs', 'Rice'])
  })

  it('sorts by score descending, then recipe name ascending', () => {
    const merged = mergeIngredientMatches([
      { ingredient: 'Eggs', recipes: [carbonara, omelette] },
      { ingredient: 'Rice', recipes: [friedRice] },
    ])
    expect(merged.map((m) => m.recipe.strMeal)).toEqual(['Carbonara', 'Fried Rice', 'Omelette'])
  })

  it('does not double-count the same ingredient listed twice', () => {
    const merged = mergeIngredientMatches([
      { ingredient: 'Eggs', recipes: [omelette] },
      { ingredient: 'Eggs', recipes: [omelette] },
    ])
    expect(merged).toHaveLength(1)
    expect(merged[0]!.score).toBe(1)
  })

  it('deduplicates the same recipe returned for one ingredient', () => {
    const merged = mergeIngredientMatches([{ ingredient: 'Eggs', recipes: [omelette, omelette] }])
    expect(merged).toHaveLength(1)
    expect(merged[0]!.score).toBe(1)
  })

  it('ignores blank ingredient labels and recipes without ids', () => {
    const broken = { ...omelette, idMeal: '' }
    const merged = mergeIngredientMatches([
      { ingredient: '   ', recipes: [carbonara] },
      { ingredient: 'Eggs', recipes: [broken as Recipe, omelette] },
    ])
    expect(merged).toHaveLength(1)
    expect(merged[0]!.recipe.strMeal).toBe('Omelette')
  })
})

describe('matchBadgeLabel', () => {
  it('pluralizes correctly', () => {
    expect(matchBadgeLabel(1)).toBe('Matches 1 of your ingredients')
    expect(matchBadgeLabel(3)).toBe('Matches 3 of your ingredients')
  })
})
