<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePantryStore } from '@/stores/pantryStore'
import { useGroceryStore } from '@/stores/groceryStore'
import { useRecipeStore } from '@/stores/recipeStore'
import { createBackup, parseBackup, serializeBackup } from '@/utils/backup'
import { triggerDownload } from '@/utils/download'
import { AlertTriangle, Download, Heart, Refrigerator, ShoppingCart, Upload } from 'lucide-vue-next'

const pantry = usePantryStore()
const grocery = useGroceryStore()
const recipes = useRecipeStore()

const fileInput = ref<HTMLInputElement | null>(null)
const statusMessage = ref<string | null>(null)
const statusIsError = ref(false)

const stats = computed(() => [
  { label: 'Pantry items', value: pantry.count, icon: Refrigerator },
  { label: 'Expiring soon', value: pantry.expiringSoon.length, icon: AlertTriangle },
  { label: 'Grocery to buy', value: grocery.remainingCount, icon: ShoppingCart },
  { label: 'Favorites', value: recipes.favorites.length, icon: Heart },
])

const showStatus = (message: string, isError: boolean) => {
  statusMessage.value = message
  statusIsError.value = isError
  setTimeout(() => {
    statusMessage.value = null
  }, 4000)
}

const exportBackup = () => {
  const payload = createBackup(pantry.entries, grocery.items, recipes.favorites)
  triggerDownload('mealscout-backup.json', serializeBackup(payload), 'application/json')
}

const openImportPicker = () => {
  fileInput.value?.click()
}

const importBackup = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const text = await file.text()
    const result = parseBackup(text)
    if (!result.ok) {
      showStatus(result.error, true)
      return
    }
    pantry.replaceAll(result.data.pantry)
    grocery.replaceAll(result.data.grocery)
    recipes.replaceFavorites(result.data.favorites)
    showStatus(
      `Restored ${result.data.pantry.length} pantry items, ${result.data.grocery.length} grocery items, ${result.data.favorites.length} favorites.`,
      false
    )
  } catch {
    showStatus('Could not read that file.', true)
  }
}
</script>

<template>
  <section
    class="glass rounded-[2rem] px-6 py-4 flex flex-wrap items-center justify-between gap-4"
    aria-label="Your data at a glance"
  >
    <dl class="flex flex-wrap items-center gap-x-8 gap-y-2">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="flex items-center gap-2"
      >
        <component
          :is="stat.icon"
          :size="16"
          class="text-culinary-primary"
          aria-hidden="true"
        />
        <dd class="text-lg font-display font-black">
          {{ stat.value }}
        </dd>
        <dt class="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {{ stat.label }}
        </dt>
      </div>
    </dl>

    <div
      class="flex items-center gap-2"
      role="group"
      aria-label="Backup and restore"
    >
      <button
        class="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-culinary-primary hover:text-culinary-primary transition-all"
        @click="exportBackup"
      >
        <Download :size="14" /> Backup
      </button>
      <button
        class="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-culinary-primary hover:text-culinary-primary transition-all"
        @click="openImportPicker"
      >
        <Upload :size="14" /> Restore
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        class="hidden"
        aria-label="Choose a MealScout backup file"
        @change="importBackup"
      >
    </div>

    <p
      v-if="statusMessage"
      class="w-full text-xs font-bold"
      :class="statusIsError ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'"
      role="status"
    >
      {{ statusMessage }}
    </p>
  </section>
</template>
