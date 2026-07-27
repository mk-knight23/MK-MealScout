<script setup lang="ts">
/**
 * Shared recipe card used by the discover grid and pantry cook-matches.
 * The whole card is one keyboard-operable button that opens the recipe.
 * Extra controls layered on the image (e.g. the favorite toggle) go in the
 * `overlay` slot and must stop click propagation themselves.
 */
const props = defineProps<{
  recipeId: string
  title: string
  thumb: string
  /** Optional text badge rendered bottom-left over the image. */
  badge?: string
  /** neutral = translucent black (category); primary = brand color (match score). */
  badgeVariant?: 'neutral' | 'primary'
}>()

const emit = defineEmits<{ (e: 'open', id: string): void }>()

const open = () => emit('open', props.recipeId)
</script>

<template>
  <article
    class="recipe-card group cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-culinary-primary"
    role="button"
    tabindex="0"
    :aria-label="`View recipe details for ${title}`"
    @click="open"
    @keydown.enter.prevent="open"
    @keydown.space.prevent="open"
  >
    <div class="relative aspect-video overflow-hidden">
      <img
        :src="thumb"
        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        :alt="title"
        loading="lazy"
      >
      <slot name="overlay" />
      <span
        v-if="badge"
        class="absolute bottom-4 left-4 px-3 py-1 text-white text-[10px] font-black uppercase tracking-widest rounded-lg"
        :class="
          badgeVariant === 'primary'
            ? 'bg-culinary-primary shadow-lg'
            : 'bg-black/50 backdrop-blur-md border border-white/10'
        "
      >
        {{ badge }}
      </span>
    </div>
    <div class="p-6 space-y-3">
      <h4
        class="text-xl font-display font-bold leading-tight group-hover:text-culinary-primary transition-colors"
      >
        {{ title }}
      </h4>
      <slot />
    </div>
  </article>
</template>
