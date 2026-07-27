<script setup lang="ts">
import { computed, onMounted, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettingsStore } from './stores/settings'
import { usePantryStore } from './stores/pantryStore'
import { useGroceryStore } from './stores/groceryStore'
import { useKeyboardControls } from './composables/useKeyboardControls'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import SettingsPanel from './components/ui/SettingsPanel.vue'
import RecipeDetailModal from './components/recipe/RecipeDetailModal.vue'

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()
const pantryStore = usePantryStore()
const groceryStore = useGroceryStore()
const { lastAction } = useKeyboardControls()

onMounted(() => {
  // Async storage hydration (IndexedDB w/ localStorage fallback). Mutations
  // fired before these settle are queued by the stores and replayed — see
  // docs/v3/STORAGE_MIGRATION.md.
  void pantryStore.hydrate()
  void groceryStore.hydrate()
})

/** Route-driven recipe detail: /recipe/:id opens the modal over the page. */
const selectedRecipeId = computed(() =>
  route.name === 'recipe' && typeof route.params.id === 'string' ? route.params.id : null
)

const closeRecipe = () => {
  // Back restores the underlying view and its scroll position; deep links
  // with no in-app history land on the discover catalogue.
  if (window.history.state?.back) {
    router.back()
  } else {
    void router.push({ name: 'discover' })
  }
}

// useKeyboardControls already toggles help itself — toggling it here as well
// would cancel the shortcut out. App only reacts to 'close' for its own modal.
watchEffect(() => {
  if (lastAction.value === 'close' && selectedRecipeId.value) closeRecipe()
})
</script>

<template>
  <div
    class="min-h-screen transition-colors duration-500"
    :class="{ dark: settingsStore.isDarkMode, light: !settingsStore.isDarkMode }"
  >
    <AppHeader />

    <main
      class="max-w-7xl mx-auto px-6 py-12"
      role="main"
    >
      <!-- KeepAlive preserves per-view state (e.g. cook-match results) across
           navigation, including behind the /recipe/:id modal. -->
      <RouterView v-slot="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>

    <AppFooter />

    <RecipeDetailModal
      :recipe-id="selectedRecipeId"
      @close="closeRecipe"
    />

    <SettingsPanel />
  </div>
</template>
