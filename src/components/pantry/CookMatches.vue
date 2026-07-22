<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePantryStore } from '@/stores/pantryStore'
import { filterByIngredient } from '@/utils/mealdb'
import type { IngredientResult, RecipeMatch } from '@/utils/matching'
import { MAX_MATCH_INGREDIENTS, matchBadgeLabel, mergeIngredientMatches } from '@/utils/matching'
import { ChefHat, RefreshCw, Search, UtensilsCrossed } from 'lucide-vue-next'

const emit = defineEmits<{ (e: 'open-recipe', id: string): void }>()

const pantry = usePantryStore()
const matches = ref<RecipeMatch[]>([])
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const failedIngredients = ref<string[]>([])
const hasSearched = ref(false)

const isCapped = computed(() => pantry.count > MAX_MATCH_INGREDIENTS)

const findMatches = async () => {
  const ingredients = pantry.entries.slice(0, MAX_MATCH_INGREDIENTS).map(e => e.name)
  if (ingredients.length === 0) return

  loading.value = true
  errorMessage.value = null

  const settled = await Promise.allSettled(ingredients.map(name => filterByIngredient(name)))
  const succeeded: IngredientResult[] = []
  const failed: string[] = []
  settled.forEach((outcome, index) => {
    const ingredient = ingredients[index]
    if (!ingredient) return
    if (outcome.status === 'fulfilled') {
      succeeded.push({ ingredient, recipes: outcome.value })
    } else {
      failed.push(ingredient)
    }
  })

  failedIngredients.value = failed
  if (succeeded.length === 0) {
    errorMessage.value = 'Could not reach the recipe service. Check your connection and try again.'
    matches.value = []
  } else {
    matches.value = mergeIngredientMatches(succeeded)
  }
  hasSearched.value = true
  loading.value = false
}
</script>

<template>
  <section
    class="space-y-8"
    aria-labelledby="cook-heading"
  >
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3
          id="cook-heading"
          class="text-2xl font-display font-bold"
        >
          What can I cook?
        </h3>
        <p class="text-sm text-slate-500 font-medium mt-1">
          Finds recipes matching your pantry ingredients.
          <span v-if="isCapped">Uses your first {{ MAX_MATCH_INGREDIENTS }} pantry items.</span>
        </p>
      </div>
      <button
        :disabled="pantry.count === 0 || loading"
        class="flex items-center gap-2 bg-culinary-primary hover:bg-culinary-secondary disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
        @click="findMatches"
      >
        <RefreshCw
          v-if="hasSearched"
          :size="16"
          :class="{ 'animate-spin': loading }"
        />
        <Search
          v-else
          :size="16"
        />
        {{ hasSearched ? 'Refresh matches' : 'Find recipes' }}
      </button>
    </div>

    <!-- Empty pantry -->
    <div
      v-if="pantry.count === 0"
      class="text-center py-16 glass rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800"
    >
      <UtensilsCrossed
        class="mx-auto text-slate-300 mb-4"
        :size="48"
        aria-hidden="true"
      />
      <p class="font-display font-bold text-xl">
        Add ingredients to your pantry first
      </p>
      <p class="text-sm text-slate-500 mt-1">
        Then we can suggest recipes you can cook right now.
      </p>
    </div>

    <!-- Loading -->
    <div
      v-else-if="loading"
      class="flex flex-col items-center py-16"
      role="status"
    >
      <div class="w-12 h-12 border-4 border-culinary-primary/20 border-t-culinary-primary rounded-full animate-spin" />
      <p class="mt-4 font-black uppercase tracking-widest text-slate-400 text-xs">
        Matching your pantry...
      </p>
    </div>

    <!-- Total API failure -->
    <div
      v-else-if="errorMessage"
      class="text-center py-16 glass rounded-[2rem] border border-red-200 dark:border-red-900/40"
      role="alert"
    >
      <p class="font-display font-bold text-xl text-red-600 dark:text-red-400">
        Something went wrong
      </p>
      <p class="text-sm text-slate-500 mt-2">
        {{ errorMessage }}
      </p>
      <button
        class="mt-6 text-culinary-primary font-black uppercase tracking-widest text-xs"
        @click="findMatches"
      >
        Try again
      </button>
    </div>

    <!-- Zero results -->
    <div
      v-else-if="hasSearched && matches.length === 0"
      class="text-center py-16 glass rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800"
    >
      <ChefHat
        class="mx-auto text-slate-300 mb-4"
        :size="48"
        aria-hidden="true"
      />
      <p class="font-display font-bold text-xl">
        No matches found
      </p>
      <p class="text-sm text-slate-500 mt-1">
        Try adding more common ingredients — exact names like "Chicken" or "Rice" match best.
      </p>
    </div>

    <!-- Results -->
    <template v-else-if="matches.length > 0">
      <p
        v-if="failedIngredients.length"
        class="text-xs text-amber-600 dark:text-amber-400 font-bold"
      >
        Could not check: {{ failedIngredients.join(', ') }}. Results may be incomplete.
      </p>
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        aria-label="Recipe matches"
      >
        <article
          v-for="match in matches"
          :key="match.recipe.idMeal"
          class="recipe-card group cursor-pointer"
          @click="emit('open-recipe', match.recipe.idMeal)"
        >
          <div class="relative aspect-video overflow-hidden">
            <img
              :src="match.recipe.strMealThumb"
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              :alt="match.recipe.strMeal"
              loading="lazy"
            >
            <span
              class="absolute bottom-4 left-4 px-3 py-1 bg-culinary-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg"
            >
              {{ matchBadgeLabel(match.score) }}
            </span>
          </div>
          <div class="p-6 space-y-3">
            <h4 class="text-xl font-display font-bold leading-tight group-hover:text-culinary-primary transition-colors">
              {{ match.recipe.strMeal }}
            </h4>
            <p class="text-xs text-slate-400 font-bold uppercase tracking-wider truncate">
              Uses: {{ match.matchedIngredients.join(', ') }}
            </p>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>
