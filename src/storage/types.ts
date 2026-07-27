// Async key-value storage contract. Deliberately mirrors the localStorage
// API (string values, same keys) so the pure parse/serialize utils in
// src/utils/ stay the single schema guard regardless of the backing store.

export type StorageKind = 'indexeddb' | 'localstorage' | 'memory'

export interface AsyncKeyValueStore {
  readonly kind: StorageKind
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}
