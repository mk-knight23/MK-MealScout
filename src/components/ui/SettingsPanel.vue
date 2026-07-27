<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useSettingsStore, type ThemeMode } from '../../stores/settings'
import { useStatsStore } from '../../stores/stats'
import { useAudio } from '../../composables/useAudio'
// Import the shortcut list directly — calling useKeyboardControls() here would
// register a second global keydown listener whose toggleHelp cancels App's.
import { KEYBOARD_SHORTCUTS } from '../../utils/constants'

const settingsStore = useSettingsStore()
const statsStore = useStatsStore()
const audio = useAudio()

const dialogRef = ref<HTMLElement | null>(null)
const closeButtonRef = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

function getFocusableElements(): HTMLElement[] {
  if (!dialogRef.value) return []
  const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  return Array.from(dialogRef.value.querySelectorAll<HTMLElement>(selector)).filter(
    el => !el.hasAttribute('disabled')
  )
}

/** Keep Tab focus cycling inside the dialog while it is open. */
function trapFocus(event: KeyboardEvent): void {
  if (event.key !== 'Tab') return
  const focusable = getFocusableElements()
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (!first || !last) return
  const active = document.activeElement
  const outside = !dialogRef.value?.contains(active)
  if (event.shiftKey) {
    if (active === first || outside) {
      event.preventDefault()
      last.focus()
    }
  } else if (active === last || outside) {
    event.preventDefault()
    first.focus()
  }
}

// Focus management: move focus into the dialog on open, restore it on close.
watch(
  () => settingsStore.showHelp,
  async open => {
    if (open) {
      previouslyFocused = document.activeElement as HTMLElement | null
      await nextTick()
      closeButtonRef.value?.focus()
    } else if (previouslyFocused) {
      previouslyFocused.focus()
      previouslyFocused = null
    }
  }
)

/** Approved V3 theme cut: signature light/dark + high contrast (+ system). */
const themeModes: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'hc', label: 'High contrast' },
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

function onToggleMotion() {
  audio.playClick()
  settingsStore.setMotionPref(settingsStore.motionPref === 'reduced' ? 'system' : 'reduced')
}

function onToggleTransparency() {
  audio.playClick()
  settingsStore.setTransparencyPref(
    settingsStore.transparencyPref === 'reduced' ? 'system' : 'reduced'
  )
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
      class="fixed inset-0 z-50 flex items-center justify-center p-4 mk-scrim"
      @click="close"
    >
      <div
        ref="dialogRef"
        class="bg-mk-raised border border-mk-border-strong rounded-mk-lg shadow-e2 max-w-md w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        @click.stop
        @keydown="trapFocus"
      >
        <div class="p-6 sm:p-8">
          <div class="flex justify-between items-center mb-8">
            <h2
              id="settings-title"
              class="text-2xl font-display font-bold"
            >
              Settings
            </h2>
            <button
              ref="closeButtonRef"
              class="p-2 rounded-mk-sm text-mk-secondary hover:bg-mk-accent-soft hover:text-mk-ink transition-colors"
              aria-label="Close settings"
              @click="close"
            >
              <span
                class="text-xl"
                aria-hidden="true"
              >✕</span>
            </button>
          </div>

          <div class="space-y-6">
            <div class="space-y-3">
              <h3 class="text-sm font-semibold text-mk-secondary">
                Theme
              </h3>
              <div
                class="grid grid-cols-2 gap-2"
                role="group"
                aria-label="Theme"
              >
                <button
                  v-for="mode in themeModes"
                  :key="mode.value"
                  :class="
                    settingsStore.theme === mode.value
                      ? 'bg-mk-accent-soft text-mk-ink shadow-[inset_0_-2px_0_var(--mk-accent)] border-mk-border-strong'
                      : 'bg-mk-raised text-mk-secondary border-mk-border hover:border-mk-border-strong hover:text-mk-ink'
                  "
                  class="px-3 py-2 rounded-mk-sm border font-medium text-sm transition-colors"
                  :aria-pressed="settingsStore.theme === mode.value"
                  @click="onSetTheme(mode.value)"
                >
                  {{ mode.label }}
                </button>
              </div>
            </div>

            <div class="space-y-3">
              <h3 class="text-sm font-semibold text-mk-secondary">
                Accessibility
              </h3>
              <button
                class="w-full flex items-center justify-between p-4 bg-mk-sunken border border-mk-border rounded-mk-md transition-colors hover:border-mk-border-strong"
                :aria-pressed="settingsStore.motionPref === 'reduced'"
                @click="onToggleMotion"
              >
                <span class="font-medium text-sm">Reduce motion</span>
                <span
                  class="text-sm font-semibold"
                  :class="settingsStore.motionPref === 'reduced' ? 'text-mk-herb' : 'text-mk-muted'"
                >
                  {{ settingsStore.motionPref === 'reduced' ? 'On' : 'Follows system' }}
                </span>
              </button>
              <button
                class="w-full flex items-center justify-between p-4 bg-mk-sunken border border-mk-border rounded-mk-md transition-colors hover:border-mk-border-strong"
                :aria-pressed="settingsStore.transparencyPref === 'reduced'"
                @click="onToggleTransparency"
              >
                <span class="font-medium text-sm">Reduce transparency</span>
                <span
                  class="text-sm font-semibold"
                  :class="settingsStore.transparencyPref === 'reduced' ? 'text-mk-herb' : 'text-mk-muted'"
                >
                  {{ settingsStore.transparencyPref === 'reduced' ? 'On' : 'Follows system' }}
                </span>
              </button>
            </div>

            <div class="space-y-3">
              <h3 class="text-sm font-semibold text-mk-secondary">
                Sound Effects
              </h3>
              <button
                class="w-full flex items-center justify-between p-4 bg-mk-sunken border border-mk-border rounded-mk-md transition-colors hover:border-mk-border-strong"
                :aria-pressed="settingsStore.soundEnabled"
                @click="onToggleSound"
              >
                <span class="font-medium text-sm">Enable Sound</span>
                <span
                  class="text-sm font-semibold"
                  :class="settingsStore.soundEnabled ? 'text-mk-herb' : 'text-mk-muted'"
                >
                  {{ settingsStore.soundEnabled ? '✓ Enabled' : '✕ Disabled' }}
                </span>
              </button>
            </div>

            <div class="space-y-3">
              <h3 class="text-sm font-semibold text-mk-secondary">
                Statistics
              </h3>
              <div class="grid grid-cols-2 gap-3">
                <div class="p-4 bg-mk-sunken border border-mk-border rounded-mk-md text-center">
                  <div class="text-2xl font-mono font-medium text-mk-accent tabular-nums">
                    {{ statsStore.totalSearches }}
                  </div>
                  <div class="text-xs text-mk-muted">
                    Searches
                  </div>
                </div>
                <div class="p-4 bg-mk-sunken border border-mk-border rounded-mk-md text-center">
                  <div class="text-2xl font-mono font-medium text-mk-accent tabular-nums">
                    {{ statsStore.totalRecipesViewed }}
                  </div>
                  <div class="text-xs text-mk-muted">
                    Recipes Viewed
                  </div>
                </div>
              </div>
              <button
                class="w-full p-3 text-mk-danger hover:bg-mk-danger-soft rounded-mk-sm transition-colors font-medium text-sm"
                @click="onResetStats"
              >
                Reset Statistics
              </button>
            </div>

            <div class="space-y-3">
              <h3 class="text-sm font-semibold text-mk-secondary">
                Keyboard Shortcuts
              </h3>
              <div class="space-y-2">
                <div
                  v-for="shortcut in KEYBOARD_SHORTCUTS"
                  :key="shortcut.key"
                  class="flex items-center justify-between p-3 bg-mk-sunken border border-mk-border rounded-mk-sm"
                >
                  <span class="text-sm">{{ shortcut.action }}</span>
                  <kbd
                    class="px-3 py-1 text-sm font-mono bg-mk-raised border border-mk-border rounded-mk-xs"
                  >{{ shortcut.key }}</kbd>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-8 pt-6 border-t border-mk-border">
            <p class="text-center text-sm text-mk-muted">
              MK MealScout — built with Vue 3 + Pinia. Data stays in this browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
