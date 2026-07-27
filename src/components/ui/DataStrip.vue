<script setup lang="ts">
/**
 * "Kitchen Counter" — the V3 dashboard treatment of the data strip.
 * Every number comes from a real local store (pantry / grocery / recipe);
 * the expiring tile lists the actual item names (max 3). No invented
 * metrics: a cookable-now count is not shown because no store tracks one.
 */
import { computed, ref } from 'vue'
import { usePantryStore } from '@/stores/pantryStore'
import { useGroceryStore } from '@/stores/groceryStore'
import { useRecipeStore } from '@/stores/recipeStore'
import { createBackup, parseBackup, serializeBackup } from '@/utils/backup'
import { triggerDownload } from '@/utils/download'
import { Download, Upload } from 'lucide-vue-next'

const pantry = usePantryStore()
const grocery = useGroceryStore()
const recipes = useRecipeStore()

const fileInput = ref<HTMLInputElement | null>(null)
const statusMessage = ref<string | null>(null)
const statusIsError = ref(false)

const expiringNames = computed(() =>
  pantry.expiringSoon
    .slice(0, 3)
    .map((entry) => entry.name)
    .join(' · ')
)

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
  <section aria-label="Kitchen counter">
    <div class="mk-band rounded-mk-xs px-3 py-2 mb-3 flex items-baseline justify-between gap-3 flex-wrap">
      <h2 class="font-display font-bold text-2xl">
        Kitchen Counter
      </h2>
      <div
        class="flex items-center gap-2"
        role="group"
        aria-label="Backup and restore"
      >
        <!-- Disabled until hydration completes: exporting mid-load would
             produce a backup missing the user's real data. -->
        <button
          :disabled="!pantry.isReady || !grocery.isReady"
          class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-mk-sm text-sm font-semibold bg-mk-raised border border-mk-border text-mk-secondary hover:border-mk-border-strong hover:text-mk-ink disabled:opacity-40 transition-colors"
          @click="exportBackup"
        >
          <Download
            :size="14"
            aria-hidden="true"
          /> Back up
        </button>
        <button
          class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-mk-sm text-sm font-semibold bg-mk-raised border border-mk-border text-mk-secondary hover:border-mk-border-strong hover:text-mk-ink transition-colors"
          @click="openImportPicker"
        >
          <Upload
            :size="14"
            aria-hidden="true"
          /> Restore
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
    </div>

    <dl class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="flex flex-col-reverse bg-mk-raised border border-mk-border rounded-mk-md shadow-e1 px-4 py-3.5">
        <dt class="text-xs text-mk-muted">
          pantry items
        </dt>
        <dd class="font-mono font-medium text-2xl leading-tight tabular-nums">
          {{ pantry.count }}
        </dd>
      </div>
      <div class="flex flex-col-reverse bg-mk-raised border border-mk-border rounded-mk-md shadow-e1 px-4 py-3.5">
        <dt class="sr-only">
          expiring soon
        </dt>
        <dd>
          <span
            class="block font-mono font-medium text-2xl leading-tight tabular-nums"
            :class="pantry.expiringSoon.length > 0 ? 'text-mk-danger' : ''"
          >
            {{ pantry.expiringSoon.length }}
          </span>
          <span
            class="block text-xs text-mk-muted"
            aria-hidden="true"
          >expiring soon</span>
          <span
            v-if="expiringNames"
            class="block mt-1 text-xs text-mk-danger"
          >
            {{ expiringNames }}
          </span>
        </dd>
      </div>
      <div class="flex flex-col-reverse bg-mk-raised border border-mk-border rounded-mk-md shadow-e1 px-4 py-3.5">
        <dt class="text-xs text-mk-muted">
          grocery to buy
        </dt>
        <dd class="font-mono font-medium text-2xl leading-tight tabular-nums">
          {{ grocery.remainingCount }}
        </dd>
      </div>
      <div class="flex flex-col-reverse bg-mk-raised border border-mk-border rounded-mk-md shadow-e1 px-4 py-3.5">
        <dt class="text-xs text-mk-muted">
          favorites
        </dt>
        <dd class="font-mono font-medium text-2xl leading-tight tabular-nums">
          {{ recipes.favorites.length }}
        </dd>
      </div>
    </dl>

    <p
      v-if="statusMessage"
      class="mt-3 text-sm font-semibold"
      :class="statusIsError ? 'text-mk-danger' : 'text-mk-herb'"
      role="status"
    >
      {{ statusMessage }}
    </p>
  </section>
</template>
