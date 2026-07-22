<script setup lang="ts">
import { onMounted, ref, watchEffect } from 'vue'
import { useRecipeStore } from './stores/recipeStore'
import { useSettingsStore } from './stores/settings'
import { useStatsStore } from './stores/stats'
import { usePantryStore } from './stores/pantryStore'
import { useGroceryStore } from './stores/groceryStore'
import { useAudio } from './composables/useAudio'
import { useKeyboardControls } from './composables/useKeyboardControls'
import SettingsPanel from './components/ui/SettingsPanel.vue'
import PantryManager from './components/pantry/PantryManager.vue'
import CookMatches from './components/pantry/CookMatches.vue'
import GroceryView from './components/grocery/GroceryView.vue'
import RecipeDetailModal from './components/recipe/RecipeDetailModal.vue'
import type { Recipe } from './types/recipe'
import {
  Search,
  Heart,
  ChefHat,
  MapPin,
  ArrowRight,
  Moon,
  Sun,
  Settings,
  Refrigerator,
  ShoppingCart,
  Compass,
} from 'lucide-vue-next'

type AppView = 'discover' | 'pantry' | 'grocery'

const store = useRecipeStore()
const settingsStore = useSettingsStore()
const statsStore = useStatsStore()
const pantryStore = usePantryStore()
const groceryStore = useGroceryStore()
const audio = useAudio()
const { lastAction } = useKeyboardControls()

const activeView = ref<AppView>('discover')
const selectedRecipeId = ref<string | null>(null)

const NAV_ITEMS: { view: AppView; label: string }[] = [
  { view: 'discover', label: 'Discover' },
  { view: 'pantry', label: 'Pantry' },
  { view: 'grocery', label: 'Grocery' },
]

onMounted(() => {
  store.fetchCategories()
  store.searchRecipes('')
  statsStore.recordSearch()
})

watchEffect(() => {
  if (lastAction.value === 'help') {
    settingsStore.toggleHelp()
  }
  if (lastAction.value === 'close' && selectedRecipeId.value) {
    selectedRecipeId.value = null
  }
})

const toggleTheme = () => {
  audio.playClick()
  const nextTheme =
    settingsStore.theme === 'dark' ? 'light' : settingsStore.theme === 'light' ? 'system' : 'dark'
  settingsStore.setTheme(nextTheme)
}

const openSettings = () => {
  audio.playClick()
  settingsStore.toggleHelp()
}

const switchView = (view: AppView) => {
  audio.playClick()
  activeView.value = view
}

const openRecipe = (recipe: Recipe) => {
  openRecipeById(recipe.idMeal)
}

const openRecipeById = (id: string) => {
  statsStore.recordRecipeView()
  selectedRecipeId.value = id
  audio.playClick()
}

const onSearch = () => {
  audio.playClick()
  store.searchRecipes(store.searchQuery)
  statsStore.recordSearch()
}
</script>

<template>
  <div
    class="min-h-screen transition-colors duration-500"
    :class="{ dark: settingsStore.isDarkMode, light: !settingsStore.isDarkMode }"
    role="application"
    aria-label="MK MealScout Recipe Finder"
  >
    <!-- Header -->
    <header
      class="sticky top-0 z-40 glass border-b border-slate-200 dark:border-slate-800 px-6 py-4"
      role="banner"
    >
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <div
            class="bg-culinary-primary p-2 rounded-2xl rotate-3 shadow-lg shadow-culinary-primary/20"
            aria-hidden="true"
          >
            <ChefHat class="text-white" :size="24" />
          </div>
          <h1 class="text-2xl font-display font-black tracking-tighter uppercase dark:text-white">
            MK_<span class="text-culinary-primary">MealScout</span>
          </h1>
        </div>

        <nav class="hidden md:flex items-center gap-1" aria-label="Main navigation">
          <button
            v-for="item in NAV_ITEMS"
            :key="item.view"
            @click="switchView(item.view)"
            class="px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
            :class="
              activeView === item.view
                ? 'bg-culinary-primary text-white shadow-lg shadow-culinary-primary/30'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            "
            :aria-pressed="activeView === item.view"
          >
            {{ item.label }}
            <span
              v-if="item.view === 'pantry' && pantryStore.count > 0"
              class="ml-1 opacity-70"
              >{{ pantryStore.count }}</span
            >
            <span
              v-if="item.view === 'grocery' && groceryStore.remainingCount > 0"
              class="ml-1 opacity-70"
              >{{ groceryStore.remainingCount }}</span
            >
          </button>
        </nav>

        <div class="flex items-center space-x-4">
          <button
            @click="openSettings"
            class="p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open settings"
          >
            <Settings class="text-slate-600 dark:text-slate-300" :size="20" />
          </button>
          <button
            @click="toggleTheme"
            class="p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            :aria-label="settingsStore.isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <Sun v-if="settingsStore.isDarkMode" :size="20" class="text-amber-400" />
            <Moon v-else :size="20" class="text-blue-600" />
          </button>
          <div
            class="hidden sm:flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700"
            role="status"
            aria-label="{{ store.favorites.length }} saved recipes"
          >
            <Heart class="text-culinary-primary fill-culinary-primary" :size="16" />
            <span class="text-xs font-black uppercase tracking-widest"
              >{{ store.favorites.length }} Saved</span
            >
          </div>
        </div>
      </div>
      <nav
        class="md:hidden max-w-7xl mx-auto flex items-center gap-1 pt-3"
        aria-label="Main navigation (mobile)"
      >
        <button
          v-for="item in NAV_ITEMS"
          :key="item.view"
          @click="switchView(item.view)"
          class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
          :class="
            activeView === item.view
              ? 'bg-culinary-primary text-white'
              : 'text-slate-500 bg-slate-100 dark:bg-slate-800'
          "
          :aria-pressed="activeView === item.view"
        >
          <Compass v-if="item.view === 'discover'" :size="14" aria-hidden="true" />
          <Refrigerator v-if="item.view === 'pantry'" :size="14" aria-hidden="true" />
          <ShoppingCart v-if="item.view === 'grocery'" :size="14" aria-hidden="true" />
          {{ item.label }}
        </button>
      </nav>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-12 space-y-16" role="main">
      <template v-if="activeView === 'discover'">
      <!-- Search & Hero -->
      <section class="text-center space-y-8 max-w-3xl mx-auto" aria-labelledby="hero-heading">
        <div class="space-y-4">
          <h2
            id="hero-heading"
            class="text-5xl md:text-7xl font-display font-black leading-tight tracking-tight"
          >
            Discover Your Next <br />
            <span
              class="text-culinary-primary italic underline decoration-8 decoration-culinary-primary/10"
              >Masterpiece</span
            >
          </h2>
          <p class="text-slate-500 dark:text-slate-400 font-medium text-lg">
            Browse hundreds of community recipes with high-res imagery, or cook from what is
            already in your pantry.
          </p>
        </div>

        <div class="relative group">
          <Search
            class="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-culinary-primary transition-colors"
            :size="24"
            aria-hidden="true"
          />
          <input
            type="text"
            v-model="store.searchQuery"
            @keyup.enter="onSearch"
            placeholder="Search by ingredient, dish or cuisine..."
            class="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] pl-16 pr-8 py-6 text-xl outline-none focus:border-culinary-primary focus:ring-8 focus:ring-culinary-primary/5 transition-all shadow-2xl shadow-slate-200/50 dark:shadow-none"
            aria-label="Search recipes"
          />
          <button
            @click="onSearch"
            class="absolute right-3 top-3 bottom-3 bg-culinary-primary hover:bg-culinary-secondary text-white px-8 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all active:scale-95"
            aria-label="Search"
          >
            Find
          </button>
        </div>

        <!-- Categories -->
        <div
          class="flex flex-wrap justify-center gap-3"
          role="group"
          aria-label="Recipe categories"
        >
          <button
            v-for="cat in store.categories.slice(0, 8)"
            :key="cat"
            @click="store.fetchByCategory(cat)"
            class="px-6 py-2.5 rounded-full text-sm font-bold transition-all"
            :class="
              store.selectedCategory === cat
                ? 'bg-culinary-primary text-white shadow-lg shadow-culinary-primary/30'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-culinary-primary'
            "
            :aria-pressed="store.selectedCategory === cat"
          >
            {{ cat }}
          </button>
        </div>
      </section>

      <!-- Recipe Grid -->
      <section
        v-if="!store.loading"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
        aria-labelledby="recipes-heading"
      >
        <h2 id="recipes-heading" class="sr-only">Recipe Results</h2>
        <article v-for="recipe in store.recipes" :key="recipe.idMeal" class="recipe-card group">
          <div class="relative aspect-video overflow-hidden">
            <img
              :src="recipe.strMealThumb"
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              :alt="recipe.strMeal"
            />
            <button
              @click.stop="store.toggleFavorite(recipe.idMeal)"
              class="absolute top-4 right-4 p-3 rounded-2xl glass hover:bg-white transition-colors"
              :aria-label="
                store.favorites.includes(recipe.idMeal)
                  ? 'Remove from favorites'
                  : 'Add to favorites'
              "
              :aria-pressed="store.favorites.includes(recipe.idMeal)"
            >
              <Heart
                :class="{ 'text-red-500 fill-red-500': store.favorites.includes(recipe.idMeal) }"
                :size="20"
              />
            </button>
            <div class="absolute bottom-4 left-4 flex gap-2">
              <span
                class="px-3 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/10"
              >
                {{ recipe.strCategory || 'General' }}
              </span>
            </div>
          </div>
          <div class="p-8 space-y-4">
            <h3
              class="text-2xl font-display font-bold leading-tight group-hover:text-culinary-primary transition-colors"
            >
              {{ recipe.strMeal }}
            </h3>
            <div
              class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800"
            >
              <div class="flex items-center space-x-4 text-slate-400">
                <span class="flex items-center gap-1 text-xs font-bold uppercase tracking-tighter"
                  ><MapPin :size="14" /> {{ recipe.strArea || 'Global' }}</span
                >
              </div>
              <button
                @click="openRecipe(recipe)"
                class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-culinary-primary hover:bg-culinary-primary hover:text-white transition-all"
                :aria-label="`View recipe details for ${recipe.strMeal}`"
              >
                <ArrowRight :size="20" />
              </button>
            </div>
          </div>
        </article>
      </section>

      <!-- Loading State -->
      <div v-else class="flex flex-col items-center justify-center py-20">
        <div
          class="w-16 h-16 border-4 border-culinary-primary/20 border-t-culinary-primary rounded-full animate-spin"
        ></div>
        <p class="mt-4 font-black uppercase tracking-widest text-slate-400 text-xs">
          Simmering your recipes...
        </p>
      </div>

      <!-- Empty State -->
      <div
        v-if="!store.loading && store.recipes.length === 0"
        class="text-center py-24 glass rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800"
      >
        <ChefHat class="mx-auto text-slate-300 mb-6" :size="64" />
        <h3 class="text-2xl font-display font-bold">No recipes found</h3>
        <p class="text-slate-500 mt-2">
          {{ store.errorMessage || 'Try a different keyword or category.' }}
        </p>
        <button
          @click="store.searchRecipes('')"
          class="mt-8 text-culinary-primary font-black uppercase tracking-widest text-xs"
        >
          Reset Search
        </button>
      </div>
      </template>

      <!-- Pantry view: manage ingredients + ingredient-first matching -->
      <template v-else-if="activeView === 'pantry'">
        <PantryManager />
        <CookMatches @open-recipe="openRecipeById" />
      </template>

      <!-- Grocery view -->
      <template v-else>
        <GroceryView />
      </template>
    </main>

    <!-- Footer -->
    <footer
      class="mt-48 pb-12 border-t border-slate-200 dark:border-slate-800 pt-20"
      role="contentinfo"
    >
      <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div class="space-y-6">
          <div class="flex items-center space-x-2">
            <ChefHat class="text-culinary-primary" :size="20" />
            <span class="font-display font-bold text-xl tracking-tighter">MK MealScout</span>
          </div>
          <p class="text-slate-500 text-sm leading-relaxed">
            The ultimate workspace for culinary exploration and digital meal planning.
          </p>
        </div>
        <div>
          <h4 class="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
            Discover
          </h4>
          <ul class="space-y-4 text-sm font-bold text-slate-500">
            <li class="hover:text-culinary-primary cursor-pointer transition-colors">
              Trending Recipes
            </li>
            <li class="hover:text-culinary-primary cursor-pointer transition-colors">
              Global Cuisines
            </li>
            <li class="hover:text-culinary-primary cursor-pointer transition-colors">
              Healthy Options
            </li>
          </ul>
        </div>
        <div>
          <h4 class="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
            Platform
          </h4>
          <ul class="space-y-4 text-sm font-bold text-slate-500">
            <li class="hover:text-culinary-primary cursor-pointer transition-colors">
              Saved Collections
            </li>
            <li class="hover:text-culinary-primary cursor-pointer transition-colors">
              Meal Planner
            </li>
            <li class="hover:text-culinary-primary cursor-pointer transition-colors">
              Grocery Integrator
            </li>
          </ul>
        </div>
        <div class="bg-culinary-primary/5 p-8 rounded-[2rem] border border-culinary-primary/10">
          <h4 class="text-sm font-black text-culinary-primary mb-2">Newsletter</h4>
          <p class="text-xs text-slate-500 mb-4 font-medium">Get fresh recipes every weekend.</p>
          <div class="flex gap-2">
            <input
              type="email"
              placeholder="email"
              class="bg-white dark:bg-slate-900 border-none rounded-xl px-4 text-xs flex-1 outline-none focus:ring-2 focus:ring-culinary-primary"
            />
            <button class="bg-culinary-primary p-2.5 rounded-xl text-white">
              <ArrowRight :size="16" />
            </button>
          </div>
        </div>
      </div>
      <div
        class="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6"
      >
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          © 2026 <a href="https://www.mkazi.live" target="_blank" rel="noopener noreferrer" class="hover:text-culinary-primary transition-colors underline">Kazi Musharraf — Kazi Developer</a>. All rights reserved.
        </p>
        <div class="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <a href="https://github.com/mk-knight23/17-web-culinary-discovery" target="_blank" rel="noopener noreferrer" class="hover:text-culinary-primary transition-colors">GitHub</a>
          <span>No data collected</span>
          <span>Free &amp; open-source</span>
        </div>
      </div>
    </footer>

    <!-- Recipe Detail Modal -->
    <RecipeDetailModal :recipe-id="selectedRecipeId" @close="selectedRecipeId = null" />

    <SettingsPanel />
  </div>
</template>

<style>
/* Global overrides */
</style>
