import { config } from '@vue/test-utils'
import { cleanup } from '@testing-library/vue'
import { afterEach, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// Mock localStorage: under Node 26 + vitest/jsdom, Node's experimental bare
// `localStorage` global shadows jsdom's with `undefined` (ARCHITECTURE_DEBT
// D8). Storage-dependent code (stores, storage service) needs a real one.
class LocalStorageMock implements Storage {
  private data = new Map<string, string>()

  get length(): number {
    return this.data.size
  }

  clear(): void {
    this.data.clear()
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  setItem(key: string, value: string): void {
    this.data.set(key, String(value))
  }
}

Object.defineProperty(window, 'localStorage', {
  value: new LocalStorageMock(),
  writable: true,
  configurable: true,
})

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
  window.localStorage.clear()
  const pinia = createPinia()
  setActivePinia(pinia)
  config.global.plugins = [pinia]
})

afterEach(() => cleanup())
