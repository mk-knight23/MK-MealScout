import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeMode = 'dark' | 'light' | 'system'

// Note: a `reducedMotion` flag used to live here but had no UI toggle and no
// consumer (placebo state). Reduced motion is now honoured for real via the
// prefers-reduced-motion media query in style.css.
interface Settings {
  soundEnabled: boolean
  theme: ThemeMode
  showHelp: boolean
}

const STORAGE_KEY = 'culinara-settings'

const defaultSettings: Settings = {
  soundEnabled: true,
  theme: 'dark',
  showHelp: false,
}

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch {
    // Silently handle error
  }
  return defaultSettings
}

export const useSettingsStore = defineStore('settings', () => {
  const savedSettings = loadSettings()
  const soundEnabled = ref(savedSettings.soundEnabled)
  const theme = ref<ThemeMode>(savedSettings.theme)
  const showHelp = ref(defaultSettings.showHelp)
  const isDarkMode = ref(true)

  function applyTheme(): void {
    const mode = theme.value
    const isDark =
      mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    isDarkMode.value = isDark

    if (isDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }

  function toggleSound(): void {
    soundEnabled.value = !soundEnabled.value
  }

  function setTheme(value: ThemeMode): void {
    theme.value = value
    applyTheme()
  }

  function toggleHelp(): void {
    showHelp.value = !showHelp.value
  }

  function saveSettings(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          soundEnabled: soundEnabled.value,
          theme: theme.value,
        })
      )
    } catch {
      // Silently handle error
    }
  }

  watch([soundEnabled, theme], () => {
    saveSettings()
  })

  if (typeof window !== 'undefined') {
    applyTheme()
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme)
  }

  return {
    soundEnabled,
    theme,
    showHelp,
    isDarkMode,
    toggleSound,
    setTheme,
    toggleHelp,
    applyTheme,
  }
})
