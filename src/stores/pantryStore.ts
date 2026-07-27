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
import { loadPersistedValue, savePersistedValue } from '@/storage'

/** Pure list operation; must be safe to re-run on the hydrated data. */
type PantryListOp = (entries: PantryEntry[]) => PantryEntry[]

interface PantryState {
  entries: PantryEntry[]
  /** True once persisted data has been loaded (write gate open). */
  hydrated: boolean
  /** True while hydrate() is in flight. */
  hydrating: boolean
  /** True when storage could not be read; session stays in-memory. */
  hydrationFailed: boolean
  /** Mutations queued before hydration; replayed on the hydrated data. */
  pendingOps: PantryListOp[]
  /** Full TheMealDB ingredient list for autocomplete; loaded lazily once. */
  knownIngredients: string[]
  ingredientsLoading: boolean
  ingredientsError: string | null
}

export const usePantryStore = defineStore('pantry', {
  state: (): PantryState => ({
    entries: [],
    hydrated: false,
    hydrating: false,
    hydrationFailed: false,
    pendingOps: [],
    knownIngredients: [],
    ingredientsLoading: false,
    ingredientsError: null,
  }),

  getters: {
    /** Empty-state UI must key on this — never show "pantry is empty" mid-load. */
    isReady: (state) => state.hydrated || state.hydrationFailed,
    count: (state) => state.entries.length,
    expiringSoon: (state) => state.entries.filter((e) => isExpiringSoon(e.expiresAt)),
    presets: (): PantryPreset[] => PANTRY_PRESETS,
    hasIngredient: (state) => {
      const names = new Set(state.entries.map((e) => e.name.toLowerCase()))
      return (name: string) => names.has(name.trim().toLowerCase())
    },
  },

  actions: {
    /**
     * Load persisted entries via the async storage service, then replay any
     * mutations that were queued while hydration was pending. Only after
     * this completes does `_persist()` start writing (ready gate) — a
     * write-before-hydration can never clobber stored data.
     */
    async hydrate() {
      if (this.hydrated || this.hydrating) return
      this.hydrating = true
      try {
        const raw = await loadPersistedValue(PANTRY_STORAGE_KEY)
        const loaded = parsePantryJson(raw)
        const ops = this.pendingOps.splice(0)
        this.entries = ops.reduce((acc, op) => op(acc), loaded)
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

    /**
     * Every mutation funnels through here: applied to in-memory state
     * immediately (optimistic UI), and either persisted (hydrated) or
     * queued for replay on the hydrated data (not yet hydrated).
     */
    _apply(op: PantryListOp) {
      this.entries = op(this.entries)
      if (this.hydrated) {
        this._persist()
      } else {
        this.pendingOps.push(op)
      }
    },

    /** Single write choke point. Ready-gated: never writes before hydration. */
    _persist() {
      if (!this.hydrated) return
      void savePersistedValue(PANTRY_STORAGE_KEY, serializePantry(this.entries))
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
      const key = trimmed.toLowerCase()
      // The op re-checks duplicates so a queued add cannot duplicate an
      // entry that already exists in the (not yet loaded) hydrated data.
      this._apply((entries) =>
        entries.some((e) => e.name.toLowerCase() === key) ? entries : [...entries, entry]
      )
      return entry
    },

    updateEntry(
      id: string,
      patch: Partial<Pick<PantryEntry, 'name' | 'quantityNote' | 'expiresAt'>>
    ) {
      const nextName = patch.name?.trim()
      if (patch.name !== undefined && !nextName) return
      this._apply((entries) =>
        entries.map((e) =>
          e.id === id
            ? {
                ...e,
                ...(nextName !== undefined ? { name: nextName } : {}),
                ...(patch.quantityNote !== undefined
                  ? { quantityNote: patch.quantityNote.trim() }
                  : {}),
                ...(patch.expiresAt !== undefined ? { expiresAt: patch.expiresAt.trim() } : {}),
              }
            : e
        )
      )
    },

    removeEntry(id: string) {
      this._apply((entries) => entries.filter((e) => e.id !== id))
    },

    clearPantry() {
      this._apply(() => [])
    },

    /** Add every preset ingredient not already present. */
    applyPreset(label: string) {
      const preset = PANTRY_PRESETS.find((p) => p.label === label)
      if (!preset) return
      this._apply((entries) => {
        const existing = new Set(entries.map((e) => e.name.toLowerCase()))
        const additions: PantryEntry[] = preset.ingredients
          .filter((name) => !existing.has(name.toLowerCase()))
          .map((name) => ({
            id: newId(),
            name,
            quantityNote: '',
            expiresAt: '',
            addedAt: new Date().toISOString(),
          }))
        return additions.length === 0 ? entries : [...entries, ...additions]
      })
    },

    /** Replace the whole pantry (used by JSON restore). Entries must be pre-validated. */
    replaceAll(entries: PantryEntry[]) {
      const next = [...entries]
      this._apply(() => next)
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
