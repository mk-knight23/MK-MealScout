// Pantry domain logic: entry schema, schema-guarded persistence parsing,
// expiry helpers, and quick-start presets. Pure functions, no DOM, no network.

export interface PantryEntry {
  id: string
  name: string
  /** Optional free-text quantity note, e.g. "2 packs", "500g". */
  quantityNote: string
  /** Optional expiry date as ISO string (YYYY-MM-DD). Empty string = none. */
  expiresAt: string
  /** ISO timestamp when the entry was added. */
  addedAt: string
}

export const PANTRY_STORAGE_KEY = 'mealscout:v1:pantry'
export const EXPIRING_SOON_WINDOW_DAYS = 5

const MS_PER_DAY = 24 * 60 * 60 * 1000

interface PantryFile {
  version: 1
  entries: PantryEntry[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asOptionalString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** Validate a single raw entry; returns null when it cannot be salvaged. */
export function sanitizePantryEntry(raw: unknown): PantryEntry | null {
  if (!isRecord(raw)) return null
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) return null
  const id = typeof raw.id === 'string' && raw.id ? raw.id : ''
  if (!id) return null
  return {
    id,
    name,
    quantityNote: asOptionalString(raw.quantityNote).trim(),
    expiresAt: asOptionalString(raw.expiresAt).trim(),
    addedAt: asOptionalString(raw.addedAt) || new Date().toISOString(),
  }
}

/**
 * Parse persisted pantry JSON. Corrupt JSON, wrong shapes, or invalid entries
 * never throw — bad entries are dropped and worst case yields an empty pantry.
 */
export function parsePantryJson(raw: string | null): PantryEntry[] {
  if (!raw) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  const list = isRecord(parsed) && Array.isArray(parsed.entries) ? parsed.entries : null
  if (!list) return []
  const out: PantryEntry[] = []
  const seen = new Set<string>()
  for (const item of list) {
    const entry = sanitizePantryEntry(item)
    if (entry && !seen.has(entry.id)) {
      seen.add(entry.id)
      out.push(entry)
    }
  }
  return out
}

export function serializePantry(entries: PantryEntry[]): string {
  const file: PantryFile = { version: 1, entries }
  return JSON.stringify(file)
}

/**
 * True when the expiry date falls within the next `windowDays` days
 * (inclusive), or is already past. Invalid/empty dates are never "soon".
 */
export function isExpiringSoon(
  expiresAt: string,
  now: Date = new Date(),
  windowDays: number = EXPIRING_SOON_WINDOW_DAYS
): boolean {
  const days = daysUntilExpiry(expiresAt, now)
  return days !== null && days <= windowDays
}

/** Whole days until expiry (negative = past). Null for empty/invalid dates. */
export function daysUntilExpiry(expiresAt: string, now: Date = new Date()): number | null {
  if (!expiresAt) return null
  const target = new Date(expiresAt)
  if (Number.isNaN(target.getTime())) return null
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.round((startOfTarget.getTime() - startOfToday.getTime()) / MS_PER_DAY)
}

export interface PantryPreset {
  label: string
  ingredients: string[]
}

// Names verified against TheMealDB list.php?i=list so ingredient matching works.
export const PANTRY_PRESETS: PantryPreset[] = [
  {
    label: 'Basics',
    ingredients: [
      'Eggs',
      'Milk',
      'Butter',
      'Flour',
      'Garlic',
      'Onion',
      'Rice',
      'Potatoes',
      'Cheese',
      'Olive Oil',
    ],
  },
  {
    label: 'Vegetarian staples',
    ingredients: [
      'Chickpeas',
      'Lentils',
      'Spinach',
      'Mushrooms',
      'Carrots',
      'Broccoli',
      'Tofu',
      'Peas',
      'Coconut Milk',
      'Soy Sauce',
    ],
  },
]
