import type { AsyncKeyValueStore } from './types'

/**
 * In-memory last-resort store: keeps the app functional for the session when
 * neither IndexedDB nor localStorage is usable. Nothing persists.
 */
export function createMemoryStore(): AsyncKeyValueStore {
  const data = new Map<string, string>()

  return {
    kind: 'memory',

    async getItem(key: string): Promise<string | null> {
      return data.get(key) ?? null
    },

    async setItem(key: string, value: string): Promise<void> {
      data.set(key, value)
    },

    async removeItem(key: string): Promise<void> {
      data.delete(key)
    },
  }
}
