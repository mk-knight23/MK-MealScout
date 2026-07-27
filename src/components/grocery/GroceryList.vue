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
    class="bg-mk-raised border border-mk-border rounded-mk-lg shadow-e1 p-5 sm:p-8 space-y-8"
    aria-labelledby="grocery-heading"
  >
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h3
        id="grocery-heading"
        class="text-2xl font-display font-bold"
      >
        Grocery List
        <span class="text-sm font-mono font-medium text-mk-muted ml-2 tabular-nums">{{ grocery.remainingCount }} to buy</span>
      </h3>
      <div
        class="flex flex-wrap gap-2"
        role="group"
        aria-label="Grocery list actions"
      >
        <button
          :disabled="grocery.items.length === 0"
          class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-mk-sm text-sm font-semibold bg-mk-raised border border-mk-border text-mk-secondary hover:border-mk-border-strong hover:text-mk-ink disabled:opacity-40 transition-colors"
          @click="copyList"
        >
          <ClipboardCopy
            :size="14"
            aria-hidden="true"
          /> {{ copyFeedback ? 'Copied!' : 'Copy' }}
        </button>
        <button
          :disabled="grocery.items.length === 0"
          class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-mk-sm text-sm font-semibold bg-mk-raised border border-mk-border text-mk-secondary hover:border-mk-border-strong hover:text-mk-ink disabled:opacity-40 transition-colors"
          @click="downloadTxt"
        >
          <FileDown
            :size="14"
            aria-hidden="true"
          /> .txt
        </button>
        <button
          :disabled="grocery.items.length === 0"
          class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-mk-sm text-sm font-semibold bg-mk-raised border border-mk-border text-mk-secondary hover:border-mk-border-strong hover:text-mk-ink disabled:opacity-40 transition-colors"
          @click="downloadJson"
        >
          <FileJson
            :size="14"
            aria-hidden="true"
          /> .json
        </button>
        <button
          :disabled="grocery.completedCount === 0"
          class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-mk-sm text-sm font-semibold bg-mk-raised border border-mk-border text-mk-secondary hover:border-mk-danger hover:text-mk-danger disabled:opacity-40 transition-colors"
          @click="grocery.clearCompleted"
        >
          <Trash2
            :size="14"
            aria-hidden="true"
          /> Clear done
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
        class="bg-mk-raised text-mk-ink placeholder:text-mk-muted border-2 border-mk-border-strong rounded-mk-sm px-4 py-2.5 text-sm outline-none focus-visible:border-mk-ring focus-visible:outline-offset-0 transition-colors"
        aria-label="Grocery item name"
      >
      <input
        v-model="qtyInput"
        type="text"
        placeholder="Qty note (optional)"
        class="bg-mk-raised text-mk-ink placeholder:text-mk-muted border-2 border-mk-border-strong rounded-mk-sm px-4 py-2.5 text-sm outline-none focus-visible:border-mk-ring focus-visible:outline-offset-0 transition-colors"
        aria-label="Quantity note"
      >
      <button
        type="submit"
        class="flex items-center justify-center gap-2 bg-mk-accent-strong text-mk-on-accent px-5 py-2.5 rounded-mk-sm font-semibold text-sm border border-transparent hover:border-mk-ring transition-colors"
        aria-label="Add item to grocery list"
      >
        <Plus
          :size="16"
          aria-hidden="true"
        /> Add
      </button>
    </form>

    <!-- Empty state. Keys on isReady: no "list is empty" flash while async
         hydration is still loading persisted data. -->
    <div
      v-if="grocery.isReady && grocery.items.length === 0"
      class="text-center py-14 border-2 border-dashed border-mk-border rounded-mk-md"
    >
      <ShoppingCart
        class="mx-auto text-mk-muted mb-4"
        :size="48"
        aria-hidden="true"
      />
      <p class="text-mk-secondary font-medium">
        Your grocery list is empty.
      </p>
      <p class="text-sm text-mk-muted mt-1">
        Add items above, or open a recipe and send its missing ingredients here. Works offline —
        everything stays on this device.
      </p>
    </div>

    <!-- Items -->
    <ul
      v-else-if="grocery.items.length > 0"
      class="space-y-2"
      aria-label="Grocery items"
    >
      <li
        v-for="item in grocery.items"
        :key="item.id"
        class="flex items-center gap-3 bg-mk-page border border-mk-border rounded-mk-sm px-4 py-3"
      >
        <template v-if="editingId === item.id">
          <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              v-model="editName"
              type="text"
              class="bg-mk-raised text-mk-ink border border-mk-border-strong rounded-mk-xs px-3 py-1.5 text-sm outline-none focus-visible:border-mk-ring focus-visible:outline-offset-0"
              aria-label="Edit item name"
            >
            <input
              v-model="editQty"
              type="text"
              placeholder="Qty note"
              class="bg-mk-raised text-mk-ink placeholder:text-mk-muted border border-mk-border-strong rounded-mk-xs px-3 py-1.5 text-sm outline-none focus-visible:border-mk-ring focus-visible:outline-offset-0"
              aria-label="Edit quantity note"
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
            @click="editingId = null"
          >
            <X :size="16" />
          </button>
        </template>
        <template v-else>
          <input
            type="checkbox"
            :checked="item.checked"
            class="w-4 h-4 rounded accent-mk-accent shrink-0"
            :aria-label="`Mark ${item.name} as ${item.checked ? 'not bought' : 'bought'}`"
            @change="grocery.toggleChecked(item.id)"
          >
          <div class="flex-1 min-w-0">
            <p
              class="font-semibold text-sm truncate"
              :class="{ 'line-through text-mk-muted': item.checked }"
            >
              {{ item.name }}
              <span
                v-if="item.qtyNote"
                class="text-mk-muted font-medium ml-1"
              >· {{ item.qtyNote }}</span>
            </p>
            <p
              v-if="item.recipeOrigin"
              class="text-xs text-mk-muted font-medium truncate"
            >
              for: {{ item.recipeOrigin }}
            </p>
          </div>
          <button
            class="p-2 rounded-mk-xs text-mk-muted hover:text-mk-accent hover:bg-mk-accent-soft transition-colors"
            :aria-label="`Edit ${item.name}`"
            @click="startEdit(item)"
          >
            <Pencil :size="16" />
          </button>
          <button
            class="p-2 rounded-mk-xs text-mk-muted hover:text-mk-danger hover:bg-mk-danger-soft transition-colors"
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
