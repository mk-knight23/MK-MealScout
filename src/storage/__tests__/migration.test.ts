import { describe, it, expect } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { createIndexedDbStore } from '../indexedDbStore'
import { createLocalStorageStore } from '../localStorageStore'
import { migrateV1LocalStorage, V1_LOCALSTORAGE_KEYS } from '../migration'
import type { AsyncKeyValueStore } from '../types'

const PANTRY_KEY = 'mealscout:v1:pantry'
const GROCERY_KEY = 'mealscout:v1:grocery'

const pantryEnvelope = JSON.stringify({
  version: 1,
  entries: [
    { id: 'p1', name: 'Eggs', quantityNote: '', expiresAt: '', addedAt: '2026-01-01T00:00:00Z' },
  ],
})
const groceryEnvelope = JSON.stringify({
  version: 1,
  items: [{ id: 'g1', name: 'Milk', qtyNote: '1l', recipeOrigin: '', checked: false }],
})

describe('migrateV1LocalStorage (non-destructive copy)', () => {
  it('copies v1 envelopes into IndexedDB and KEEPS the localStorage keys', async () => {
    localStorage.setItem(PANTRY_KEY, pantryEnvelope)
    localStorage.setItem(GROCERY_KEY, groceryEnvelope)
    const target = await createIndexedDbStore(new IDBFactory())

    const report = await migrateV1LocalStorage(target)

    expect(report.copied.sort()).toEqual([GROCERY_KEY, PANTRY_KEY])
    expect(report.failed).toEqual([])
    // Copied + verified in the target…
    expect(await target.getItem(PANTRY_KEY)).toBe(pantryEnvelope)
    expect(await target.getItem(GROCERY_KEY)).toBe(groceryEnvelope)
    // …and the v1 localStorage keys are retained (one-release rollback safety).
    expect(localStorage.getItem(PANTRY_KEY)).toBe(pantryEnvelope)
    expect(localStorage.getItem(GROCERY_KEY)).toBe(groceryEnvelope)
  })

  it('never overwrites data already present in the target', async () => {
    localStorage.setItem(PANTRY_KEY, pantryEnvelope)
    const target = await createIndexedDbStore(new IDBFactory())
    await target.setItem(PANTRY_KEY, 'newer-idb-data')

    const report = await migrateV1LocalStorage(target)

    expect(await target.getItem(PANTRY_KEY)).toBe('newer-idb-data')
    expect(report.copied).not.toContain(PANTRY_KEY)
    expect(report.skipped).toContain(PANTRY_KEY)
  })

  it('skips keys with no v1 data', async () => {
    const target = await createIndexedDbStore(new IDBFactory())
    const report = await migrateV1LocalStorage(target)
    expect(report.copied).toEqual([])
    expect(report.skipped.sort()).toEqual([...V1_LOCALSTORAGE_KEYS].sort())
  })

  it('is a no-op on the localStorage fallback (source and target share keys)', async () => {
    localStorage.setItem(PANTRY_KEY, pantryEnvelope)
    const target = createLocalStorageStore()

    const report = await migrateV1LocalStorage(target)

    expect(report.copied).toEqual([])
    expect(localStorage.getItem(PANTRY_KEY)).toBe(pantryEnvelope)
  })

  it('reports and removes a copy that fails read-back verification', async () => {
    localStorage.setItem(PANTRY_KEY, pantryEnvelope)
    const removed: string[] = []
    let wasWritten = false
    // Empty before the copy, returns garbage after it: simulates a write
    // that lands corrupted.
    const corrupting: AsyncKeyValueStore = {
      kind: 'indexeddb',
      getItem: async (key) => (wasWritten && !removed.includes(key) ? 'corrupted-write' : null),
      setItem: async () => {
        wasWritten = true
      },
      removeItem: async (key) => {
        removed.push(key)
      },
    }

    const report = await migrateV1LocalStorage(corrupting)

    expect(report.failed).toContain(PANTRY_KEY)
    expect(removed).toContain(PANTRY_KEY)
    // Source data untouched.
    expect(localStorage.getItem(PANTRY_KEY)).toBe(pantryEnvelope)
  })

  it('is idempotent: a second run copies nothing new', async () => {
    localStorage.setItem(PANTRY_KEY, pantryEnvelope)
    const target = await createIndexedDbStore(new IDBFactory())

    const first = await migrateV1LocalStorage(target)
    const second = await migrateV1LocalStorage(target)

    expect(first.copied).toContain(PANTRY_KEY)
    expect(second.copied).toEqual([])
    expect(second.skipped).toContain(PANTRY_KEY)
  })
})
