import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

/**
 * MK theme engine (V3 "Warm Kitchen Editorial").
 *
 * Approved theme cut: signature light (default — light-first product),
 * signature dark ("evening kitchen") and high contrast, plus a `system`
 * mode that resolves to light/dark from the OS preference.
 *
 * Mechanism: the store stamps `data-theme`, `data-motion` and
 * `data-transparency` on <html>; all styling keys off those attributes via
 * the --mk- token layer in style.css. A tiny hashed inline script in
 * index.html stamps the same attributes before first paint (no flash) —
 * keep its logic in sync with `resolveTheme` below.
 */
export type ThemeMode = 'light' | 'dark' | 'hc' | 'system'
export type ResolvedTheme = 'light' | 'dark' | 'hc'
/** 'system' = follow the OS preference; 'reduced' = forced on in-app. */
export type A11yPref = 'system' | 'reduced'

export const THEME_STORAGE_KEY = 'mk.mealscout.theme.v1'
export const A11Y_STORAGE_KEY = 'mk.mealscout.a11y.v1'
/** Pre-V3 settings key: still owns non-theme prefs; theme value is migrated. */
const LEGACY_SETTINGS_KEY = 'culinara-settings'

/** Resolved --mk-bg-page per theme, mirrored into <meta name="theme-color">. */
const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#FAF6EF',
  dark: '#191411',
  hc: '#FFFFFF',
}

const THEME_MODES: ThemeMode[] = ['light', 'dark', 'hc', 'system']

interface LegacySettings {
  soundEnabled?: boolean
  theme?: string
}

interface A11ySettings {
  motion: A11yPref
  transparency: A11yPref
}

function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEME_MODES as string[]).includes(value)
}

function readLegacySettings(): LegacySettings {
  try {
    const stored = localStorage.getItem(LEGACY_SETTINGS_KEY)
    if (stored) return JSON.parse(stored) as LegacySettings
  } catch {
    // Storage unavailable (private mode) — fall through to defaults.
  }
  return {}
}

function loadThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemeMode(stored)) return stored
  } catch {
    // Storage unavailable — use the default below.
  }
  // Migrate a pre-V3 choice ('dark' | 'light' | 'system') once.
  const legacy = readLegacySettings().theme
  if (isThemeMode(legacy)) return legacy
  return 'light'
}

function loadA11ySettings(): A11ySettings {
  try {
    const stored = localStorage.getItem(A11Y_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<A11ySettings>
      return {
        motion: parsed.motion === 'reduced' ? 'reduced' : 'system',
        transparency: parsed.transparency === 'reduced' ? 'reduced' : 'system',
      }
    }
  } catch {
    // Storage unavailable — use defaults.
  }
  return { motion: 'system', transparency: 'system' }
}

function prefersMedia(query: string): boolean {
  try {
    return window.matchMedia(query).matches
  } catch {
    return false
  }
}

function onMediaChange(query: string, handler: () => void): void {
  try {
    window.matchMedia(query).addEventListener('change', handler)
  } catch {
    // matchMedia unsupported — preference simply won't live-update.
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const legacy = readLegacySettings()
  const a11ySaved = loadA11ySettings()

  const soundEnabled = ref(legacy.soundEnabled ?? true)
  const theme = ref<ThemeMode>(loadThemeMode())
  const motionPref = ref<A11yPref>(a11ySaved.motion)
  const transparencyPref = ref<A11yPref>(a11ySaved.transparency)
  const showHelp = ref(false)
  const resolvedTheme = ref<ResolvedTheme>('light')

  const isDarkMode = computed(() => resolvedTheme.value === 'dark')

  function resolveTheme(mode: ThemeMode): ResolvedTheme {
    if (mode === 'system') {
      return prefersMedia('(prefers-color-scheme: dark)') ? 'dark' : 'light'
    }
    return mode
  }

  function applyTheme(): void {
    const resolved = resolveTheme(theme.value)
    resolvedTheme.value = resolved
    document.documentElement.setAttribute('data-theme', resolved)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLORS[resolved])
  }

  function applyA11y(): void {
    const reducedMotion =
      motionPref.value === 'reduced' || prefersMedia('(prefers-reduced-motion: reduce)')
    const reducedTransparency =
      transparencyPref.value === 'reduced' ||
      prefersMedia('(prefers-reduced-transparency: reduce)')
    document.documentElement.setAttribute('data-motion', reducedMotion ? 'reduced' : 'full')
    document.documentElement.setAttribute(
      'data-transparency',
      reducedTransparency ? 'reduced' : 'normal'
    )
  }

  function setTheme(value: ThemeMode): void {
    theme.value = value
    applyTheme()
  }

  function setMotionPref(value: A11yPref): void {
    motionPref.value = value
    applyA11y()
  }

  function setTransparencyPref(value: A11yPref): void {
    transparencyPref.value = value
    applyA11y()
  }

  function toggleSound(): void {
    soundEnabled.value = !soundEnabled.value
  }

  function toggleHelp(): void {
    showHelp.value = !showHelp.value
  }

  function saveSettings(): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme.value)
      localStorage.setItem(
        A11Y_STORAGE_KEY,
        JSON.stringify({ motion: motionPref.value, transparency: transparencyPref.value })
      )
      localStorage.setItem(
        LEGACY_SETTINGS_KEY,
        JSON.stringify({ ...readLegacySettings(), soundEnabled: soundEnabled.value })
      )
    } catch {
      // Private mode: settings just won't persist.
    }
  }

  watch([soundEnabled, theme, motionPref, transparencyPref], () => {
    saveSettings()
  })

  if (typeof window !== 'undefined') {
    applyTheme()
    applyA11y()
    onMediaChange('(prefers-color-scheme: dark)', () => {
      if (theme.value === 'system') applyTheme()
    })
    onMediaChange('(prefers-reduced-motion: reduce)', applyA11y)
    onMediaChange('(prefers-reduced-transparency: reduce)', applyA11y)
    // Cross-tab sync: another tab changing the theme updates this one live.
    window.addEventListener('storage', (event) => {
      if (event.key === THEME_STORAGE_KEY && isThemeMode(event.newValue)) {
        theme.value = event.newValue
        applyTheme()
      }
    })
  }

  return {
    soundEnabled,
    theme,
    resolvedTheme,
    motionPref,
    transparencyPref,
    showHelp,
    isDarkMode,
    toggleSound,
    setTheme,
    setMotionPref,
    setTransparencyPref,
    toggleHelp,
    applyTheme,
  }
})
