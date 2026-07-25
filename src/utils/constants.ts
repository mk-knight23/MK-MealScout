export const STORAGE_KEYS = {
  SETTINGS: 'culinara-settings',
  STATS: 'culinara-stats',
} as const

// Every entry here must have a real handler in useKeyboardControls — no
// advertised-but-unhandled controls. ('/' also toggles help as an
// unadvertised alias of '?'.)
export const KEYBOARD_SHORTCUTS = [
  { key: 'Escape', action: 'Close Modal' },
  { key: 'H', action: 'Toggle Help' },
  { key: '?', action: 'Show Shortcuts' },
] as const
