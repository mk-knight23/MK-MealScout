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
    class="glass rounded-[2rem] p-8 space-y-8"
    aria-labelledby="pantry-heading"
  >
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h3
        id="pantry-heading"
        class="text-2xl font-display font-bold"
      >
        My Pantry
        <span class="text-sm font-bold text-slate-400 ml-2">{{ pantry.count }} ingredients</span>
      </h3>
      <div
        class="flex flex-wrap gap-2"
        role="group"
        aria-label="Pantry presets"
      >
        <button
          v-for="preset in pantry.presets"
          :key="preset.label"
          class="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-culinary-primary hover:text-culinary-primary transition-all"
          @click="pantry.applyPreset(preset.label)"
        >
          <Sparkles :size="14" /> {{ preset.label }}
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
          class="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm outline-none focus:border-culinary-primary transition-all"
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
          class="absolute z-20 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
          role="listbox"
          aria-label="Ingredient suggestions"
        >
          <li
            v-for="(suggestion, index) in suggestions"
            :id="`pantry-suggestion-${index}`"
            :key="suggestion"
            role="option"
            :aria-selected="index === activeIndex"
            class="px-5 py-2.5 text-sm font-medium cursor-pointer transition-colors"
            :class="
              index === activeIndex
                ? 'bg-culinary-primary/10 text-culinary-primary'
                : 'hover:bg-culinary-primary/10 hover:text-culinary-primary'
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
        class="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm outline-none focus:border-culinary-primary transition-all"
        aria-label="Quantity note"
      >
      <input
        v-model="expiryInput"
        type="date"
        class="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm outline-none focus:border-culinary-primary transition-all text-slate-500"
        aria-label="Expiry date"
      >
      <button
        type="submit"
        class="flex items-center justify-center gap-2 bg-culinary-primary hover:bg-culinary-secondary text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
        aria-label="Add ingredient to pantry"
      >
        <Plus :size="16" /> Add
      </button>
    </form>
    <p
      v-if="pantry.ingredientsError"
      class="text-xs text-slate-400 font-medium"
    >
      {{ pantry.ingredientsError }} You can still type ingredient names manually.
    </p>

    <!-- Entries -->
    <div
      v-if="pantry.count === 0"
      class="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl"
    >
      <p class="text-slate-500 font-medium">
        Your pantry is empty.
      </p>
      <p class="text-xs text-slate-400 mt-1">
        Add ingredients above or start with a preset.
      </p>
    </div>

    <ul
      v-else
      class="grid grid-cols-1 md:grid-cols-2 gap-3"
      aria-label="Pantry ingredients"
    >
      <li
        v-for="entry in pantry.entries"
        :key="entry.id"
        class="flex items-center gap-3 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3"
      >
        <template v-if="editingId === entry.id">
          <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              v-model="editName"
              type="text"
              class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-culinary-primary"
              aria-label="Edit ingredient name"
            >
            <input
              v-model="editQty"
              type="text"
              placeholder="Qty note"
              class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-culinary-primary"
              aria-label="Edit quantity note"
            >
            <input
              v-model="editExpiry"
              type="date"
              class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-culinary-primary"
              aria-label="Edit expiry date"
            >
          </div>
          <button
            class="p-2 rounded-xl text-emerald-600 hover:bg-emerald-500/10"
            aria-label="Save changes"
            @click="saveEdit"
          >
            <Check :size="16" />
          </button>
          <button
            class="p-2 rounded-xl text-slate-400 hover:bg-slate-500/10"
            aria-label="Cancel editing"
            @click="cancelEdit"
          >
            <X :size="16" />
          </button>
        </template>
        <template v-else>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-sm truncate">
              {{ entry.name }}
              <span
                v-if="entry.quantityNote"
                class="text-slate-400 font-medium ml-1"
              >· {{ entry.quantityNote }}</span>
            </p>
            <p
              v-if="expiryLabel(entry)"
              class="text-[11px] font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1"
              :class="isExpiringSoon(entry.expiresAt) ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'"
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
            class="p-2 rounded-xl text-slate-400 hover:text-culinary-primary hover:bg-culinary-primary/10 transition-colors"
            :aria-label="`Edit ${entry.name}`"
            @click="startEdit(entry)"
          >
            <Pencil :size="16" />
          </button>
          <button
            class="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
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
