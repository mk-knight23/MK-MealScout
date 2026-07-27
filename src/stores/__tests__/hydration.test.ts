// Hydration mechanics (V3 feasibility-review mandate): ready-gate +
// mutation queue. The exact race pinned here: a store mutation that fires
// BEFORE async hydration completes must NEVER persist an empty/partial
// array over the real data already in storage.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { IDBFactory } from 'fake-indexeddb'
import { usePantryStore } from '../pantryStore'
import { useGroceryStore } from '../groceryStore'
import { getStorage, resetStorageForTests } from '@/storage'
import { PANTRY_STORAGE_KEY, parsePantryJson, serializePantry } from '@/utils/pantry'
import { GROCERY_STORAGE_KEY, parseGroceryJson, serializeGrocery } from '@/utils/grocery'
import type { PantryEntry } from '@/utils/pantry'
import type { GroceryItem } from '@/utils/grocery'

const realPantry: PantryEntry[] = ['Eggs', 'Milk', 'Butter'].map((name, i) => ({
  id: `real-${i}`,
  name,
  quantityNote: '',
  expiresAt: '',
  addedAt: '2026-01-01T00:00:00.000Z',
}))

const realGrocery: GroceryItem[] = [
  { id: 'rg-1', name: 'Flour', qtyNote: '1 kg', recipeOrigin: '', checked: false },
  { id: 'rg-2', name: 'Sugar', qtyNote: '', recipeOrigin: '', checked: true },
]

function seedPantry(entries: PantryEntry[]): void {
  localStorage.setItem(PANTRY_STORAGE_KEY, serializePantry(entries))
}

function seedGrocery(items: GroceryItem[]): void {
  localStorage.setItem(GROCERY_STORAGE_KEY, serializeGrocery(items))
}

async function persistedPantry(): Promise<PantryEntry[]> {
  const storage = await getStorage()
  return parsePantryJson(await storage.getItem(PANTRY_STORAGE_KEY))
}

async function persistedGrocery(): Promise<GroceryItem[]> {
  const storage = await getStorage()
  return parseGroceryJson(await storage.getItem(GROCERY_STORAGE_KEY))
}

/** Let queued microtasks/fire-and-forget persists settle. */
async function flushAsync(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  setActivePinia(createPinia())
  resetStorageForTests()
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetStorageForTests()
})

describe('pantry hydration race (ready-gate + mutation queue)', () => {
  it('a write BEFORE hydration never persists an empty array over real data', async () => {
    seedPantry(realPantry)
    const pantry = usePantryStore()

    // Mutation fires before hydrate() has even been called.
    pantry.addEntry('Saffron')
    await flushAsync()

    // Gate: nothing may have been written yet.
    expect((await persistedPantry()).map((e) => e.name)).toEqual(['Eggs', 'Milk', 'Butter'])

    await pantry.hydrate()
    await flushAsync()

    // Replay: hydrated data + the queued mutation, never just ['Saffron'].
    expect(pantry.entries.map((e) => e.name)).toEqual(['Eggs', 'Milk', 'Butter', 'Saffron'])
    expect((await persistedPantry()).map((e) => e.name)).toEqual([
      'Eggs',
      'Milk',
      'Butter',
      'Saffron',
    ])
  })

  it('a write DURING in-flight hydration is replayed on the hydrated data', async () => {
    seedPantry(realPantry)
    const pantry = usePantryStore()

    const hydrating = pantry.hydrate()
    pantry.addEntry('Saffron') // hydration still in flight
    await hydrating
    await flushAsync()

    expect(pantry.entries.map((e) => e.name)).toEqual(['Eggs', 'Milk', 'Butter', 'Saffron'])
    expect((await persistedPantry()).map((e) => e.name)).toEqual([
      'Eggs',
      'Milk',
      'Butter',
      'Saffron',
    ])
  })

  it('replay re-checks duplicates against the hydrated data', async () => {
    seedPantry(realPantry)
    const pantry = usePantryStore()

    pantry.addEntry('Eggs') // already in storage, unknown to the empty store
    await pantry.hydrate()
    await flushAsync()

    expect(pantry.entries.filter((e) => e.name === 'Eggs')).toHaveLength(1)
    expect((await persistedPantry()).filter((e) => e.name === 'Eggs')).toHaveLength(1)
  })

  it('exposes isReady=false until hydration completes (empty-state gating)', async () => {
    seedPantry(realPantry)
    const pantry = usePantryStore()

    expect(pantry.isReady).toBe(false)
    await pantry.hydrate()
    expect(pantry.isReady).toBe(true)
    expect(pantry.count).toBe(3)
  })

  it('persists normally once hydrated', async () => {
    seedPantry(realPantry)
    const pantry = usePantryStore()
    await pantry.hydrate()

    pantry.addEntry('Saffron')
    await flushAsync()

    expect((await persistedPantry()).map((e) => e.name)).toContain('Saffron')
    pantry.removeEntry('real-0')
    await flushAsync()
    expect((await persistedPantry()).map((e) => e.name)).not.toContain('Eggs')
  })
})

describe('grocery hydration race (ready-gate + mutation queue)', () => {
  it('a write BEFORE hydration never persists an empty array over real data', async () => {
    seedGrocery(realGrocery)
    const grocery = useGroceryStore()

    grocery.addManualItem('Yeast')
    await flushAsync()
    expect((await persistedGrocery()).map((i) => i.name)).toEqual(['Flour', 'Sugar'])

    await grocery.hydrate()
    await flushAsync()

    expect(grocery.items.map((i) => i.name)).toEqual(['Flour', 'Sugar', 'Yeast'])
    expect((await persistedGrocery()).map((i) => i.name)).toEqual(['Flour', 'Sugar', 'Yeast'])
  })

  it('queued adds consolidate into hydrated duplicates instead of duplicating', async () => {
    seedGrocery(realGrocery)
    const grocery = useGroceryStore()

    grocery.addItems([{ name: 'Flour', qtyNote: '500 g' }])
    await grocery.hydrate()
    await flushAsync()

    const flour = grocery.items.filter((i) => i.name === 'Flour')
    expect(flour).toHaveLength(1)
    expect(flour[0]!.qtyNote).toBe('1 1/2 kg') // unit-aware consolidation
  })

  it('exposes isReady=false until hydration completes', async () => {
    const grocery = useGroceryStore()
    expect(grocery.isReady).toBe(false)
    await grocery.hydrate()
    expect(grocery.isReady).toBe(true)
  })
})

describe('hydration through IndexedDB (end-to-end with migration)', () => {
  it('migrates v1 data into IndexedDB, hydrates from it, and keeps v1 keys', async () => {
    vi.stubGlobal('indexedDB', new IDBFactory())
    resetStorageForTests()
    seedPantry(realPantry)

    const pantry = usePantryStore()
    await pantry.hydrate()
    await flushAsync()

    const storage = await getStorage()
    expect(storage.kind).toBe('indexeddb')
    expect(pantry.entries.map((e) => e.name)).toEqual(['Eggs', 'Milk', 'Butter'])

    // New writes land in IndexedDB…
    pantry.addEntry('Saffron')
    await flushAsync()
    expect(parsePantryJson(await storage.getItem(PANTRY_STORAGE_KEY)).map((e) => e.name)).toEqual([
      'Eggs',
      'Milk',
      'Butter',
      'Saffron',
    ])
    // …and the v1 localStorage envelope is retained (one-release rollback).
    expect(parsePantryJson(localStorage.getItem(PANTRY_STORAGE_KEY)).map((e) => e.name)).toEqual([
      'Eggs',
      'Milk',
      'Butter',
    ])
  })
})
