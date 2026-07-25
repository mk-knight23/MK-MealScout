import { ref, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { KEYBOARD_SHORTCUTS } from '../utils/constants'

type KeyAction = 'close' | 'help' | 'none'

/**
 * True when the event originated from a field the user is typing into
 * (input, textarea, select or contenteditable). Used to stop single-key
 * shortcuts such as `?` or `/` from firing — and being swallowed — while the
 * user is typing, e.g. in the recipe search box.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const el = target.closest('input, textarea, select, [contenteditable]')
  if (!el) return false
  return el.getAttribute('contenteditable') !== 'false'
}

export function useKeyboardControls() {
  const settingsStore = useSettingsStore()
  const lastAction = ref<KeyAction>('none')

  // Keyed by KeyboardEvent.key (single characters normalised to lowercase).
  // Only shortcuts with real handlers live here — save/search were advertised
  // but never handled anywhere, so they were removed rather than faked.
  const actionMap: Record<string, KeyAction> = {
    Escape: 'close',
    h: 'help',
    '/': 'help',
    '?': 'help',
  }

  function handleKeyDown(e: KeyboardEvent): void {
    // Never hijack keys while the user is typing in a field. Escape is allowed
    // through so it can still close an open modal from within an input.
    if (e.key !== 'Escape' && isEditableTarget(e.target)) return

    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
    const action = actionMap[key] || 'none'

    if (action === 'close' && settingsStore.showHelp) {
      e.preventDefault()
      settingsStore.toggleHelp()
      lastAction.value = action
      return
    }

    if (action === 'help' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      settingsStore.toggleHelp()
      lastAction.value = action
      return
    }

    if (action !== 'none') {
      lastAction.value = action
    }

    setTimeout(() => {
      lastAction.value = 'none'
    }, 100)
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  function getShortcuts() {
    return KEYBOARD_SHORTCUTS
  }

  return {
    lastAction,
    getShortcuts,
  }
}
