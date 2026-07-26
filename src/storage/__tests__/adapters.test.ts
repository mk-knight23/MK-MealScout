import { describe, it, expect } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { createIndexedDbStore } from '../indexedDbStore'
import { createLocalStorageStore } from '../localStorageStore'
import { createMemoryStore } from '../memoryStore'
import { createStorage } from '../index'

describe('IndexedDB adapter', () => {
  it('round-trips string values and reports its kind', async () => {
    const store = await createIndexedDbStore(new IDBFactory())
    expect(store.kind).toBe('indexeddb')

    await store.setItem('k1', 'value-1')
    expect(await store.getItem('k1')).toBe('value-1')

    await store.removeItem('k1')
    expect(await store.getItem('k1')).toBeNull()
  })

  it('returns null for missing keys', async () => {
    const store = await createIndexedDbStore(new IDBFactory())
    expect(await store.getItem('nope')).toBeNull()
  })

  it('persists across adapter instances sharing the same database', async () => {
    const factory = new IDBFactory()
    const first = await createIndexedDbStore(factory)
    await first.setItem('shared', 'survives')

    const second = await createIndexedDbStore(factory)
    expect(await second.getItem('shared')).toBe('survives')
  })

  it('rejects when IndexedDB is unavailable', async () => {
    await expect(createIndexedDbStore(undefined)).rejects.toThrow()
  })
})

describe('localStorage adapter', () => {
  it('round-trips through window.localStorage with the same keys', async () => {
    const store = createLocalStorageStore()
    expect(store.kind).toBe('localstorage')

    await store.setItem('ls-key', 'ls-value')
    expect(localStorage.getItem('ls-key')).toBe('ls-value')
    expect(await store.getItem('ls-key')).toBe('ls-value')

    await store.removeItem('ls-key')
    expect(await store.getItem('ls-key')).toBeNull()
  })

  it('throws when localStorage is unavailable', () => {
    expect(() => createLocalStorageStore(null)).toThrow()
  })
})

describe('memory adapter (last resort)', () => {
  it('round-trips in memory', async () => {
    const store = createMemoryStore()
    expect(store.kind).toBe('memory')
    await store.setItem('m', '1')
    expect(await store.getItem('m')).toBe('1')
    await store.removeItem('m')
    expect(await store.getItem('m')).toBeNull()
  })
})

describe('createStorage (feature detection + fallback chain)', () => {
  it('prefers IndexedDB when available', async () => {
    const store = await createStorage({ indexedDb: new IDBFactory() })
    expect(store.kind).toBe('indexeddb')
  })

  it('falls back to localStorage when IndexedDB is unavailable (Safari private mode)', async () => {
    const store = await createStorage({ indexedDb: null })
    expect(store.kind).toBe('localstorage')

    await store.setItem('fallback-key', 'x')
    expect(localStorage.getItem('fallback-key')).toBe('x')
    await store.removeItem('fallback-key')
  })

  it('falls back to memory when both are unavailable', async () => {
    const store = await createStorage({ indexedDb: null, localStorage: null })
    expect(store.kind).toBe('memory')
  })
})
