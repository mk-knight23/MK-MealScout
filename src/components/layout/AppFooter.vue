<script setup lang="ts">
import { ChefHat } from 'lucide-vue-next'
</script>

<template>
  <footer
    class="mt-48 pb-12 border-t border-slate-200 dark:border-slate-800 pt-20"
    role="contentinfo"
  >
    <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
      <div class="space-y-6">
        <div class="flex items-center space-x-2">
          <ChefHat
            class="text-culinary-primary"
            :size="20"
          />
          <span class="font-display font-bold text-xl tracking-tighter">MK MealScout</span>
        </div>
        <p class="text-slate-500 text-sm leading-relaxed">
          The ultimate workspace for culinary exploration and pantry-first cooking.
        </p>
      </div>
      <div>
        <h4 class="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
          Discover
        </h4>
        <ul class="space-y-4 text-sm font-bold text-slate-500">
          <li>Trending Recipes</li>
          <li>Global Cuisines</li>
          <li>Healthy Options</li>
        </ul>
      </div>
      <div>
        <h4 class="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
          Platform
        </h4>
        <ul class="space-y-4 text-sm font-bold text-slate-500">
          <li>Saved Collections</li>
          <li>Pantry Matching</li>
          <li>Grocery Lists</li>
        </ul>
      </div>
    </div>
    <div
      class="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6"
    >
      <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        © 2026 <a
          href="https://www.mkazi.live"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-culinary-primary transition-colors underline"
        >Kazi Musharraf</a>. All rights reserved.
      </p>
      <div class="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <a
          href="https://github.com/mk-knight23/MK-MealScout"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-culinary-primary transition-colors"
        >GitHub</a>
        <span>No data collected</span>
        <span>Free &amp; open-source</span>
      </div>
    </div>
  </footer>
</template>
