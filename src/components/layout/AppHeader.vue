<script setup lang="ts">
import { computed, type FunctionalComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useRecipeStore } from '@/stores/recipeStore'
import { useSettingsStore, type ThemeMode } from '@/stores/settings'
import { usePantryStore } from '@/stores/pantryStore'
import { useGroceryStore } from '@/stores/groceryStore'
import { useAudio } from '@/composables/useAudio'
import { Compass, Contrast, Heart, Moon, Refrigerator, Settings, ShoppingCart, Sun } from 'lucide-vue-next'

const route = useRoute()
const store = useRecipeStore()
const settingsStore = useSettingsStore()
const pantryStore = usePantryStore()
const groceryStore = useGroceryStore()
const audio = useAudio()

interface NavItem {
  name: 'discover' | 'pantry' | 'grocery'
  to: string
  label: string
  icon: FunctionalComponent
}

const NAV_ITEMS: NavItem[] = [
  { name: 'discover', to: '/', label: 'Discover', icon: Compass },
  { name: 'pantry', to: '/pantry', label: 'Pantry', icon: Refrigerator },
  { name: 'grocery', to: '/grocery', label: 'Grocery', icon: ShoppingCart },
]

/** The recipe modal renders over the discover catalogue — keep Discover lit. */
const activeName = computed(() => (route.name === 'recipe' ? 'discover' : route.name))

/** Quick cycle through the three signature themes; full menu lives in settings. */
const NEXT_THEME: Record<string, ThemeMode> = { light: 'dark', dark: 'hc', hc: 'light' }
const NEXT_THEME_LABEL: Record<string, string> = {
  light: 'Switch to dark theme',
  dark: 'Switch to high contrast theme',
  hc: 'Switch to light theme',
}

const toggleTheme = () => {
  audio.playClick()
  settingsStore.setTheme(NEXT_THEME[settingsStore.resolvedTheme] ?? 'light')
}

const openSettings = () => {
  audio.playClick()
  settingsStore.toggleHelp()
}
</script>

<template>
  <header
    class="sticky top-0 z-40 mk-glass-nav border-b border-mk-border px-4 sm:px-6 py-3"
    role="banner"
  >
    <div class="max-w-[var(--mk-content-max)] mx-auto flex justify-between items-center gap-4">
      <h1 class="text-xl font-display font-bold whitespace-nowrap">
        MK MealScout<span
          class="text-mk-accent"
          aria-hidden="true"
        >.</span>
      </h1>

      <nav
        class="hidden md:flex items-center gap-1"
        aria-label="Main navigation"
      >
        <RouterLink
          v-for="item in NAV_ITEMS"
          :key="item.name"
          :to="item.to"
          class="px-4 py-1.5 rounded-mk-sm text-sm font-medium transition-colors"
          :class="
            activeName === item.name
              ? 'text-mk-ink shadow-[inset_0_-2px_0_var(--mk-accent)]'
              : 'text-mk-secondary hover:bg-mk-accent-soft hover:text-mk-ink'
          "
          :aria-current="activeName === item.name ? 'page' : undefined"
          @click="audio.playClick()"
        >
          {{ item.label }}
          <span
            v-if="item.name === 'pantry' && pantryStore.count > 0"
            class="ml-1 font-mono text-xs text-mk-muted tabular-nums"
          >{{ pantryStore.count }}</span>
          <span
            v-if="item.name === 'grocery' && groceryStore.remainingCount > 0"
            class="ml-1 font-mono text-xs text-mk-muted tabular-nums"
          >{{ groceryStore.remainingCount }}</span>
        </RouterLink>
      </nav>

      <div class="flex items-center gap-1.5 sm:gap-2">
        <button
          class="p-2.5 rounded-mk-sm text-mk-secondary hover:bg-mk-accent-soft hover:text-mk-ink transition-colors"
          aria-label="Open settings"
          @click="openSettings"
        >
          <Settings :size="20" />
        </button>
        <button
          class="p-2.5 rounded-mk-sm text-mk-secondary hover:bg-mk-accent-soft hover:text-mk-ink transition-colors"
          :aria-label="NEXT_THEME_LABEL[settingsStore.resolvedTheme] ?? 'Switch to light theme'"
          @click="toggleTheme"
        >
          <Sun
            v-if="settingsStore.resolvedTheme === 'light'"
            :size="20"
          />
          <Moon
            v-else-if="settingsStore.resolvedTheme === 'dark'"
            :size="20"
          />
          <Contrast
            v-else
            :size="20"
          />
        </button>
        <div
          class="hidden sm:flex items-center gap-2 bg-mk-raised border border-mk-border rounded-mk-sm px-3 py-1.5"
          role="status"
          :aria-label="`${store.favorites.length} saved recipes`"
        >
          <Heart
            class="text-mk-accent fill-mk-accent"
            :size="14"
            aria-hidden="true"
          />
          <span class="text-xs font-semibold text-mk-secondary font-mono tabular-nums">{{ store.favorites.length }} saved</span>
        </div>
      </div>
    </div>
    <nav
      class="md:hidden max-w-[var(--mk-content-max)] mx-auto flex items-center gap-1 pt-2.5"
      aria-label="Main navigation (mobile)"
    >
      <RouterLink
        v-for="item in NAV_ITEMS"
        :key="item.name"
        :to="item.to"
        class="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-mk-sm text-xs font-semibold transition-colors"
        :class="
          activeName === item.name
            ? 'bg-mk-accent-strong text-mk-on-accent'
            : 'text-mk-secondary bg-mk-raised border border-mk-border'
        "
        :aria-current="activeName === item.name ? 'page' : undefined"
        @click="audio.playClick()"
      >
        <component
          :is="item.icon"
          :size="14"
          aria-hidden="true"
        />
        {{ item.label }}
      </RouterLink>
    </nav>
  </header>
</template>
