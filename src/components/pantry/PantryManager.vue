<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePantryStore } from '@/stores/pantryStore'
import type { PantryEntry } from '@/utils/pantry'
import { daysUntilExpiry, isExpiringSoon } from '@/utils/pantry'
import { AlertTriangle, Check, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-vue-next'

const pantry = usePantryStore()

const nameInput = ref('')
const qtyInput = ref('')
const expiryInput = ref('')
const suggestionsOpen = ref(false)
const activeIndex = ref(-1)

const editingId = ref<string | null>(null)
const editName = ref('')
const editQty = ref('')
const editExpiry = ref('')

const suggestions = computed(() => {
  const query = nameInput.value.trim().toLowerCase()
  if (query.length < 2) return []
  return pantry.knownIngredients
    .filter(name => name.toLowerCase().includes(query))
    .slice(0, 8)
})

const isSuggestionsVisible = computed(() => suggestionsOpen.value && suggestions.value.length > 0)

const openSuggestions = () => {
  suggestionsOpen.value = true
}

const onInput = () => {
  suggestionsOpen.value = true
  activeIndex.value = -1
}

const closeSuggestions = () => {
  suggestionsOpen.value = false
  activeIndex.value = -1
}

/** Move the active-descendant highlight, opening the list and wrapping around. */
const moveActive = (delta: number) => {
  const count = suggestions.value.length
  if (count === 0) return
  suggestionsOpen.value = true
  const next = activeIndex.value + delta
  if (next < 0) activeIndex.value = count - 1
  else if (next >= count) activeIndex.value = 0
  else activeIndex.value = next
}

/** Enter selects the highlighted suggestion; otherwise the form submits (addEntry). */
const onEnter = (event: KeyboardEvent) => {
  if (isSuggestionsVisible.value && activeIndex.value >= 0) {
    const picked = suggestions.value[activeIndex.value]
    if (picked) {
      event.preventDefault()
      pickSuggestion(picked)
    }
  }
}

onMounted(() => {
  pantry.loadKnownIngredients()
})

const addEntry = () => {
  const added = pantry.addEntry(nameInput.value, qtyInput.value, expiryInput.value)
  if (added) {
    nameInput.value = ''
    qtyInput.value = ''
    expiryInput.value = ''
  }
  closeSuggestions()
}

const pickSuggestion = (name: string) => {
  nameInput.value = name
  closeSuggestions()
}

const startEdit = (entry: PantryEntry) => {
  editingId.value = entry.id
  editName.value = entry.name
  editQty.value = entry.quantityNote
  editExpiry.value = entry.expiresAt
}

const saveEdit = () => {
  if (!editingId.value) return
  pantry.updateEntry(editingId.value, {
    name: editName.value,
    quantityNote: editQty.value,
    expiresAt: editExpiry.value,
  })
  editingId.value = null
}

const cancelEdit = () => {
  editingId.value = null
}

const expiryLabel = (entry: PantryEntry): string => {
  const days = daysUntilExpiry(entry.expiresAt)
  if (days === null) return ''
  if (days < 0) return 'Expired'
  if (days === 0) return 'Expires today'
  if (days === 1) return 'Expires tomorrow'
  return `Expires in ${days} days`
}
</script>

<template>
  <section
    class="bg-mk-raised border border-mk-border rounded-mk-lg shadow-e1 p-5 sm:p-8 space-y-8"
    aria-labelledby="pantry-heading"
  >
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h3
        id="pantry-heading"
        class="text-2xl font-display font-bold"
      >
        My Pantry
        <span class="text-sm font-mono font-medium text-mk-muted ml-2 tabular-nums">{{ pantry.count }} ingredients</span>
      </h3>
      <div
        class="flex flex-wrap gap-2"
        role="group"
        aria-label="Pantry presets"
      >
        <button
          v-for="preset in pantry.presets"
          :key="preset.label"
          class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-mk-sm text-sm font-semibold bg-mk-raised border border-mk-border text-mk-secondary hover:border-mk-border-strong hover:text-mk-ink transition-colors"
          @click="pantry.applyPreset(preset.label)"
        >
          <Sparkles
            :size="14"
            aria-hidden="true"
          /> {{ preset.label }}
        </button>
      </div>
    </div>

    <!-- Add form -->
    <form
      class="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3"
      @submit.prevent="addEntry"
    >
      <div class="relative">
        <input
          v-model="nameInput"
          type="text"
          placeholder="Ingredient, e.g. Eggs"
          class="w-full bg-mk-raised text-mk-ink placeholder:text-mk-muted border-2 border-mk-border-strong rounded-mk-sm px-4 py-2.5 text-sm outline-none focus-visible:border-mk-ring focus-visible:outline-offset-0 transition-colors"
          aria-label="Ingredient name"
          autocomplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="pantry-suggestions"
          :aria-expanded="isSuggestionsVisible"
          :aria-activedescendant="activeIndex >= 0 ? `pantry-suggestion-${activeIndex}` : undefined"
          @focus="openSuggestions"
          @input="onInput"
          @blur="closeSuggestions"
          @keydown.down.prevent="moveActive(1)"
          @keydown.up.prevent="moveActive(-1)"
          @keydown.enter="onEnter"
          @keydown.esc="closeSuggestions"
        >
        <ul
          v-if="isSuggestionsVisible"
          id="pantry-suggestions"
          class="absolute z-20 mt-2 w-full bg-mk-raised border border-mk-border-strong rounded-mk-sm shadow-e2 overflow-hidden"
          role="listbox"
          aria-label="Ingredient suggestions"
        >
          <li
            v-for="(suggestion, index) in suggestions"
            :id="`pantry-suggestion-${index}`"
            :key="suggestion"
            role="option"
            :aria-selected="index === activeIndex"
            class="px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors"
            :class="
              index === activeIndex
                ? 'bg-mk-accent-soft text-mk-ink'
                : 'text-mk-secondary hover:bg-mk-accent-soft hover:text-mk-ink'
            "
            @mousedown.prevent="pickSuggestion(suggestion)"
            @mouseenter="activeIndex = index"
          >
            {{ suggestion }}
          </li>
        </ul>
      </div>
      <input
        v-model="qtyInput"
        type="text"
        placeholder="Qty note (optional)"
        class="bg-mk-raised text-mk-ink placeholder:text-mk-muted border-2 border-mk-border-strong rounded-mk-sm px-4 py-2.5 text-sm outline-none focus-visible:border-mk-ring focus-visible:outline-offset-0 transition-colors"
        aria-label="Quantity note"
      >
      <input
        v-model="expiryInput"
        type="date"
        class="bg-mk-raised text-mk-secondary border-2 border-mk-border-strong rounded-mk-sm px-4 py-2.5 text-sm outline-none focus-visible:border-mk-ring focus-visible:outline-offset-0 transition-colors"
        aria-label="Expiry date"
      >
      <button
        type="submit"
        class="flex items-center justify-center gap-2 bg-mk-accent-strong text-mk-on-accent px-5 py-2.5 rounded-mk-sm font-semibold text-sm border border-transparent hover:border-mk-ring transition-colors"
        aria-label="Add ingredient to pantry"
      >
        <Plus
          :size="16"
          aria-hidden="true"
        /> Add
      </button>
    </form>
    <p
      v-if="pantry.ingredientsError"
      class="text-sm text-mk-muted font-medium"
    >
      {{ pantry.ingredientsError }} You can still type ingredient names manually.
    </p>

    <!-- Entries. Empty state keys on isReady: no "pantry is empty" flash
         while async hydration is still loading persisted data. -->
    <div
      v-if="pantry.isReady && pantry.count === 0"
      class="text-center py-10 border-2 border-dashed border-mk-border rounded-mk-md"
    >
      <p class="text-mk-secondary font-medium">
        Your pantry is empty.
      </p>
      <p class="text-sm text-mk-muted mt-1">
        Add ingredients above or start with a preset.
      </p>
    </div>

    <ul
      v-else-if="pantry.count > 0"
      class="grid grid-cols-1 md:grid-cols-2 gap-3"
      aria-label="Pantry ingredients"
    >
      <li
        v-for="entry in pantry.entries"
        :key="entry.id"
        class="flex items-center gap-3 bg-mk-page border border-mk-border rounded-mk-sm px-4 py-3"
      >
        <template v-if="editingId === entry.id">
          <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              v-model="editName"
              type="text"
              class="bg-mk-raised text-mk-ink border border-mk-border-strong rounded-mk-xs px-3 py-1.5 text-sm outline-none focus-visible:border-mk-ring focus-visible:outline-offset-0"
              aria-label="Edit ingredient name"
            >
            <input
              v-model="editQty"
              type="text"
              placeholder="Qty note"
              class="bg-mk-raised text-mk-ink placeholder:text-mk-muted border border-mk-border-strong rounded-mk-xs px-3 py-1.5 text-sm outline-none focus-visible:border-mk-ring focus-visible:outline-offset-0"
              aria-label="Edit quantity note"
            >
            <input
              v-model="editExpiry"
              type="date"
              class="bg-mk-raised text-mk-ink border border-mk-border-strong rounded-mk-xs px-3 py-1.5 text-sm outline-none focus-visible:border-mk-ring focus-visible:outline-offset-0"
              aria-label="Edit expiry date"
            >
          </div>
          <button
            class="p-2 rounded-mk-xs text-mk-herb hover:bg-mk-herb-soft"
            aria-label="Save changes"
            @click="saveEdit"
          >
            <Check :size="16" />
          </button>
          <button
            class="p-2 rounded-mk-xs text-mk-muted hover:bg-mk-sunken"
            aria-label="Cancel editing"
            @click="cancelEdit"
          >
            <X :size="16" />
          </button>
        </template>
        <template v-else>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm truncate">
              {{ entry.name }}
              <span
                v-if="entry.quantityNote"
                class="text-mk-muted font-medium ml-1"
              >· {{ entry.quantityNote }}</span>
            </p>
            <p
              v-if="expiryLabel(entry)"
              class="text-xs font-semibold mt-0.5 flex items-center gap-1"
              :class="isExpiringSoon(entry.expiresAt) ? 'text-mk-danger' : 'text-mk-muted'"
            >
              <AlertTriangle
                v-if="isExpiringSoon(entry.expiresAt)"
                :size="12"
                aria-hidden="true"
              />
              {{ expiryLabel(entry) }}
            </p>
          </div>
          <button
            class="p-2 rounded-mk-xs text-mk-muted hover:text-mk-accent hover:bg-mk-accent-soft transition-colors"
            :aria-label="`Edit ${entry.name}`"
            @click="startEdit(entry)"
          >
            <Pencil :size="16" />
          </button>
          <button
            class="p-2 rounded-mk-xs text-mk-muted hover:text-mk-danger hover:bg-mk-danger-soft transition-colors"
            :aria-label="`Remove ${entry.name} from pantry`"
            @click="pantry.removeEntry(entry.id)"
          >
            <Trash2 :size="16" />
          </button>
        </template>
      </li>
    </ul>
  </section>
</template>
