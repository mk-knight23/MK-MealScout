import { defineStore } from 'pinia'
import type { GroceryItem, NewGroceryItem } from '@/utils/grocery'
import {
  GROCERY_STORAGE_KEY,
  consolidateItems,
  formatGroceryText,
  parseGroceryJson,
  serializeGrocery,
} from '@/utils/grocery'
import { newId } from '@/utils/ids'
import { loadPersistedValue, savePersistedValue } from '@/storage'

/** Pure list operation; must be safe to re-run on the hydrated data. */
type GroceryListOp = (items: GroceryItem[]) => GroceryItem[]

interface GroceryState {
  items: GroceryItem[]
  /** True once persisted data has been loaded (write gate open). */
  hydrated: boolean
  /** True while hydrate() is in flight. */
  hydrating: boolean
  /** True when storage could not be read; session stays in-memory. */
  hydrationFailed: boolean
  /** Mutations queued before hydration; replayed on the hydrated data. */
  pendingOps: GroceryListOp[]
}

export const useGroceryStore = defineStore('grocery', {
  state: (): GroceryState => ({
    items: [],
    hydrated: false,
    hydrating: false,
    hydrationFailed: false,
    pendingOps: [],
  }),

  getters: {
    /** Empty-state UI must key on this — never show "list is empty" mid-load. */
    isReady: (state) => state.hydrated || state.hydrationFailed,
    remaining: (state) => state.items.filter((i) => !i.checked),
    remainingCount(): number {
      return this.remaining.length
    },
    completedCount: (state) => state.items.filter((i) => i.checked).length,
    asText: (state) => formatGroceryText(state.items),
  },

  actions: {
    /**
     * Load persisted items via the async storage service, then replay any
     * mutations queued while hydration was pending. Only after this
     * completes does `_persist()` start writing (ready gate).
     */
    async hydrate() {
      if (this.hydrated || this.hydrating) return
      this.hydrating = true
      try {
        const raw = await loadPersistedValue(GROCERY_STORAGE_KEY)
        const loaded = parseGroceryJson(raw)
        const ops = this.pendingOps.splice(0)
        this.items = ops.reduce((acc, op) => op(acc), loaded)
        this.hydrated = true
        if (ops.length > 0) this._persist()
      } catch {
        // Storage unreadable: keep the write gate closed so stored data is
        // never overwritten; this session works in-memory only.
        this.hydrationFailed = true
      } finally {
        this.hydrating = false
      }
    },

    /** Every mutation funnels through here: optimistic apply + queue-or-persist. */
    _apply(op: GroceryListOp) {
      this.items = op(this.items)
      if (this.hydrated) {
        this._persist()
      } else {
        this.pendingOps.push(op)
      }
    },

    /** Single write choke point. Ready-gated: never writes before hydration. */
    _persist() {
      if (!this.hydrated) return
      void savePersistedValue(GROCERY_STORAGE_KEY, serializeGrocery(this.items))
    },

    /** Add one or many items, consolidating case-insensitive duplicates. */
    addItems(incoming: NewGroceryItem[]) {
      const valid = incoming.filter((i) => i.name.trim().length > 0)
      if (valid.length === 0) return
      this._apply((items) => consolidateItems(items, valid, newId))
    },

    addManualItem(name: string, qtyNote = '') {
      this.addItems([{ name, qtyNote }])
    },

    updateItem(id: string, patch: Partial<Pick<GroceryItem, 'name' | 'qtyNote'>>) {
      const nextName = patch.name?.trim()
      if (patch.name !== undefined && !nextName) return
      this._apply((items) =>
        items.map((i) =>
          i.id === id
            ? {
                ...i,
                ...(nextName !== undefined ? { name: nextName } : {}),
                ...(patch.qtyNote !== undefined ? { qtyNote: patch.qtyNote.trim() } : {}),
              }
            : i
        )
      )
    },

    toggleChecked(id: string) {
      this._apply((items) => items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)))
    },

    removeItem(id: string) {
      this._apply((items) => items.filter((i) => i.id !== id))
    },

    clearCompleted() {
      this._apply((items) => items.filter((i) => !i.checked))
    },

    clearAll() {
      this._apply(() => [])
    },

    /** Replace the whole list (used by JSON restore). Items must be pre-validated. */
    replaceAll(items: GroceryItem[]) {
      const next = [...items]
      this._apply(() => next)
    },
  },
})
