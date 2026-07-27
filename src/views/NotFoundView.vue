<script setup lang="ts">
import { ChefHat } from 'lucide-vue-next'
</script>

<template>
  <div class="text-center py-24 bg-mk-raised border-2 border-dashed border-mk-border rounded-mk-lg">
    <ChefHat
      class="mx-auto text-mk-muted mb-6"
      :size="64"
      aria-hidden="true"
    />
    <h2 class="text-4xl font-display font-black">
      404 — Page not found
    </h2>
    <p class="text-mk-secondary mt-3">
      That page doesn't exist (yet). Head back to the kitchen.
    </p>
    <RouterLink
      to="/"
      class="inline-block mt-8 bg-mk-accent-strong text-mk-on-accent px-6 py-3 rounded-mk-sm font-semibold text-sm border border-transparent hover:border-mk-ring transition-colors"
    >
      Back to Discover
    </RouterLink>
  </div>
</template>
