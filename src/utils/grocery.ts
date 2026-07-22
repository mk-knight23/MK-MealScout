// Grocery list domain logic: item schema, schema-guarded persistence parsing,
// case-insensitive consolidation, and export formatting. Pure logic, no DOM.

export interface GroceryItem {
  id: string
  name: string
  /** Free-text quantity note, e.g. "2 cups", "1 can". */
  qtyNote: string
  /** Recipe name(s) this item came from; empty for manual adds. */
  recipeOrigin: string
  checked: boolean
}

/** Input shape for items being added (id/checked assigned during consolidation). */
export interface NewGroceryItem {
  name: string
  qtyNote?: string
  recipeOrigin?: string
}

export const GROCERY_STORAGE_KEY = 'mealscout:v1:grocery'

interface GroceryFile {
  version: 1
  items: GroceryItem[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asOptionalString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function sanitizeGroceryItem(raw: unknown): GroceryItem | null {
  if (!isRecord(raw)) return null
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) return null
  const id = typeof raw.id === 'string' && raw.id ? raw.id : ''
  if (!id) return null
  return {
    id,
    name,
    qtyNote: asOptionalString(raw.qtyNote).trim(),
    recipeOrigin: asOptionalString(raw.recipeOrigin).trim(),
    checked: raw.checked === true,
  }
}

/** Parse persisted grocery JSON; corrupt input yields an empty list, never throws. */
export function parseGroceryJson(raw: string | null): GroceryItem[] {
  if (!raw) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  const list = isRecord(parsed) && Array.isArray(parsed.items) ? parsed.items : null
  if (!list) return []
  const out: GroceryItem[] = []
  const seen = new Set<string>()
  for (const item of list) {
    const sanitized = sanitizeGroceryItem(item)
    if (sanitized && !seen.has(sanitized.id)) {
      seen.add(sanitized.id)
      out.push(sanitized)
    }
  }
  return out
}

export function serializeGrocery(items: GroceryItem[]): string {
  const file: GroceryFile = { version: 1, items }
  return JSON.stringify(file)
}

function mergeNotes(existing: string, incoming: string): string {
  const a = existing.trim()
  const b = incoming.trim()
  if (!b || a.toLowerCase() === b.toLowerCase()) return a
  if (!a) return b
  return `${a} + ${b}`
}

function mergeOrigins(existing: string, incoming: string): string {
  const a = existing.trim()
  const b = incoming.trim()
  if (!b) return a
  if (!a) return b
  const parts = a.split(',').map((s) => s.trim().toLowerCase())
  if (parts.includes(b.toLowerCase())) return a
  return `${a}, ${b}`
}

/**
 * Consolidate incoming items into an existing list. Duplicate names
 * (case-insensitive) merge into the existing item: quantity notes are
 * combined and the recipe origin is appended. Returns a new array;
 * neither input is mutated.
 */
export function consolidateItems(
  existing: GroceryItem[],
  incoming: NewGroceryItem[],
  makeId: () => string
): GroceryItem[] {
  const result = existing.map((item) => ({ ...item }))
  const indexByName = new Map<string, number>()
  result.forEach((item, i) => indexByName.set(item.name.toLowerCase(), i))

  for (const raw of incoming) {
    const name = raw.name.trim()
    if (!name) continue
    const key = name.toLowerCase()
    const qtyNote = (raw.qtyNote ?? '').trim()
    const recipeOrigin = (raw.recipeOrigin ?? '').trim()
    const existingIndex = indexByName.get(key)
    const current = existingIndex !== undefined ? result[existingIndex] : undefined

    if (existingIndex !== undefined && current) {
      result[existingIndex] = {
        ...current,
        qtyNote: mergeNotes(current.qtyNote, qtyNote),
        recipeOrigin: mergeOrigins(current.recipeOrigin, recipeOrigin),
        checked: false, // re-adding an item means it is needed again
      }
    } else {
      const item: GroceryItem = { id: makeId(), name, qtyNote, recipeOrigin, checked: false }
      indexByName.set(key, result.length)
      result.push(item)
    }
  }
  return result
}

/** Plain-text rendering used for copy-to-clipboard and .txt download. */
export function formatGroceryText(items: GroceryItem[]): string {
  const lines = items.map((item) => {
    const box = item.checked ? '[x]' : '[ ]'
    const qty = item.qtyNote ? ` — ${item.qtyNote}` : ''
    const origin = item.recipeOrigin ? ` (for: ${item.recipeOrigin})` : ''
    return `${box} ${item.name}${qty}${origin}`
  })
  return ['MK MealScout — Grocery List', '', ...lines, ''].join('\n')
}
