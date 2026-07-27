<script setup lang="ts">
// V3: the decorative link lists ("Trending Recipes", "Global Cuisines", …)
// were dead affordances — <li>s styled as navigation with no hrefs. Removed
// per the design-system truthfulness rule; only real links remain.
</script>

<template>
  <footer
    class="mt-24 border-t border-mk-border"
    role="contentinfo"
  >
    <div
      class="max-w-[var(--mk-content-max)] mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
    >
      <div class="space-y-2">
        <p class="font-display font-bold text-lg">
          MK MealScout<span
            class="text-mk-accent"
            aria-hidden="true"
          >.</span>
        </p>
        <p class="text-sm text-mk-muted max-w-sm">
          Pantry-first recipe finder. Your pantry, grocery list and favorites are stored in this
          browser — nothing is sent anywhere.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-mk-muted">
        <a
          href="https://github.com/mk-knight23/MK-MealScout"
          target="_blank"
          rel="noopener noreferrer"
          class="font-semibold text-mk-secondary hover:text-mk-accent transition-colors"
        >GitHub</a>
        <span>Free &amp; open-source</span>
        <span>No data collected</span>
        <span>© 2026
          <a
            href="https://www.mkazi.live"
            target="_blank"
            rel="noopener noreferrer"
            class="font-semibold text-mk-secondary hover:text-mk-accent transition-colors underline"
          >Kazi Musharraf</a>
        </span>
      </div>
    </div>
  </footer>
</template>
