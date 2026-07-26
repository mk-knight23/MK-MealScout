import type { AsyncKeyValueStore } from './types'

const PROBE_KEY = 'mealscout:storage-probe'

function readGlobalLocalStorage(): Storage | null {
  try {
    // Prefer window.localStorage: Node's experimental bare `localStorage`
    // global can shadow the DOM one with an unusable stub (seen under
    // vitest/jsdom on Node 26).
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    // Accessing localStorage itself can throw in sandboxed contexts.
    return null
  }
}

/**
 * localStorage-backed async key-value store, used when IndexedDB is
 * unavailable (e.g. legacy Safari private mode). Uses the SAME keys as the
 * v1 sync persistence, so browsers on this fallback need no migration.
 * Throws when localStorage is missing or write-disabled (probe write).
 */
export function createLocalStorageStore(
  storage: Storage | null | undefined = readGlobalLocalStorage()
): AsyncKeyValueStore {
  if (!storage) throw new Error('localstorage_unavailable')

  // Legacy Safari private mode exposes localStorage but throws on setItem.
  storage.setItem(PROBE_KEY, '1')
  storage.removeItem(PROBE_KEY)

  return {
    kind: 'localstorage',

    async getItem(key: string): Promise<string | null> {
      return storage.getItem(key)
    },

    async setItem(key: string, value: string): Promise<void> {
      storage.setItem(key, value)
    },

    async removeItem(key: string): Promise<void> {
      storage.removeItem(key)
    },
  }
}
