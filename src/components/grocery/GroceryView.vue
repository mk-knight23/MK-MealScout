<script setup lang="ts">
import { ref } from 'vue'
import { useGroceryStore } from '@/stores/groceryStore'
import type { GroceryItem } from '@/utils/grocery'
import { serializeGrocery } from '@/utils/grocery'
import { copyTextToClipboard, triggerDownload } from '@/utils/download'
import {
  Check,
  ClipboardCopy,
  FileDown,
  FileJson,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-vue-next'

const grocery = useGroceryStore()

const nameInput = ref('')
const qtyInput = ref('')
const copyFeedback = ref(false)

const editingId = ref<string | null>(null)
const editName = ref('')
const editQty = ref('')

const addManual = () => {
  if (!nameInput.value.trim()) return
  grocery.addManualItem(nameInput.value, qtyInput.value)
  nameInput.value = ''
  qtyInput.value = ''
}

const startEdit = (item: GroceryItem) => {
  editingId.value = item.id
  editName.value = item.name
  editQty.value = item.qtyNote
}

const saveEdit = () => {
  if (!editingId.value) return
  grocery.updateItem(editingId.value, { name: editName.value, qtyNote: editQty.value })
  editingId.value = null
}

const copyList = async () => {
  const ok = await copyTextToClipboard(grocery.asText)
  if (ok) {
    copyFeedback.value = true
    setTimeout(() => {
      copyFeedback.value = false
    }, 2500)
  }
}

const downloadTxt = () => {
  triggerDownload('mealscout-grocery-list.txt', grocery.asText, 'text/plain')
}

const downloadJson = () => {
  triggerDownload('mealscout-grocery-list.json', serializeGrocery(grocery.items), 'application/json')
}
</script>

<template>
  <section
    class="glass rounded-[2rem] p-8 space-y-8"
    aria-labelledby="grocery-heading"
  >
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h3
        id="grocery-heading"
        class="text-2xl font-display font-bold"
      >
        Grocery List
        <span class="text-sm font-bold text-slate-400 ml-2">{{ grocery.remainingCount }} to buy</span>
      </h3>
      <div
        class="flex flex-wrap gap-2"
        role="group"
        aria-label="Grocery list actions"
      >
        <button
          :disabled="grocery.items.length === 0"
          class="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-culinary-primary hover:text-culinary-primary disabled:opacity-40 transition-all"
          @click="copyList"
        >
          <ClipboardCopy :size="14" /> {{ copyFeedback ? 'Copied!' : 'Copy' }}
        </button>
        <button
          :disabled="grocery.items.length === 0"
          class="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-culinary-primary hover:text-culinary-primary disabled:opacity-40 transition-all"
          @click="downloadTxt"
        >
          <FileDown :size="14" /> .txt
        </button>
        <button
          :disabled="grocery.items.length === 0"
          class="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-culinary-primary hover:text-culinary-primary disabled:opacity-40 transition-all"
          @click="downloadJson"
        >
          <FileJson :size="14" /> .json
        </button>
        <button
          :disabled="grocery.completedCount === 0"
          class="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-red-400 hover:text-red-500 disabled:opacity-40 transition-all"
          @click="grocery.clearCompleted"
        >
          <Trash2 :size="14" /> Clear done
        </button>
      </div>
    </div>

    <!-- Manual add -->
    <form
      class="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-3"
      @submit.prevent="addManual"
    >
      <input
        v-model="nameInput"
        type="text"
        placeholder="Add an item, e.g. Olive Oil"
        class="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm outline-none focus:border-culinary-primary transition-all"
        aria-label="Grocery item name"
      >
      <input
        v-model="qtyInput"
        type="text"
        placeholder="Qty note (optional)"
        class="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm outline-none focus:border-culinary-primary transition-all"
        aria-label="Quantity note"
      >
      <button
        type="submit"
        class="flex items-center justify-center gap-2 bg-culinary-primary hover:bg-culinary-secondary text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
        aria-label="Add item to grocery list"
      >
        <Plus :size="16" /> Add
      </button>
    </form>

    <!-- Empty state -->
    <div
      v-if="grocery.items.length === 0"
      class="text-center py-14 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl"
    >
      <ShoppingCart
        class="mx-auto text-slate-300 mb-4"
        :size="48"
        aria-hidden="true"
      />
      <p class="text-slate-500 font-medium">
        Your grocery list is empty.
      </p>
      <p class="text-xs text-slate-400 mt-1">
        Add items above, or open a recipe and send its missing ingredients here. Works offline —
        everything stays on this device.
      </p>
    </div>

    <!-- Items -->
    <ul
      v-else
      class="space-y-2"
      aria-label="Grocery items"
    >
      <li
        v-for="item in grocery.items"
        :key="item.id"
        class="flex items-center gap-3 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3"
      >
        <template v-if="editingId === item.id">
          <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              v-model="editName"
              type="text"
              class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-culinary-primary"
              aria-label="Edit item name"
            >
            <input
              v-model="editQty"
              type="text"
              placeholder="Qty note"
              class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-culinary-primary"
              aria-label="Edit quantity note"
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
            @click="editingId = null"
          >
            <X :size="16" />
          </button>
        </template>
        <template v-else>
          <input
            type="checkbox"
            :checked="item.checked"
            class="w-4 h-4 rounded accent-[#b45309] shrink-0"
            :aria-label="`Mark ${item.name} as ${item.checked ? 'not bought' : 'bought'}`"
            @change="grocery.toggleChecked(item.id)"
          >
          <div class="flex-1 min-w-0">
            <p
              class="font-bold text-sm truncate"
              :class="{ 'line-through text-slate-400': item.checked }"
            >
              {{ item.name }}
              <span
                v-if="item.qtyNote"
                class="text-slate-400 font-medium ml-1"
              >· {{ item.qtyNote }}</span>
            </p>
            <p
              v-if="item.recipeOrigin"
              class="text-[11px] text-slate-400 font-medium truncate"
            >
              for: {{ item.recipeOrigin }}
            </p>
          </div>
          <button
            class="p-2 rounded-xl text-slate-400 hover:text-culinary-primary hover:bg-culinary-primary/10 transition-colors"
            :aria-label="`Edit ${item.name}`"
            @click="startEdit(item)"
          >
            <Pencil :size="16" />
          </button>
          <button
            class="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            :aria-label="`Delete ${item.name}`"
            @click="grocery.removeItem(item.id)"
          >
            <Trash2 :size="16" />
          </button>
        </template>
      </li>
    </ul>
  </section>
</template>
