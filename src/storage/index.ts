import type { AsyncKeyValueStore } from './types'
import { createIndexedDbStore } from './indexedDbStore'
import { createLocalStorageStore } from './localStorageStore'
import { createMemoryStore } from './memoryStore'

export type { AsyncKeyValueStore, StorageKind } from './types'
export { migrateV1LocalStorage, V1_LOCALSTORAGE_KEYS } from './migration'
export type { MigrationReport } from './migration'

export interface CreateStorageOptions {
  /** undefined = use the global; null = treat as unavailable (tests). */
  indexedDb?: IDBFactory | null
  /** undefined = use the global; null = treat as unavailable (tests). */
  localStorage?: Storage | null
}

/**
 * Feature-detected storage: IndexedDB first, localStorage when IndexedDB is
 * unavailable (Safari private mode), in-memory as the last resort.
 */
export async function createStorage(
  options: CreateStorageOptions = {}
): Promise<AsyncKeyValueStore> {
  if (options.indexedDb !== null) {
    try {
      return await createIndexedDbStore(options.indexedDb ?? globalThis.indexedDB)
    } catch {
      // fall through to localStorage
    }
  }
  if (options.localStorage !== null) {
    try {
      return createLocalStorageStore(options.localStorage)
    } catch {
      // fall through to memory
    }
  }
  return createMemoryStore()
}

let storagePromise: Promise<AsyncKeyValueStore> | null = null

/** App-wide storage singleton. Never rejects (memory store is the floor). */
export function getStorage(): Promise<AsyncKeyValueStore> {
  if (!storagePromise) {
    storagePromise = createStorage()
  }
  return storagePromise
}

/** Test hook: forget the singleton so each test selects storage fresh. */
export function resetStorageForTests(): void {
  storagePromise = null
}
