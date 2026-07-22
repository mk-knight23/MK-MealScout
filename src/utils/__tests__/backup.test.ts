import { describe, it, expect } from 'vitest'
import { createBackup, parseBackup, serializeBackup } from '@/utils/backup'
import type { PantryEntry } from '@/utils/pantry'
import type { GroceryItem } from '@/utils/grocery'

const pantryEntry: PantryEntry = {
  id: 'p1',
  name: 'Eggs',
  quantityNote: '6',
  expiresAt: '2026-08-01',
  addedAt: '2026-07-20T10:00:00.000Z',
}

const groceryItem: GroceryItem = {
  id: 'g1',
  name: 'Milk',
  qtyNote: '1l',
  recipeOrigin: 'Pancakes',
  checked: false,
}

describe('backup round-trip', () => {
  it('serializes and restores all three data sets', () => {
    const backup = createBackup([pantryEntry], [groceryItem], ['52772'])
    const result = parseBackup(serializeBackup(backup))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.pantry).toEqual([pantryEntry])
      expect(result.data.grocery).toEqual([groceryItem])
      expect(result.data.favorites).toEqual(['52772'])
    }
  })
})

describe('parseBackup validation', () => {
  it('rejects corrupt JSON', () => {
    const result = parseBackup('{nope')
    expect(result.ok).toBe(false)
  })

  it('rejects non-object payloads', () => {
    expect(parseBackup('42').ok).toBe(false)
    expect(parseBackup('[]').ok).toBe(false)
  })

  it('rejects JSON without the mealscout marker', () => {
    expect(parseBackup('{"app":"other","version":1}').ok).toBe(false)
    expect(parseBackup('{"version":1,"pantry":[],"grocery":[],"favorites":[]}').ok).toBe(false)
  })

  it('rejects payloads missing data arrays', () => {
    expect(parseBackup('{"app":"mealscout","version":1,"pantry":[]}').ok).toBe(false)
  })

  it('drops invalid rows but keeps valid ones', () => {
    const raw = JSON.stringify({
      app: 'mealscout',
      version: 1,
      exportedAt: 'x',
      pantry: [pantryEntry, { junk: true }, null],
      grocery: [groceryItem, 'garbage'],
      favorites: ['1', 2, null, 'abc'],
    })
    const result = parseBackup(raw)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.pantry).toHaveLength(1)
      expect(result.data.grocery).toHaveLength(1)
      expect(result.data.favorites).toEqual(['1', 'abc'])
    }
  })
})
