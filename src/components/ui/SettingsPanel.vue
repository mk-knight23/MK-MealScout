<script setup lang="ts">
import { useSettingsStore, type ThemeMode } from '../../stores/settings'
import { useStatsStore } from '../../stores/stats'
import { useAudio } from '../../composables/useAudio'
import { useKeyboardControls } from '../../composables/useKeyboardControls'

const settingsStore = useSettingsStore()
const statsStore = useStatsStore()
const audio = useAudio()
const { getShortcuts } = useKeyboardControls()

const themeModes: { value: ThemeMode; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
]

function close() {
  audio.playClick()
  settingsStore.toggleHelp()
}

function onSetTheme(mode: ThemeMode) {
  audio.playClick()
  settingsStore.setTheme(mode)
}

function onToggleSound() {
  settingsStore.toggleSound()
  audio.playSuccess()
}

function onResetStats() {
  audio.playClick()
  if (confirm('Are you sure you want to reset all statistics?')) {
    statsStore.resetStats()
    audio.playSuccess()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="settingsStore.showHelp"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      @click="close"
    >
      <div
        class="bg-white dark:bg-culinary-dark rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <div class="p-8">
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-2xl font-display font-black dark:text-white">Settings</h2>
            <button
              @click="close"
              class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span class="text-xl dark:text-white">✕</span>
            </button>
          </div>

          <div class="space-y-6">
            <div class="space-y-3">
              <h3 class="text-sm font-semibold text-slate-500 dark:text-slate-400">Theme</h3>
              <div class="flex gap-2">
                <button
                  v-for="mode in themeModes"
                  :key="mode.value"
                  @click="onSetTheme(mode.value)"
                  :class="
                    settingsStore.theme === mode.value
                      ? 'bg-culinary-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  "
                  class="flex-1 px-3 py-2 rounded-xl font-medium transition-all"
                >
                  {{ mode.label }}
                </button>
              </div>
            </div>

            <div class="space-y-3">
              <h3 class="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Sound Effects
              </h3>
              <button
                @click="onToggleSound"
                class="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl"
              >
                <span class="font-medium dark:text-white">Enable Sound</span>
                <span
                  :class="settingsStore.soundEnabled ? 'text-culinary-accent' : 'text-slate-400'"
                >
                  {{ settingsStore.soundEnabled ? '✓ Enabled' : '✕ Disabled' }}
                </span>
              </button>
            </div>

            <div class="space-y-3">
              <h3 class="text-sm font-semibold text-slate-500 dark:text-slate-400">Statistics</h3>
              <div class="grid grid-cols-2 gap-3">
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center">
                  <div class="text-2xl font-black text-culinary-primary">
                    {{ statsStore.totalSearches }}
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">Searches</div>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center">
                  <div class="text-2xl font-black text-culinary-secondary">
                    {{ statsStore.totalRecipesViewed }}
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">Recipes Viewed</div>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center">
                  <div class="text-2xl font-black text-culinary-primary">
                    {{ statsStore.formatTime() }}
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">Time Spent</div>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center">
                  <div class="text-2xl font-black text-culinary-secondary">
                    {{ statsStore.totalFavorites }}
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">Favorites</div>
                </div>
              </div>
              <button
                @click="onResetStats"
                class="w-full p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium"
              >
                Reset Statistics
              </button>
            </div>

            <div class="space-y-3">
              <h3 class="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Keyboard Shortcuts
              </h3>
              <div class="space-y-2">
                <div
                  v-for="shortcut in getShortcuts()"
                  :key="shortcut.key"
                  class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                >
                  <span class="dark:text-white">{{ shortcut.action }}</span>
                  <kbd
                    class="px-3 py-1 text-sm font-mono bg-slate-200 dark:bg-slate-700 rounded-lg dark:text-white"
                    >{{ shortcut.key }}</kbd
                  >
                </div>
              </div>
            </div>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p class="text-center text-sm text-slate-500 dark:text-slate-400">
              MK MealScoutAI v1.0.0 • Built with Vue 3 + Pinia
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
