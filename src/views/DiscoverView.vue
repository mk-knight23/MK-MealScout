<script setup lang="ts">
import { onMounted } from 'vue'
import { useRecipeStore } from '@/stores/recipeStore'
import { useStatsStore } from '@/stores/stats'
import { useAudio } from '@/composables/useAudio'
import { useOpenRecipe } from '@/composables/useOpenRecipe'
import RecipeCard from '@/components/recipe/RecipeCard.vue'
import { ChefHat, Heart, MapPin, Search } from 'lucide-vue-next'

const store = useRecipeStore()
const statsStore = useStatsStore()
const audio = useAudio()
const openRecipe = useOpenRecipe()

onMounted(() => {
  // Guarded so the KeepAlive-cached instance (and the /recipe/:id deep-link
  // background) fetches the catalogue only once.
  if (store.categories.length === 0) store.fetchCategories()
  // Initial catalogue load — deliberately NOT counted as a user search.
  if (store.recipes.length === 0 && !store.loading) store.searchRecipes('')
})

const onSearch = () => {
  audio.playClick()
  store.searchRecipes(store.searchQuery)
  statsStore.recordSearch()
}
</script>

<template>
  <div class="space-y-16">
    <!-- Search & Hero -->
    <section
      class="text-center space-y-8 max-w-3xl mx-auto"
      aria-labelledby="hero-heading"
    >
      <div class="space-y-4">
        <h2
          id="hero-heading"
          class="text-5xl md:text-7xl font-display font-black leading-tight tracking-tight"
        >
          Discover Your Next <br>
          <span
            class="text-culinary-primary italic underline decoration-8 decoration-culinary-primary/10"
          >Masterpiece</span>
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
          v-model="store.searchQuery"
          type="text"
          placeholder="Search by ingredient, dish or cuisine..."
          class="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] pl-16 pr-8 py-6 text-xl outline-none focus:border-culinary-primary focus:ring-8 focus:ring-culinary-primary/5 transition-all shadow-2xl shadow-slate-200/50 dark:shadow-none"
          aria-label="Search recipes"
          @keyup.enter="onSearch"
        >
        <button
          class="absolute right-3 top-3 bottom-3 bg-culinary-primary hover:bg-culinary-secondary text-white px-8 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all active:scale-95"
          aria-label="Search"
          @click="onSearch"
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
          class="px-6 py-2.5 rounded-full text-sm font-bold transition-all"
          :class="
            store.selectedCategory === cat
              ? 'bg-culinary-primary text-white shadow-lg shadow-culinary-primary/30'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-culinary-primary'
          "
          :aria-pressed="store.selectedCategory === cat"
          @click="store.fetchByCategory(cat)"
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
      <h2
        id="recipes-heading"
        class="sr-only"
      >
        Recipe Results
      </h2>
      <RecipeCard
        v-for="recipe in store.recipes"
        :key="recipe.idMeal"
        :recipe-id="recipe.idMeal"
        :title="recipe.strMeal"
        :thumb="recipe.strMealThumb"
        :badge="recipe.strCategory || 'General'"
        badge-variant="neutral"
        @open="openRecipe"
      >
        <template #overlay>
          <button
            class="absolute top-4 right-4 p-3 rounded-2xl glass hover:bg-white transition-colors"
            :aria-label="
              store.favorites.includes(recipe.idMeal)
                ? 'Remove from favorites'
                : 'Add to favorites'
            "
            :aria-pressed="store.favorites.includes(recipe.idMeal)"
            @click.stop="store.toggleFavorite(recipe.idMeal)"
            @keydown.enter.stop
            @keydown.space.stop
          >
            <Heart
              :class="{ 'text-red-500 fill-red-500': store.favorites.includes(recipe.idMeal) }"
              :size="20"
            />
          </button>
        </template>
        <div
          class="flex items-center space-x-4 text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800"
        >
          <span class="flex items-center gap-1 text-xs font-bold uppercase tracking-tighter"><MapPin :size="14" /> {{ recipe.strArea || 'Global' }}</span>
        </div>
      </RecipeCard>
    </section>

    <!-- Loading State -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-20"
    >
      <div
        class="w-16 h-16 border-4 border-culinary-primary/20 border-t-culinary-primary rounded-full animate-spin"
      />
      <p class="mt-4 font-black uppercase tracking-widest text-slate-400 text-xs">
        Simmering your recipes...
      </p>
    </div>

    <!-- Empty State -->
    <div
      v-if="!store.loading && store.recipes.length === 0"
      class="text-center py-24 glass rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800"
    >
      <ChefHat
        class="mx-auto text-slate-300 mb-6"
        :size="64"
      />
      <h3 class="text-2xl font-display font-bold">
        No recipes found
      </h3>
      <p class="text-slate-500 mt-2">
        {{ store.errorMessage || 'Try a different keyword or category.' }}
      </p>
      <button
        class="mt-8 text-culinary-primary font-black uppercase tracking-widest text-xs"
        @click="store.searchRecipes('')"
      >
        Reset Search
      </button>
    </div>
  </div>
</template>
