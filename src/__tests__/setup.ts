import { config } from '@vue/test-utils'
import { cleanup } from '@testing-library/vue'
import { afterEach, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Setup Pinia
const pinia = createPinia()
setActivePinia(pinia)
config.global.plugins = [pinia]

beforeEach(() => {
  setActivePinia(createPinia())
})

afterEach(() => cleanup())

