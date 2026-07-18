import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/vue'
import '@testing-library/jest-dom'
import { createPinia, setActivePinia } from 'pinia'
import App from './App.vue'

// Mock fetch
const mockFetch = vi.fn()
Object.defineProperty(globalThis, 'fetch', {
  value: mockFetch,
  writable: true,
})

describe('MK MealScout Recipe Finder', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(App)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders header with correct elements', () => {
    render(App)
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getAllByText(/MK MealScout/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Open settings/i })).toBeInTheDocument()
  })

  it('renders hero section', () => {
    render(App)
    expect(screen.getByText(/Discover Your Next/i)).toBeInTheDocument()
    expect(screen.getByText(/Masterpiece/i)).toBeInTheDocument()
  })

  it('renders search input and button', () => {
    render(App)
    expect(screen.getByRole('textbox', { name: /Search recipes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Search$/i })).toBeInTheDocument()
  })

  it('has proper ARIA labels for accessibility', () => {
    render(App)
    expect(screen.getByRole('application', { name: /MK MealScout Recipe Finder/i })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('renders theme toggle button', () => {
    render(App)
    const themeButton = screen.getByRole('button', { name: /Switch to/i })
    expect(themeButton).toBeInTheDocument()
  })

  it('renders favorites counter', () => {
    render(App)
    expect(screen.getByRole('status', { name: /saved recipes/i })).toBeInTheDocument()
  })
})
