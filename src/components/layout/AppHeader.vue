<script setup lang="ts">
import { computed, type FunctionalComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useRecipeStore } from '@/stores/recipeStore'
import { useSettingsStore } from '@/stores/settings'
import { usePantryStore } from '@/stores/pantryStore'
import { useGroceryStore } from '@/stores/groceryStore'
import { useAudio } from '@/composables/useAudio'
import {
  ChefHat,
  Compass,
  Heart,
  Moon,
  Refrigerator,
  Settings,
  ShoppingCart,
  Sun,
} from 'lucide-vue-next'

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

const toggleTheme = () => {
  audio.playClick()
  const nextTheme =
    settingsStore.theme === 'dark' ? 'light' : settingsStore.theme === 'light' ? 'system' : 'dark'
  settingsStore.setTheme(nextTheme)
}

const openSettings = () => {
  audio.playClick()
  settingsStore.toggleHelp()
}
</script>

<template>
  <header
    class="sticky top-0 z-40 glass border-b border-slate-200 dark:border-slate-800 px-6 py-4"
    role="banner"
  >
    <div class="max-w-7xl mx-auto flex justify-between items-center">
      <div class="flex items-center space-x-3">
        <div
          class="bg-culinary-primary p-2 rounded-2xl rotate-3 shadow-lg shadow-culinary-primary/20"
          aria-hidden="true"
        >
          <ChefHat
            class="text-white"
            :size="24"
          />
        </div>
        <h1 class="text-2xl font-display font-black tracking-tighter uppercase dark:text-white">
          MK_<span class="text-culinary-primary">MealScout</span>
        </h1>
      </div>

      <nav
        class="hidden md:flex items-center gap-1"
        aria-label="Main navigation"
      >
        <RouterLink
          v-for="item in NAV_ITEMS"
          :key="item.name"
          :to="item.to"
          class="px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
          :class="
            activeName === item.name
              ? 'bg-culinary-primary text-white shadow-lg shadow-culinary-primary/30'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          "
          :aria-current="activeName === item.name ? 'page' : undefined"
          @click="audio.playClick()"
        >
          {{ item.label }}
          <span
            v-if="item.name === 'pantry' && pantryStore.count > 0"
            class="ml-1 opacity-70"
          >{{ pantryStore.count }}</span>
          <span
            v-if="item.name === 'grocery' && groceryStore.remainingCount > 0"
            class="ml-1 opacity-70"
          >{{ groceryStore.remainingCount }}</span>
        </RouterLink>
      </nav>

      <div class="flex items-center space-x-4">
        <button
          class="p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open settings"
          @click="openSettings"
        >
          <Settings
            class="text-slate-600 dark:text-slate-300"
            :size="20"
          />
        </button>
        <button
          class="p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          :aria-label="settingsStore.isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleTheme"
        >
          <Sun
            v-if="settingsStore.isDarkMode"
            :size="20"
            class="text-amber-400"
          />
          <Moon
            v-else
            :size="20"
            class="text-blue-600"
          />
        </button>
        <div
          class="hidden sm:flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700"
          role="status"
          :aria-label="`${store.favorites.length} saved recipes`"
        >
          <Heart
            class="text-culinary-primary fill-culinary-primary"
            :size="16"
          />
          <span class="text-xs font-black uppercase tracking-widest">{{ store.favorites.length }} Saved</span>
        </div>
      </div>
    </div>
    <nav
      class="md:hidden max-w-7xl mx-auto flex items-center gap-1 pt-3"
      aria-label="Main navigation (mobile)"
    >
      <RouterLink
        v-for="item in NAV_ITEMS"
        :key="item.name"
        :to="item.to"
        class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
        :class="
          activeName === item.name
            ? 'bg-culinary-primary text-white'
            : 'text-slate-500 bg-slate-100 dark:bg-slate-800'
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
