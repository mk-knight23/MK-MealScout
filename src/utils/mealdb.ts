import type { Recipe } from '@/types/recipe'

const API_BASE = import.meta.env.VITE_MEALDB_API_BASE || 'https://www.themealdb.com/api/json/v1/1'
const DEFAULT_TIMEOUT_MS = 12000

export class MealDbError extends Error {
  status?: number
  cause?: unknown
  constructor(message: string, opts: { status?: number; cause?: unknown } = {}) {
    super(message)
    this.name = 'MealDbError'
    this.status = opts.status
    this.cause = opts.cause
  }
}

interface FetchOpts {
  signal?: AbortSignal
  timeoutMs?: number
}

async function fetchJson<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  const signals: AbortSignal[] = [controller.signal]
  if (opts.signal) signals.push(opts.signal)
  const combined = signals.length > 1 ? mergeSignals(signals) : signals[0]

  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: combined, headers: { Accept: 'application/json' } })
    if (!res.ok) throw new MealDbError(`upstream_${res.status}`, { status: res.status })
    return (await res.json()) as T
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new MealDbError(opts.signal?.aborted ? 'aborted' : 'timeout', { cause: err })
    }
    if (err instanceof MealDbError) throw err
    throw new MealDbError('network_error', { cause: err })
  } finally {
    clearTimeout(timer)
  }
}

function mergeSignals(signals: AbortSignal[]): AbortSignal {
  const ctrl = new AbortController()
  const abort = () => ctrl.abort()
  for (const s of signals) {
    if (s.aborted) {
      ctrl.abort()
      break
    }
    s.addEventListener('abort', abort, { once: true })
  }
  return ctrl.signal
}

interface MealsResponse {
  meals: Recipe[] | null
}

interface CategoriesResponse {
  meals: { strCategory: string }[] | null
}

export async function listCategories(opts?: FetchOpts): Promise<string[]> {
  const data = await fetchJson<CategoriesResponse>('/list.php?c=list', opts)
  return (data.meals ?? []).map(c => c.strCategory)
}

export async function searchRecipes(query: string, opts?: FetchOpts): Promise<Recipe[]> {
  const q = query.trim()
  const data = await fetchJson<MealsResponse>(`/search.php?s=${encodeURIComponent(q)}`, opts)
  return data.meals ?? []
}

export async function filterByCategory(category: string, opts?: FetchOpts): Promise<Recipe[]> {
  const data = await fetchJson<MealsResponse>(`/filter.php?c=${encodeURIComponent(category)}`, opts)
  return data.meals ?? []
}

export async function filterByIngredient(ingredient: string, opts?: FetchOpts): Promise<Recipe[]> {
  const data = await fetchJson<MealsResponse>(`/filter.php?i=${encodeURIComponent(ingredient)}`, opts)
  return data.meals ?? []
}

export async function lookupRecipe(id: string, opts?: FetchOpts): Promise<Recipe | null> {
  const data = await fetchJson<MealsResponse>(`/lookup.php?i=${encodeURIComponent(id)}`, opts)
  return data.meals?.[0] ?? null
}

export async function randomRecipe(opts?: FetchOpts): Promise<Recipe | null> {
  const data = await fetchJson<MealsResponse>('/random.php', opts)
  return data.meals?.[0] ?? null
}

export function extractIngredients(recipe: Recipe): { name: string; measure: string }[] {
  const out: { name: string; measure: string }[] = []
  for (let i = 1; i <= 20; i++) {
    const name = (recipe[`strIngredient${i}`] as string | undefined)?.trim()
    const measure = (recipe[`strMeasure${i}`] as string | undefined)?.trim()
    if (name) out.push({ name, measure: measure || '' })
  }
  return out
}
