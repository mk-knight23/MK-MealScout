import { defineStore } from 'pinia'
import type { Recipe, RecipeState } from '@/types/recipe'
import {
  MealDbError,
  filterByCategory,
  filterByIngredient,
  listCategories,
  lookupRecipe,
  randomRecipe,
  searchRecipes,
} from '@/utils/mealdb'

const FAVORITES_KEY = 'recipe-favorites'

interface ExtendedRecipeState extends RecipeState {
  errorCode: string | null
  errorMessage: string | null
}

function readFavorites(): string[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : []
  } catch {
    return []
  }
}

function writeFavorites(ids: string[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
  } catch {
    // storage may be full or disabled; user-visible surfacing handled elsewhere
  }
}

function isMealDbError(err: unknown): err is MealDbError {
  return err instanceof Error && err.name === 'MealDbError'
}

export const useRecipeStore = defineStore('recipe', {
  state: (): ExtendedRecipeState => ({
    recipes: [],
    categories: [],
    favorites: readFavorites(),
    loading: false,
    selectedCategory: 'All',
    searchQuery: '',
    errorCode: null,
    errorMessage: null,
  }),

  getters: {
    hasError: state => state.errorCode !== null,
    favoriteRecipes: state => state.recipes.filter(r => state.favorites.includes(r.idMeal)),
  },

  actions: {
    _clearError() {
      this.errorCode = null
      this.errorMessage = null
    },

    _recordError(err: unknown, fallbackMessage: string) {
      if (isMealDbError(err)) {
        this.errorCode = (err as MealDbError).message
      } else {
        this.errorCode = 'unknown_error'
      }
      this.errorMessage = fallbackMessage
    },

    async fetchCategories() {
      this._clearError()
      try {
        const cats = await listCategories()
        this.categories = ['All', ...cats]
      } catch (err) {
        this._recordError(err, 'Could not load categories. Try again in a moment.')
      }
    },

    async searchRecipes(query: string) {
      this.loading = true
      this.searchQuery = query
      this._clearError()
      try {
        this.recipes = await searchRecipes(query)
      } catch (err) {
        this._recordError(err, 'Search unavailable right now.')
        this.recipes = []
      } finally {
        this.loading = false
      }
    },

    async fetchByCategory(category: string) {
      if (category === 'All') return this.searchRecipes('')
      this.loading = true
      this.selectedCategory = category
      this._clearError()
      try {
        this.recipes = await filterByCategory(category)
      } catch (err) {
        this._recordError(err, `Could not load ${category} recipes.`)
        this.recipes = []
      } finally {
        this.loading = false
      }
    },

    async fetchByIngredient(ingredient: string) {
      this.loading = true
      this._clearError()
      try {
        this.recipes = await filterByIngredient(ingredient)
      } catch (err) {
        this._recordError(err, `Could not load recipes for ${ingredient}.`)
        this.recipes = []
      } finally {
        this.loading = false
      }
    },

    async fetchRandom(): Promise<Recipe | null> {
      this._clearError()
      try {
        return await randomRecipe()
      } catch (err) {
        this._recordError(err, 'Could not load a random recipe.')
        return null
      }
    },

    async lookupById(id: string): Promise<Recipe | null> {
      this._clearError()
      try {
        return await lookupRecipe(id)
      } catch (err) {
        this._recordError(err, 'Could not load this recipe.')
        return null
      }
    },

    toggleFavorite(id: string) {
      const next = this.favorites.includes(id)
        ? this.favorites.filter(f => f !== id)
        : [...this.favorites, id]
      this.favorites = next
      writeFavorites(next)
    },

    isFavorite(id: string): boolean {
      return this.favorites.includes(id)
    },
  },
})
