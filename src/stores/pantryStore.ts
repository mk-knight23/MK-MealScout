import { defineStore } from 'pinia'
import type { PantryEntry, PantryPreset } from '@/utils/pantry'
import {
  PANTRY_PRESETS,
  PANTRY_STORAGE_KEY,
  isExpiringSoon,
  parsePantryJson,
  serializePantry,
} from '@/utils/pantry'
import { newId } from '@/utils/ids'
import { listIngredients } from '@/utils/mealdb'

interface PantryState {
  entries: PantryEntry[]
  /** Full TheMealDB ingredient list for autocomplete; loaded lazily once. */
  knownIngredients: string[]
  ingredientsLoading: boolean
  ingredientsError: string | null
}

function readPantry(): PantryEntry[] {
  if (typeof localStorage === 'undefined') return []
  try {
    return parsePantryJson(localStorage.getItem(PANTRY_STORAGE_KEY))
  } catch {
    return []
  }
}

function writePantry(entries: PantryEntry[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(PANTRY_STORAGE_KEY, serializePantry(entries))
  } catch {
    // storage may be full or disabled; pantry stays in-memory for the session
  }
}

export const usePantryStore = defineStore('pantry', {
  state: (): PantryState => ({
    entries: readPantry(),
    knownIngredients: [],
    ingredientsLoading: false,
    ingredientsError: null,
  }),

  getters: {
    count: state => state.entries.length,
    expiringSoon: state => state.entries.filter(e => isExpiringSoon(e.expiresAt)),
    presets: (): PantryPreset[] => PANTRY_PRESETS,
    hasIngredient: state => {
      const names = new Set(state.entries.map(e => e.name.toLowerCase()))
      return (name: string) => names.has(name.trim().toLowerCase())
    },
  },

  actions: {
    _persist() {
      writePantry(this.entries)
    },

    addEntry(name: string, quantityNote = '', expiresAt = ''): PantryEntry | null {
      const trimmed = name.trim()
      if (!trimmed) return null
      if (this.hasIngredient(trimmed)) return null
      const entry: PantryEntry = {
        id: newId(),
        name: trimmed,
        quantityNote: quantityNote.trim(),
        expiresAt: expiresAt.trim(),
        addedAt: new Date().toISOString(),
      }
      this.entries = [...this.entries, entry]
      this._persist()
      return entry
    },

    updateEntry(id: string, patch: Partial<Pick<PantryEntry, 'name' | 'quantityNote' | 'expiresAt'>>) {
      const nextName = patch.name?.trim()
      if (patch.name !== undefined && !nextName) return
      this.entries = this.entries.map(e =>
        e.id === id
          ? {
              ...e,
              ...(nextName !== undefined ? { name: nextName } : {}),
              ...(patch.quantityNote !== undefined ? { quantityNote: patch.quantityNote.trim() } : {}),
              ...(patch.expiresAt !== undefined ? { expiresAt: patch.expiresAt.trim() } : {}),
            }
          : e
      )
      this._persist()
    },

    removeEntry(id: string) {
      this.entries = this.entries.filter(e => e.id !== id)
      this._persist()
    },

    clearPantry() {
      this.entries = []
      this._persist()
    },

    /** Add every preset ingredient not already present. */
    applyPreset(label: string) {
      const preset = PANTRY_PRESETS.find(p => p.label === label)
      if (!preset) return
      const existing = new Set(this.entries.map(e => e.name.toLowerCase()))
      const additions: PantryEntry[] = preset.ingredients
        .filter(name => !existing.has(name.toLowerCase()))
        .map(name => ({
          id: newId(),
          name,
          quantityNote: '',
          expiresAt: '',
          addedAt: new Date().toISOString(),
        }))
      if (additions.length === 0) return
      this.entries = [...this.entries, ...additions]
      this._persist()
    },

    /** Replace the whole pantry (used by JSON restore). Entries must be pre-validated. */
    replaceAll(entries: PantryEntry[]) {
      this.entries = [...entries]
      this._persist()
    },

    async loadKnownIngredients() {
      if (this.knownIngredients.length > 0 || this.ingredientsLoading) return
      this.ingredientsLoading = true
      this.ingredientsError = null
      try {
        this.knownIngredients = await listIngredients()
      } catch {
        this.ingredientsError = 'Ingredient suggestions unavailable right now.'
      } finally {
        this.ingredientsLoading = false
      }
    },
  },
})
