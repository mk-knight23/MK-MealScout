import type { AsyncKeyValueStore } from './types'

const DB_NAME = 'mealscout-storage'
const DB_VERSION = 1
const STORE_NAME = 'kv'

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest
    try {
      request = factory.open(DB_NAME, DB_VERSION)
    } catch (err) {
      reject(err instanceof Error ? err : new Error('indexeddb_open_failed'))
      return
    }
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('indexeddb_open_failed'))
  })
}

/** Resolves when the transaction has fully committed (durable write). */
function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('indexeddb_tx_failed'))
    tx.onabort = () => reject(tx.error ?? new Error('indexeddb_tx_aborted'))
  })
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('indexeddb_request_failed'))
  })
}

/**
 * IndexedDB-backed async key-value store. Throws/rejects when IndexedDB is
 * unavailable or cannot be opened — callers fall back via createStorage().
 * The factory parameter exists for tests (fake-indexeddb injection).
 */
export async function createIndexedDbStore(
  factory: IDBFactory | undefined = globalThis.indexedDB
): Promise<AsyncKeyValueStore> {
  if (!factory) throw new Error('indexeddb_unavailable')
  const db = await openDatabase(factory)

  return {
    kind: 'indexeddb',

    async getItem(key: string): Promise<string | null> {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const value = await requestResult(tx.objectStore(STORE_NAME).get(key))
      return typeof value === 'string' ? value : null
    },

    async setItem(key: string, value: string): Promise<void> {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(value, key)
      await transactionDone(tx)
    },

    async removeItem(key: string): Promise<void> {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(key)
      await transactionDone(tx)
    },
  }
}
