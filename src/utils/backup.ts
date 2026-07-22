// JSON backup/restore of all local MealScout data (pantry, grocery, favorites).
// Pure validation logic; file I/O lives in the UI layer.

import type { PantryEntry } from '@/utils/pantry'
import { sanitizePantryEntry } from '@/utils/pantry'
import type { GroceryItem } from '@/utils/grocery'
import { sanitizeGroceryItem } from '@/utils/grocery'

export interface BackupPayload {
  app: 'mealscout'
  version: 1
  exportedAt: string
  pantry: PantryEntry[]
  grocery: GroceryItem[]
  favorites: string[]
}

export type BackupResult =
  | { ok: true; data: BackupPayload }
  | { ok: false; error: string }

export function createBackup(
  pantry: PantryEntry[],
  grocery: GroceryItem[],
  favorites: string[]
): BackupPayload {
  return {
    app: 'mealscout',
    version: 1,
    exportedAt: new Date().toISOString(),
    pantry: [...pantry],
    grocery: [...grocery],
    favorites: [...favorites],
  }
}

export function serializeBackup(payload: BackupPayload): string {
  return JSON.stringify(payload, null, 2)
}

/**
 * Validate a backup file's contents. Never throws. Invalid entries inside
 * otherwise-valid arrays are dropped; a structurally wrong file is rejected.
 */
export function parseBackup(raw: string): BackupResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'Not a valid JSON file.' }
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'Not a MealScout backup file.' }
  }
  const obj = parsed as Record<string, unknown>
  if (obj.app !== 'mealscout' || obj.version !== 1) {
    return { ok: false, error: 'Not a MealScout backup file (missing app/version marker).' }
  }
  if (!Array.isArray(obj.pantry) || !Array.isArray(obj.grocery) || !Array.isArray(obj.favorites)) {
    return { ok: false, error: 'Backup file is missing pantry, grocery, or favorites data.' }
  }

  const pantry: PantryEntry[] = []
  const seenPantry = new Set<string>()
  for (const item of obj.pantry) {
    const entry = sanitizePantryEntry(item)
    if (entry && !seenPantry.has(entry.id)) {
      seenPantry.add(entry.id)
      pantry.push(entry)
    }
  }

  const grocery: GroceryItem[] = []
  const seenGrocery = new Set<string>()
  for (const item of obj.grocery) {
    const entry = sanitizeGroceryItem(item)
    if (entry && !seenGrocery.has(entry.id)) {
      seenGrocery.add(entry.id)
      grocery.push(entry)
    }
  }

  const favorites = obj.favorites.filter((f): f is string => typeof f === 'string')

  return {
    ok: true,
    data: {
      app: 'mealscout',
      version: 1,
      exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : '',
      pantry,
      grocery,
      favorites,
    },
  }
}
