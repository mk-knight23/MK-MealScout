<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Recipe } from '@/types/recipe'
import { extractIngredients, lookupRecipe } from '@/utils/mealdb'
import { scaleMeasure } from '@/utils/scaling'
import { useGroceryStore } from '@/stores/groceryStore'
import {
  ExternalLink,
  Info,
  Minus,
  PlayCircle,
  Plus,
  ShoppingCart,
  X,
} from 'lucide-vue-next'

const props = defineProps<{ recipeId: string | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const grocery = useGroceryStore()

/** TheMealDB does not publish serving counts; 4 is an approximate baseline. */
const BASELINE_SERVINGS = 4
const MIN_SERVINGS = 1
const MAX_SERVINGS = 12

const recipe = ref<Recipe | null>(null)
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const servings = ref(BASELINE_SERVINGS)
const haveIngredient = ref<Record<string, boolean>>({})
const addedFeedback = ref(false)

const scaleFactor = computed(() => servings.value / BASELINE_SERVINGS)

const ingredients = computed(() => {
  if (!recipe.value) return []
  return extractIngredients(recipe.value).map(item => ({
    name: item.name,
    measure: item.measure,
    scaled: item.measure ? scaleMeasure(item.measure, scaleFactor.value).scaled : '',
  }))
})

const uncheckedCount = computed(
  () => ingredients.value.filter(item => !haveIngredient.value[item.name]).length
)

const sourceUrl = computed(() => (recipe.value?.strSource as string | undefined) || '')
const youtubeUrl = computed(() => recipe.value?.strYoutube || '')

watch(
  () => props.recipeId,
  async id => {
    recipe.value = null
    errorMessage.value = null
    servings.value = BASELINE_SERVINGS
    haveIngredient.value = {}
    addedFeedback.value = false
    if (!id) return
    loading.value = true
    try {
      const result = await lookupRecipe(id)
      if (result) {
        recipe.value = result
      } else {
        errorMessage.value = 'This recipe could not be found.'
      }
    } catch {
      errorMessage.value = 'Could not load this recipe. Check your connection and try again.'
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)

const adjustServings = (delta: number) => {
  const next = servings.value + delta
  if (next >= MIN_SERVINGS && next <= MAX_SERVINGS) servings.value = next
}

const toggleHave = (name: string) => {
  haveIngredient.value = { ...haveIngredient.value, [name]: !haveIngredient.value[name] }
}

const addUncheckedToGrocery = () => {
  if (!recipe.value) return
  const items = ingredients.value
    .filter(item => !haveIngredient.value[item.name])
    .map(item => ({
      name: item.name,
      qtyNote: item.scaled,
      recipeOrigin: recipe.value?.strMeal ?? '',
    }))
  if (items.length === 0) return
  grocery.addItems(items)
  addedFeedback.value = true
  setTimeout(() => {
    addedFeedback.value = false
  }, 2500)
}
</script>

<template>
  <div
    v-if="recipeId"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
    role="dialog"
    aria-modal="true"
    aria-label="Recipe details"
  >
    <div
      @click="emit('close')"
      class="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      aria-hidden="true"
    ></div>

    <div
      class="relative glass w-full max-w-5xl rounded-[3rem] overflow-hidden flex flex-col md:flex-row h-full max-h-[85vh]"
      role="document"
    >
      <button
        @click="emit('close')"
        class="absolute top-6 right-6 z-10 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl hover:scale-110 transition-transform"
        aria-label="Close recipe details"
      >
        <X :size="20" />
      </button>

      <!-- Loading -->
      <div v-if="loading" class="flex-1 flex flex-col items-center justify-center py-24" role="status">
        <div class="w-12 h-12 border-4 border-culinary-primary/20 border-t-culinary-primary rounded-full animate-spin"></div>
        <p class="mt-4 font-black uppercase tracking-widest text-slate-400 text-xs">Loading recipe...</p>
      </div>

      <!-- Error -->
      <div v-else-if="errorMessage" class="flex-1 flex flex-col items-center justify-center py-24 px-8 text-center" role="alert">
        <p class="font-display font-bold text-2xl text-red-600 dark:text-red-400">Something went wrong</p>
        <p class="text-sm text-slate-500 mt-2">{{ errorMessage }}</p>
        <button @click="emit('close')" class="mt-8 text-culinary-primary font-black uppercase tracking-widest text-xs">
          Close
        </button>
      </div>

      <template v-else-if="recipe">
        <!-- Image column -->
        <div class="w-full md:w-5/12 h-64 md:h-auto relative shrink-0">
          <img :src="recipe.strMealThumb" class="w-full h-full object-cover" alt="" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          <div class="absolute bottom-10 left-10 text-white space-y-2 pr-6">
            <div class="flex flex-wrap gap-2">
              <span class="px-3 py-1 bg-culinary-primary text-[10px] font-black uppercase rounded-lg">
                {{ recipe.strCategory || 'General' }}
              </span>
              <span class="px-3 py-1 bg-white/20 backdrop-blur-md text-[10px] font-black uppercase rounded-lg border border-white/10">
                {{ recipe.strArea || 'Global' }}
              </span>
            </div>
            <h2 class="text-4xl font-display font-black leading-tight">{{ recipe.strMeal }}</h2>
          </div>
        </div>

        <!-- Content column -->
        <div class="w-full md:w-7/12 p-8 md:p-12 overflow-y-auto custom-scrollbar space-y-8">
          <!-- Serving scaler -->
          <div class="flex flex-wrap items-center justify-between gap-4 bg-slate-100 dark:bg-slate-800 rounded-2xl px-5 py-4 border border-slate-200 dark:border-slate-700">
            <div>
              <p class="text-xs font-black uppercase tracking-widest text-slate-400">Servings</p>
              <p class="text-[11px] text-slate-400 font-medium mt-0.5">
                Approximate — scaled from a {{ BASELINE_SERVINGS }}-serving baseline
              </p>
            </div>
            <div class="flex items-center gap-3" role="group" aria-label="Adjust servings">
              <button
                @click="adjustServings(-1)"
                :disabled="servings <= MIN_SERVINGS"
                class="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:border-culinary-primary transition-colors"
                aria-label="Decrease servings"
              >
                <Minus :size="16" />
              </button>
              <span class="text-xl font-display font-black w-8 text-center" aria-live="polite">{{ servings }}</span>
              <button
                @click="adjustServings(1)"
                :disabled="servings >= MAX_SERVINGS"
                class="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:border-culinary-primary transition-colors"
                aria-label="Increase servings"
              >
                <Plus :size="16" />
              </button>
            </div>
          </div>

          <!-- Ingredients with checkboxes -->
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-3">
              <h4 class="text-xs font-black uppercase tracking-widest text-slate-400">
                Ingredients <span class="normal-case font-bold">(tick what you already have)</span>
              </h4>
            </div>
            <ul class="space-y-2">
              <li v-for="item in ingredients" :key="item.name">
                <label class="flex items-center gap-3 text-sm font-bold cursor-pointer group">
                  <input
                    type="checkbox"
                    :checked="!!haveIngredient[item.name]"
                    @change="toggleHave(item.name)"
                    class="w-4 h-4 rounded accent-[#f59e0b]"
                    :aria-label="`I already have ${item.name}`"
                  />
                  <span :class="{ 'line-through text-slate-400': haveIngredient[item.name] }">
                    <span v-if="item.scaled" class="text-culinary-primary">{{ item.scaled }}</span>
                    {{ item.name }}
                  </span>
                </label>
              </li>
            </ul>
            <button
              @click="addUncheckedToGrocery"
              :disabled="uncheckedCount === 0"
              class="w-full flex items-center justify-center gap-2 bg-culinary-primary hover:bg-culinary-secondary disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
            >
              <ShoppingCart :size="16" />
              <span v-if="addedFeedback">Added to grocery list</span>
              <span v-else>Add {{ uncheckedCount }} missing to grocery list</span>
            </button>
          </div>

          <!-- Links -->
          <div v-if="youtubeUrl || sourceUrl" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              v-if="youtubeUrl"
              :href="youtubeUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between group hover:border-culinary-primary transition-colors"
            >
              <span class="text-xs font-black uppercase">Watch tutorial</span>
              <PlayCircle class="text-culinary-primary group-hover:scale-110 transition-transform" />
            </a>
            <a
              v-if="sourceUrl"
              :href="sourceUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between group hover:border-culinary-primary transition-colors"
            >
              <span class="text-xs font-black uppercase">Original source</span>
              <ExternalLink :size="18" class="text-slate-400 group-hover:text-culinary-primary transition-colors" />
            </a>
          </div>

          <!-- Instructions -->
          <div class="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h4 class="text-xs font-black uppercase tracking-widest text-slate-400">Cooking Instructions</h4>
            <p class="text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-400 whitespace-pre-line">
              {{ recipe.strInstructions }}
            </p>
          </div>

          <!-- Disclaimers -->
          <div
            class="flex gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium"
          >
            <Info :size="16" class="text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong>Allergen notice:</strong> recipes may contain or come into contact with common
              allergens (nuts, dairy, gluten, eggs, shellfish and others). Always check every
              ingredient before cooking. Scaled quantities are approximate. No verified nutrition
              information is available for these recipes.
            </p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
