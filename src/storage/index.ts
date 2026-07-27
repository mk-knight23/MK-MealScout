import type { AsyncKeyValueStore } from './types'
import { createIndexedDbStore } from './indexedDbStore'
import { createLocalStorageStore } from './localStorageStore'
import { createMemoryStore } from './memoryStore'
import { migrateV1LocalStorage } from './migration'

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
let migrationPromise: Promise<unknown> | null = null

/** App-wide storage singleton. Never rejects (memory store is the floor). */
export function getStorage(): Promise<AsyncKeyValueStore> {
  if (!storagePromise) {
    storagePromise = createStorage()
  }
  return storagePromise
}

/** Test hook: forget the singletons so each test selects storage fresh. */
export function resetStorageForTests(): void {
  storagePromise = null
  migrationPromise = null
}

function ensureMigrated(target: AsyncKeyValueStore): Promise<unknown> {
  if (!migrationPromise) {
    migrationPromise = migrateV1LocalStorage(target)
  }
  return migrationPromise
}

function readV1FallbackValue(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key)
    }
    return null
  } catch {
    return null
  }
}

/**
 * Hydration read: runs the (idempotent) v1 migration first, reads the key
 * from the selected store, and — on the IndexedDB store only — falls back
 * to the retained v1 localStorage key when the copy is absent (e.g. a
 * migration write that failed verification). May reject on storage read
 * errors; hydration callers keep their write gate closed in that case.
 */
export async function loadPersistedValue(key: string): Promise<string | null> {
  const storage = await getStorage()
  await ensureMigrated(storage)
  const value = await storage.getItem(key)
  if (value !== null) return value
  if (storage.kind === 'indexeddb') return readV1FallbackValue(key)
  return null
}

/**
 * Persistence write used by the store `_persist()` choke points.
 * Fire-and-forget safe: swallows storage failures exactly like the previous
 * sync writers (data stays in-memory for the session).
 */
export async function savePersistedValue(key: string, value: string): Promise<void> {
  try {
    const storage = await getStorage()
    await storage.setItem(key, value)
  } catch {
    // storage may be full or disabled; state stays in-memory for the session
  }
}
