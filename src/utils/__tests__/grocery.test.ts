import { describe, it, expect } from 'vitest'
import {
  consolidateItems,
  formatGroceryText,
  parseGroceryJson,
  serializeGrocery,
  type GroceryItem,
} from '@/utils/grocery'

function makeIdFactory(): () => string {
  let n = 0
  return () => `id-${++n}`
}

const eggs: GroceryItem = {
  id: 'g1',
  name: 'Eggs',
  qtyNote: '2',
  recipeOrigin: 'Omelette',
  checked: false,
}

describe('consolidateItems (grocery consolidation)', () => {
  it('adds new items with generated ids', () => {
    const result = consolidateItems([], [{ name: 'Milk', qtyNote: '1l' }], makeIdFactory())
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 'id-1', name: 'Milk', qtyNote: '1l', checked: false })
  })

  it('merges case-insensitive duplicate names and appends origin', () => {
    const result = consolidateItems(
      [eggs],
      [{ name: 'eggs', qtyNote: '4', recipeOrigin: 'Carbonara' }],
      makeIdFactory()
    )
    expect(result).toHaveLength(1)
    expect(result[0]!.name).toBe('Eggs')
    expect(result[0]!.qtyNote).toBe('2 + 4')
    expect(result[0]!.recipeOrigin).toBe('Omelette, Carbonara')
  })

  it('does not repeat an origin already present', () => {
    const result = consolidateItems(
      [eggs],
      [{ name: 'EGGS', recipeOrigin: 'omelette' }],
      makeIdFactory()
    )
    expect(result[0]!.recipeOrigin).toBe('Omelette')
  })

  it('unchecks a checked item when it is re-added', () => {
    const done = { ...eggs, checked: true }
    const result = consolidateItems([done], [{ name: 'Eggs' }], makeIdFactory())
    expect(result[0]!.checked).toBe(false)
  })

  it('consolidates duplicates within the incoming batch itself', () => {
    const result = consolidateItems(
      [],
      [
        { name: 'Flour', recipeOrigin: 'Bread' },
        { name: 'flour', recipeOrigin: 'Pasta' },
      ],
      makeIdFactory()
    )
    expect(result).toHaveLength(1)
    expect(result[0]!.recipeOrigin).toBe('Bread, Pasta')
  })

  it('skips blank names and does not mutate inputs', () => {
    const existing = [eggs]
    const incoming = [{ name: '   ' }, { name: 'Salt' }]
    const result = consolidateItems(existing, incoming, makeIdFactory())
    expect(result.map((i) => i.name)).toEqual(['Eggs', 'Salt'])
    expect(existing[0]).toEqual(eggs) // untouched
  })
})

describe('parseGroceryJson (corrupt-input handling)', () => {
  it('returns empty list for null, corrupt, or wrong-shaped input', () => {
    expect(parseGroceryJson(null)).toEqual([])
    expect(parseGroceryJson('{oops')).toEqual([])
    expect(parseGroceryJson('123')).toEqual([])
    expect(parseGroceryJson('{"items":"nope"}')).toEqual([])
  })

  it('drops invalid items, keeps valid ones, round-trips', () => {
    const raw = serializeGrocery([eggs])
    expect(parseGroceryJson(raw)).toEqual([eggs])

    const mixed = JSON.stringify({
      version: 1,
      items: [eggs, { id: 'x' }, null, { id: 'g2', name: 'Milk' }],
    })
    const result = parseGroceryJson(mixed)
    expect(result.map((i) => i.name)).toEqual(['Eggs', 'Milk'])
    expect(result[1]!.checked).toBe(false)
  })
})

describe('formatGroceryText', () => {
  it('renders checkboxes, quantities and origins', () => {
    const text = formatGroceryText([
      eggs,
      { id: 'g2', name: 'Milk', qtyNote: '', recipeOrigin: '', checked: true },
    ])
    expect(text).toContain('[ ] Eggs — 2 (for: Omelette)')
    expect(text).toContain('[x] Milk')
    expect(text.startsWith('MK MealScout — Grocery List')).toBe(true)
  })
})
