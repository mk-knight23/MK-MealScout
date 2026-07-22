<script setup lang="ts">
import { onMounted, ref, watchEffect } from 'vue'
import { useRecipeStore } from './stores/recipeStore'
import { useSettingsStore } from './stores/settings'
import { useStatsStore } from './stores/stats'
import { useAudio } from './composables/useAudio'
import { useKeyboardControls } from './composables/useKeyboardControls'
import SettingsPanel from './components/ui/SettingsPanel.vue'
import {
  Search,
  Heart,
  ChefHat,
  Clock,
  MapPin,
  Tag,
  ArrowRight,
  Moon,
  Sun,
  X,
  PlayCircle,
  ExternalLink,
  Settings,
} from 'lucide-vue-next'

const store = useRecipeStore()
const settingsStore = useSettingsStore()
const statsStore = useStatsStore()
const audio = useAudio()
const { lastAction } = useKeyboardControls()

const showModal = ref(false)
const selectedRecipe = ref<any>(null)

onMounted(() => {
  store.fetchCategories()
  store.searchRecipes('')
  statsStore.recordSearch()
})

watchEffect(() => {
  if (lastAction.value === 'help') {
    settingsStore.toggleHelp()
  }
  if (lastAction.value === 'close' && showModal.value) {
    showModal.value = false
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

const openRecipe = async (recipe: any) => {
  statsStore.recordRecipeView()
  try {
    const { data } = await fetch(
      `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipe.idMeal}`
    ).then((res) => res.json())
    selectedRecipe.value = data.meals[0]
    showModal.value = true
    audio.playSuccess()
  } catch (err) {
    audio.playError()
  }
}

const getIngredients = (recipe: any) => {
  const ingredients = []
  for (let i = 1; i <= 20; i++) {
    const name = recipe[`strIngredient${i}`]
    const measure = recipe[`strMeasure${i}`]
    if (name && name.trim()) {
      ingredients.push(`${measure} ${name}`)
    }
  }
  return ingredients
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
    </header>

    <main class="max-w-7xl mx-auto px-6 py-12 space-y-16" role="main">
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
            Browse through 500+ premium recipes with high-res imagery and nutritional data.
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
        <p class="text-slate-500 mt-2">Try a different keyword or category.</p>
        <button
          @click="store.searchRecipes('')"
          class="mt-8 text-culinary-primary font-black uppercase tracking-widest text-xs"
        >
          Reset Search
        </button>
      </div>
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
    <div
      v-if="showModal && selectedRecipe"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`recipe-${selectedRecipe.idMeal}-title`"
    >
      <div
        @click="showModal = false"
        class="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        aria-hidden="true"
      ></div>
      <div
        class="relative glass w-full max-w-5xl rounded-[3rem] overflow-hidden flex flex-col md:flex-row h-full max-h-[85vh]"
        role="document"
      >
        <button
          @click="showModal = false"
          class="absolute top-6 right-6 z-10 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl hover:scale-110 transition-transform"
          aria-label="Close recipe details"
        >
          <X :size="20" />
        </button>

        <div class="w-full md:w-5/12 h-64 md:h-auto relative">
          <img :src="selectedRecipe.strMealThumb" class="w-full h-full object-cover" alt="" />
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
          ></div>
          <div class="absolute bottom-10 left-10 text-white space-y-2">
            <div class="flex gap-2">
              <span
                class="px-3 py-1 bg-culinary-primary text-[10px] font-black uppercase rounded-lg"
                >{{ selectedRecipe.strCategory }}</span
              >
              <span
                class="px-3 py-1 bg-white/20 backdrop-blur-md text-[10px] font-black uppercase rounded-lg border border-white/10"
                >{{ selectedRecipe.strArea }}</span
              >
            </div>
            <h2
              :id="`recipe-${selectedRecipe.idMeal}-title`"
              class="text-4xl font-display font-black leading-tight"
            >
              {{ selectedRecipe.strMeal }}
            </h2>
          </div>
        </div>

        <div class="w-full md:w-7/12 p-8 md:p-12 overflow-y-auto custom-scrollbar space-y-10">
          <div class="grid grid-cols-2 gap-8 pt-4">
            <div class="space-y-4">
              <h4
                class="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"
              >
                <Tag :size="14" class="text-culinary-primary" /> Ingredients
              </h4>
              <ul class="space-y-3">
                <li
                  v-for="ing in getIngredients(selectedRecipe)"
                  :key="ing"
                  class="text-sm font-bold flex items-center gap-2"
                >
                  <div class="w-1.5 h-1.5 rounded-full bg-culinary-primary/30"></div>
                  {{ ing }}
                </li>
              </ul>
            </div>
            <div class="space-y-4">
              <h4
                class="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"
              >
                <Clock :size="14" class="text-culinary-primary" /> Preparation
              </h4>
              <div class="space-y-4">
                <div
                  class="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between group cursor-pointer"
                >
                  <span class="text-xs font-black uppercase">Watch Tutorial</span>
                  <PlayCircle
                    class="text-culinary-primary group-hover:scale-110 transition-transform"
                  />
                </div>
                <div
                  class="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between group cursor-pointer"
                >
                  <span class="text-xs font-black uppercase">Full Article</span>
                  <ExternalLink :size="18" class="text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4 pt-8 border-t border-slate-100 dark:border-slate-800">
            <h4 class="text-xs font-black uppercase tracking-widest text-slate-400">
              Cooking Instructions
            </h4>
            <p
              class="text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-400 whitespace-pre-line"
            >
              {{ selectedRecipe.strInstructions }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <SettingsPanel />
  </div>
</template>

<style>
/* Global overrides */
</style>
