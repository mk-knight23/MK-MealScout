import { config } from '@vue/test-utils'
import { cleanup } from '@testing-library/vue'
import { afterEach, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Setup Pinia: a fresh instance per test, installed BOTH as the active pinia
// (for stores used in test bodies) and as a global plugin (for stores used
// inside mounted components). A single module-level pinia here would leak
// component store state between tests.
beforeEach(() => {
  const pinia = createPinia()
  setActivePinia(pinia)
  config.global.plugins = [pinia]
})

afterEach(() => cleanup())
