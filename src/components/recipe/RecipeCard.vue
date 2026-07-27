<script setup lang="ts">
/**
 * Shared recipe card used by the discover grid and pantry cook-matches.
 * V3 "Warm Kitchen Editorial": photography sits on a solid raised card
 * (glass is reserved for the sticky nav and modal chrome). Hover changes
 * elevation + border only — no image zoom, no lift.
 *
 * The whole card is one keyboard-operable button that opens the recipe;
 * the global :focus-visible ring provides the focus treatment. Extra
 * controls layered on the image (e.g. the favorite toggle) go in the
 * `overlay` slot and must stop click propagation themselves.
 */
const props = defineProps<{
  recipeId: string
  title: string
  thumb: string
  /** Optional text badge rendered bottom-left over the image. */
  badge?: string
  /** neutral = translucent ink (category); primary = herb green (match score). */
  badgeVariant?: 'neutral' | 'primary'
}>()

const emit = defineEmits<{ (e: 'open', id: string): void }>()

const open = () => emit('open', props.recipeId)
</script>

<template>
  <article
    class="group cursor-pointer bg-mk-raised border border-mk-border rounded-mk-md shadow-e1 overflow-hidden flex flex-col transition-[box-shadow,border-color] hover:shadow-e2 hover:border-mk-border-strong"
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
        class="w-full h-full object-cover"
        :alt="title"
        loading="lazy"
      >
      <slot name="overlay" />
      <span
        v-if="badge"
        class="absolute bottom-3 left-3 px-2.5 py-0.5 text-xs font-semibold rounded-mk-xs"
        :class="
          badgeVariant === 'primary'
            ? 'bg-mk-raised text-mk-herb border border-mk-herb'
            : 'bg-[rgba(20,11,4,0.65)] text-[#FFF7EC] font-mono'
        "
      >
        {{ badge }}
      </span>
    </div>
    <div class="p-5 space-y-2.5 flex-1 flex flex-col">
      <h4 class="text-xl font-display font-bold leading-tight group-hover:text-mk-accent transition-colors">
        {{ title }}
      </h4>
      <slot />
    </div>
  </article>
</template>
