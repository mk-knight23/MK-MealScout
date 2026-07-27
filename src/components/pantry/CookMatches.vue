<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePantryStore } from '@/stores/pantryStore'
import { filterByIngredient } from '@/utils/mealdb'
import type { IngredientResult, RecipeMatch } from '@/utils/matching'
import { MAX_MATCH_INGREDIENTS, matchBadgeLabel, mergeIngredientMatches } from '@/utils/matching'
import RecipeCard from '@/components/recipe/RecipeCard.vue'
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
    class="space-y-6"
    aria-labelledby="cook-heading"
  >
    <div class="mk-band rounded-mk-xs px-3 py-2 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3
          id="cook-heading"
          class="text-2xl font-display font-bold"
        >
          What can I cook?
        </h3>
        <p class="text-sm text-mk-secondary font-medium mt-1">
          Finds recipes matching your pantry ingredients.
          <span v-if="isCapped">Uses your first {{ MAX_MATCH_INGREDIENTS }} pantry items.</span>
        </p>
      </div>
      <button
        :disabled="pantry.count === 0 || loading"
        class="flex items-center gap-2 bg-mk-accent-strong text-mk-on-accent disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 rounded-mk-sm font-semibold text-sm border border-transparent hover:border-mk-ring transition-colors"
        @click="findMatches"
      >
        <RefreshCw
          v-if="hasSearched"
          :size="16"
          :class="{ 'animate-spin': loading }"
          aria-hidden="true"
        />
        <Search
          v-else
          :size="16"
          aria-hidden="true"
        />
        {{ hasSearched ? 'Refresh matches' : 'Find recipes' }}
      </button>
    </div>

    <!-- Empty pantry. Keys on isReady: no flash while hydration loads. -->
    <div
      v-if="pantry.isReady && pantry.count === 0"
      class="text-center py-16 bg-mk-raised border-2 border-dashed border-mk-border rounded-mk-lg"
    >
      <UtensilsCrossed
        class="mx-auto text-mk-muted mb-4"
        :size="48"
        aria-hidden="true"
      />
      <p class="font-display font-bold text-xl">
        Add ingredients to your pantry first
      </p>
      <p class="text-sm text-mk-secondary mt-1">
        Then we can suggest recipes you can cook right now.
      </p>
    </div>

    <!-- Loading -->
    <div
      v-else-if="loading"
      class="flex flex-col items-center py-16"
      role="status"
    >
      <div
        class="w-12 h-12 border-4 border-mk-accent-soft border-t-mk-accent rounded-full animate-spin"
        aria-hidden="true"
      />
      <p class="mt-4 text-sm font-semibold text-mk-muted">
        Matching your pantry…
      </p>
    </div>

    <!-- Total API failure -->
    <div
      v-else-if="errorMessage"
      class="text-center py-16 bg-mk-raised border border-mk-danger rounded-mk-lg"
      role="alert"
    >
      <p class="font-display font-bold text-xl text-mk-danger">
        Something went wrong
      </p>
      <p class="text-sm text-mk-secondary mt-2">
        {{ errorMessage }}
      </p>
      <button
        class="mt-6 text-mk-accent font-semibold text-sm hover:underline"
        @click="findMatches"
      >
        Try again
      </button>
    </div>

    <!-- Zero results -->
    <div
      v-else-if="hasSearched && matches.length === 0"
      class="text-center py-16 bg-mk-raised border-2 border-dashed border-mk-border rounded-mk-lg"
    >
      <ChefHat
        class="mx-auto text-mk-muted mb-4"
        :size="48"
        aria-hidden="true"
      />
      <p class="font-display font-bold text-xl">
        No matches found
      </p>
      <p class="text-sm text-mk-secondary mt-1">
        Try adding more common ingredients — exact names like "Chicken" or "Rice" match best.
      </p>
    </div>

    <!-- Results -->
    <template v-else-if="matches.length > 0">
      <p
        v-if="failedIngredients.length"
        class="text-sm text-mk-danger font-semibold"
      >
        Could not check: {{ failedIngredients.join(', ') }}. Results may be incomplete.
      </p>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7"
        aria-label="Recipe matches"
      >
        <RecipeCard
          v-for="match in matches"
          :key="match.recipe.idMeal"
          :recipe-id="match.recipe.idMeal"
          :title="match.recipe.strMeal"
          :thumb="match.recipe.strMealThumb"
          :badge="matchBadgeLabel(match.score)"
          badge-variant="primary"
          @open="(id) => emit('open-recipe', id)"
        >
          <p class="text-xs text-mk-muted font-medium truncate">
            Uses: {{ match.matchedIngredients.join(', ') }}
          </p>
        </RecipeCard>
      </div>
    </template>
  </section>
</template>
