export interface Recipe {
  idMeal: string
  strMeal: string
  strCategory: string
  strArea: string
  strInstructions: string
  strMealThumb: string
  strTags?: string
  strYoutube?: string
  [key: string]: string | null | undefined
}

export interface Category {
  strCategory: string
}

export interface RecipeState {
  recipes: Recipe[]
  categories: string[]
  favorites: string[] // idMeal list
  loading: boolean
  selectedCategory: string
  searchQuery: string
  errorCode: string | null
  errorMessage: string | null
}
