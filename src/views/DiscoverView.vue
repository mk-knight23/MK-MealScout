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
  <div class="space-y-12">
    <!-- Editorial masthead: serif-led, honest copy (approved Gate B preview) -->
    <section
      class="space-y-6"
      aria-labelledby="hero-heading"
    >
      <div class="space-y-3">
        <h2
          id="hero-heading"
          class="font-display font-black leading-[1.08] tracking-[-0.015em] text-[clamp(1.9rem,6vw,3.4rem)] max-w-[16ch]"
        >
          Cook what's <em class="italic text-mk-accent">already</em> in your kitchen.
        </h2>
        <p class="text-mk-secondary max-w-[52ch]">
          Search TheMealDB's community recipes by ingredient, dish or cuisine — or match them
          against the pantry you track here.
        </p>
      </div>

      <div class="relative max-w-xl">
        <Search
          class="absolute left-4 top-1/2 -translate-y-1/2 text-mk-muted pointer-events-none"
          :size="18"
          aria-hidden="true"
        />
        <input
          v-model="store.searchQuery"
          type="text"
          placeholder="Search recipes or ingredients…"
          class="w-full bg-mk-raised text-mk-ink placeholder:text-mk-muted border-2 border-mk-border-strong rounded-mk-sm pl-11 pr-24 py-3 outline-none focus-visible:border-mk-ring focus-visible:outline-offset-0 transition-colors"
          aria-label="Search recipes"
          @keyup.enter="onSearch"
        >
        <button
          class="absolute right-1.5 top-1.5 bottom-1.5 bg-mk-accent-strong text-mk-on-accent px-5 rounded-mk-sm font-semibold text-sm border border-transparent hover:border-mk-ring transition-colors"
          aria-label="Search"
          @click="onSearch"
        >
          Find
        </button>
      </div>

      <!-- Categories: horizontal snap-scroll rail on small screens -->
      <div
        class="flex gap-2 overflow-x-auto snap-x pb-1 sm:flex-wrap sm:overflow-visible"
        role="group"
        aria-label="Recipe categories"
      >
        <button
          v-for="cat in store.categories.slice(0, 8)"
          :key="cat"
          class="shrink-0 snap-start px-4 py-2 rounded-full text-sm font-medium transition-colors"
          :class="
            store.selectedCategory === cat
              ? 'bg-mk-accent-strong text-mk-on-accent'
              : 'bg-mk-raised border border-mk-border text-mk-secondary hover:border-mk-border-strong hover:text-mk-ink'
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
      aria-labelledby="recipes-heading"
    >
      <div class="mk-band rounded-mk-xs px-3 py-2 mb-5 flex items-baseline gap-3 flex-wrap">
        <h2
          id="recipes-heading"
          class="font-display font-bold text-2xl"
        >
          From the catalogue
        </h2>
        <span class="text-sm text-mk-muted">TheMealDB community recipes</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
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
              class="absolute top-3 right-3 p-2.5 rounded-full bg-mk-raised border border-mk-border text-mk-secondary hover:text-mk-accent transition-colors"
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
                :class="{ 'text-mk-accent fill-mk-accent': store.favorites.includes(recipe.idMeal) }"
                :size="18"
              />
            </button>
          </template>
          <p class="flex items-center gap-1.5 text-xs font-medium text-mk-muted pt-3 border-t border-mk-border">
            <MapPin
              :size="14"
              aria-hidden="true"
            /> {{ recipe.strArea || 'Global' }}
          </p>
        </RecipeCard>
      </div>
    </section>

    <!-- Loading State -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-20"
    >
      <div
        class="w-12 h-12 border-4 border-mk-accent-soft border-t-mk-accent rounded-full animate-spin"
        aria-hidden="true"
      />
      <p class="mt-4 text-sm font-semibold text-mk-muted">
        Simmering your recipes…
      </p>
    </div>

    <!-- Empty State -->
    <div
      v-if="!store.loading && store.recipes.length === 0"
      class="text-center py-20 bg-mk-raised border-2 border-dashed border-mk-border rounded-mk-lg"
    >
      <ChefHat
        class="mx-auto text-mk-muted mb-6"
        :size="56"
        aria-hidden="true"
      />
      <h3 class="text-2xl font-display font-bold">
        No recipes found
      </h3>
      <p class="text-mk-secondary mt-2">
        {{ store.errorMessage || 'Try a different keyword or category.' }}
      </p>
      <button
        class="mt-6 text-mk-accent font-semibold text-sm hover:underline"
        @click="store.searchRecipes('')"
      >
        Reset search
      </button>
    </div>
  </div>
</template>
