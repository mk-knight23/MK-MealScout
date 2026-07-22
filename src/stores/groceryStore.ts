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

interface GroceryState {
  items: GroceryItem[]
}

function readGrocery(): GroceryItem[] {
  if (typeof localStorage === 'undefined') return []
  try {
    return parseGroceryJson(localStorage.getItem(GROCERY_STORAGE_KEY))
  } catch {
    return []
  }
}

function writeGrocery(items: GroceryItem[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(GROCERY_STORAGE_KEY, serializeGrocery(items))
  } catch {
    // storage may be full or disabled; list stays in-memory for the session
  }
}

export const useGroceryStore = defineStore('grocery', {
  state: (): GroceryState => ({
    items: readGrocery(),
  }),

  getters: {
    remaining: (state) => state.items.filter((i) => !i.checked),
    remainingCount(): number {
      return this.remaining.length
    },
    completedCount: (state) => state.items.filter((i) => i.checked).length,
    asText: (state) => formatGroceryText(state.items),
  },

  actions: {
    _persist() {
      writeGrocery(this.items)
    },

    /** Add one or many items, consolidating case-insensitive duplicates. */
    addItems(incoming: NewGroceryItem[]) {
      const valid = incoming.filter((i) => i.name.trim().length > 0)
      if (valid.length === 0) return
      this.items = consolidateItems(this.items, valid, newId)
      this._persist()
    },

    addManualItem(name: string, qtyNote = '') {
      this.addItems([{ name, qtyNote }])
    },

    updateItem(id: string, patch: Partial<Pick<GroceryItem, 'name' | 'qtyNote'>>) {
      const nextName = patch.name?.trim()
      if (patch.name !== undefined && !nextName) return
      this.items = this.items.map((i) =>
        i.id === id
          ? {
              ...i,
              ...(nextName !== undefined ? { name: nextName } : {}),
              ...(patch.qtyNote !== undefined ? { qtyNote: patch.qtyNote.trim() } : {}),
            }
          : i
      )
      this._persist()
    },

    toggleChecked(id: string) {
      this.items = this.items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
      this._persist()
    },

    removeItem(id: string) {
      this.items = this.items.filter((i) => i.id !== id)
      this._persist()
    },

    clearCompleted() {
      this.items = this.items.filter((i) => !i.checked)
      this._persist()
    },

    clearAll() {
      this.items = []
      this._persist()
    },

    /** Replace the whole list (used by JSON restore). Items must be pre-validated. */
    replaceAll(items: GroceryItem[]) {
      this.items = [...items]
      this._persist()
    },
  },
})
