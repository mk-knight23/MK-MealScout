<script setup lang="ts">
import { ChefHat } from 'lucide-vue-next'
</script>

<template>
  <div
    class="text-center py-24 glass rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800"
  >
    <ChefHat
      class="mx-auto text-slate-300 mb-6"
      :size="64"
      aria-hidden="true"
    />
    <h2 class="text-4xl font-display font-black">
      404 — Page not found
    </h2>
    <p class="text-slate-500 mt-3">
      That page doesn't exist (yet). Head back to the kitchen.
    </p>
    <RouterLink
      to="/"
      class="inline-block mt-8 bg-culinary-primary hover:bg-culinary-secondary text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
    >
      Back to Discover
    </RouterLink>
  </div>
</template>
