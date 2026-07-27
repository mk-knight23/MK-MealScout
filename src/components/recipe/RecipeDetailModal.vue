<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Recipe } from '@/types/recipe'
import { extractIngredients, lookupRecipe } from '@/utils/mealdb'
import { scaleMeasure } from '@/utils/scaling'
import { safeExternalUrl } from '@/utils/url'
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

// MS-S2: upstream URLs pass a scheme allowlist (http/https only); anything
// else yields '' and the corresponding link is not rendered.
const sourceUrl = computed(() => safeExternalUrl(recipe.value?.strSource))
const youtubeUrl = computed(() => safeExternalUrl(recipe.value?.strYoutube))

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
    <!-- Modal scrim: sanctioned glass surface (overlay blur tier, solid-ish
         fallback via tokens under hc / reduced transparency). -->
    <div
      class="absolute inset-0 mk-scrim"
      aria-hidden="true"
      @click="emit('close')"
    />

    <div
      class="relative bg-mk-raised border border-mk-border-strong w-full max-w-5xl rounded-mk-lg overflow-hidden flex flex-col md:flex-row h-full max-h-[85vh] shadow-e2"
      role="document"
    >
      <button
        class="absolute top-4 right-4 z-10 p-3 bg-mk-raised border border-mk-border rounded-mk-sm shadow-e1 text-mk-secondary hover:text-mk-ink hover:border-mk-border-strong transition-colors"
        aria-label="Close recipe details"
        @click="emit('close')"
      >
        <X :size="20" />
      </button>

      <!-- Loading -->
      <div
        v-if="loading"
        class="flex-1 flex flex-col items-center justify-center py-24"
        role="status"
      >
        <div
          class="w-12 h-12 border-4 border-mk-accent-soft border-t-mk-accent rounded-full animate-spin"
          aria-hidden="true"
        />
        <p class="mt-4 text-sm font-semibold text-mk-muted">
          Loading recipe…
        </p>
      </div>

      <!-- Error -->
      <div
        v-else-if="errorMessage"
        class="flex-1 flex flex-col items-center justify-center py-24 px-8 text-center"
        role="alert"
      >
        <p class="font-display font-bold text-2xl text-mk-danger">
          Something went wrong
        </p>
        <p class="text-sm text-mk-secondary mt-2">
          {{ errorMessage }}
        </p>
        <button
          class="mt-8 text-mk-accent font-semibold text-sm hover:underline"
          @click="emit('close')"
        >
          Close
        </button>
      </div>

      <template v-else-if="recipe">
        <!-- Image column: the photo is the background moment, under a solid
             warm scrim for text (photography does the decorating). -->
        <div class="w-full md:w-5/12 h-64 md:h-auto relative shrink-0">
          <img
            :src="recipe.strMealThumb"
            class="w-full h-full object-cover"
            alt=""
          >
          <div
            class="absolute inset-0 bg-gradient-to-t from-[rgba(20,11,4,0.72)] via-transparent to-transparent"
            aria-hidden="true"
          />
          <div class="absolute bottom-8 left-8 text-[#FFF7EC] space-y-2 pr-6">
            <div class="flex flex-wrap gap-2">
              <span class="px-2.5 py-0.5 bg-mk-accent-strong text-mk-on-accent text-xs font-semibold rounded-mk-xs">
                {{ recipe.strCategory || 'General' }}
              </span>
              <span class="px-2.5 py-0.5 bg-[rgba(20,11,4,0.65)] text-[#FFF7EC] text-xs font-mono rounded-mk-xs">
                {{ recipe.strArea || 'Global' }}
              </span>
            </div>
            <h2 class="text-3xl md:text-4xl font-display font-black leading-tight">
              {{ recipe.strMeal }}
            </h2>
          </div>
        </div>

        <!-- Content column -->
        <div class="w-full md:w-7/12 p-6 md:p-10 overflow-y-auto space-y-8">
          <!-- Serving scaler -->
          <div class="flex flex-wrap items-center justify-between gap-4 bg-mk-sunken rounded-mk-md px-5 py-4 border border-mk-border">
            <div>
              <p class="text-sm font-semibold text-mk-ink">
                Servings
              </p>
              <p class="text-xs text-mk-muted font-medium mt-0.5">
                Approximate — scaled from a {{ BASELINE_SERVINGS }}-serving baseline
              </p>
            </div>
            <div
              class="flex items-center gap-3"
              role="group"
              aria-label="Adjust servings"
            >
              <button
                :disabled="servings <= MIN_SERVINGS"
                class="p-2 rounded-mk-sm bg-mk-raised border border-mk-border disabled:opacity-30 hover:border-mk-border-strong transition-colors"
                aria-label="Decrease servings"
                @click="adjustServings(-1)"
              >
                <Minus :size="16" />
              </button>
              <span
                class="text-xl font-mono font-medium w-8 text-center tabular-nums"
                aria-live="polite"
              >{{ servings }}</span>
              <button
                :disabled="servings >= MAX_SERVINGS"
                class="p-2 rounded-mk-sm bg-mk-raised border border-mk-border disabled:opacity-30 hover:border-mk-border-strong transition-colors"
                aria-label="Increase servings"
                @click="adjustServings(1)"
              >
                <Plus :size="16" />
              </button>
            </div>
          </div>

          <!-- Ingredients with checkboxes -->
          <div class="space-y-4">
            <h4 class="font-display font-bold text-lg">
              Ingredients <span class="font-sans font-medium text-sm text-mk-muted">(tick what you already have)</span>
            </h4>
            <ul class="space-y-2">
              <li
                v-for="item in ingredients"
                :key="item.name"
              >
                <label class="flex items-center gap-3 text-[0.9375rem] font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="!!haveIngredient[item.name]"
                    class="w-4 h-4 rounded accent-mk-accent"
                    :aria-label="`I already have ${item.name}`"
                    @change="toggleHave(item.name)"
                  >
                  <span :class="haveIngredient[item.name] ? 'line-through text-mk-muted' : 'text-mk-ink'">
                    <span
                      v-if="item.scaled"
                      class="text-mk-accent font-semibold"
                    >{{ item.scaled }}</span>
                    {{ item.name }}
                  </span>
                </label>
              </li>
            </ul>
            <button
              :disabled="uncheckedCount === 0"
              class="w-full flex items-center justify-center gap-2 bg-mk-accent-strong text-mk-on-accent disabled:opacity-40 disabled:cursor-not-allowed px-6 py-3 rounded-mk-sm font-semibold text-sm border border-transparent hover:border-mk-ring transition-colors"
              @click="addUncheckedToGrocery"
            >
              <ShoppingCart
                :size="16"
                aria-hidden="true"
              />
              <span v-if="addedFeedback">Added to grocery list</span>
              <span v-else>Add {{ uncheckedCount }} missing to grocery list</span>
            </button>
          </div>

          <!-- Links -->
          <div
            v-if="youtubeUrl || sourceUrl"
            class="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <a
              v-if="youtubeUrl"
              :href="youtubeUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="p-4 bg-mk-sunken rounded-mk-md border border-mk-border flex items-center justify-between hover:border-mk-border-strong transition-colors"
            >
              <span class="text-sm font-semibold">Watch tutorial</span>
              <PlayCircle
                class="text-mk-accent"
                aria-hidden="true"
              />
            </a>
            <a
              v-if="sourceUrl"
              :href="sourceUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="p-4 bg-mk-sunken rounded-mk-md border border-mk-border flex items-center justify-between hover:border-mk-border-strong transition-colors"
            >
              <span class="text-sm font-semibold">Original source</span>
              <ExternalLink
                :size="18"
                class="text-mk-secondary"
                aria-hidden="true"
              />
            </a>
          </div>

          <!-- Instructions: long-form reading surface — primary ink, 16px/1.7 -->
          <div class="space-y-4 pt-6 border-t border-mk-border">
            <h4 class="font-display font-bold text-lg">
              Cooking instructions
            </h4>
            <p class="text-base leading-7 text-mk-ink whitespace-pre-line">
              {{ recipe.strInstructions }}
            </p>
          </div>

          <!-- Disclaimers -->
          <div
            class="flex gap-3 p-4 bg-mk-accent-soft border border-mk-border rounded-mk-md text-xs leading-relaxed text-mk-secondary font-medium"
          >
            <Info
              :size="16"
              class="text-mk-accent shrink-0 mt-0.5"
              aria-hidden="true"
            />
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
