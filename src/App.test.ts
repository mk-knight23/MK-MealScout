import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/vue'
import '@testing-library/jest-dom'
import { createPinia, setActivePinia } from 'pinia'
import App from './App.vue'
import { useStatsStore } from './stores/stats'

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

  it('has proper ARIA landmarks for accessibility', () => {
    render(App)
    // role="application" was removed: it disabled screen-reader document
    // navigation for what is an ordinary document-style page.
    expect(screen.queryByRole('application')).not.toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
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

  it('binds the favorites aria-label instead of shipping a literal mustache (MS-3)', () => {
    render(App)
    const status = screen.getByRole('status', { name: /saved recipes/i })
    // The old bug shipped the literal string "{{ store.favorites.length }} saved recipes".
    expect(status).toHaveAccessibleName('0 saved recipes')
    expect(status.getAttribute('aria-label')).not.toContain('{{')
  })

  it('opens the settings dialog when "h" is pressed (shortcut wired end-to-end)', async () => {
    render(App)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // Old bugs: (1) actionMap used e.code names so "h" never matched e.key;
    // (2) App.vue's watchEffect toggled help a second time, cancelling the toggle.
    await fireEvent(window, new KeyboardEvent('keydown', { key: 'h', cancelable: true }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('closes the settings dialog with Escape', async () => {
    render(App)
    await fireEvent(window, new KeyboardEvent('keydown', { key: 'h', cancelable: true }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await fireEvent(window, new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not count the page load as a search — only real searches', async () => {
    render(App)
    const stats = useStatsStore()
    expect(stats.totalSearches).toBe(0)

    await fireEvent.click(screen.getByRole('button', { name: /^Search$/i }))

    expect(stats.totalSearches).toBe(1)
  })

  it('shows only stats that are actually tracked (no fake Time Spent / Favorites tiles)', async () => {
    render(App)
    await fireEvent(window, new KeyboardEvent('keydown', { key: 'h', cancelable: true }))
    const dialog = await screen.findByRole('dialog')

    expect(dialog).toHaveTextContent('Searches')
    expect(dialog).toHaveTextContent('Recipes Viewed')
    // addTimeSpent/updateFavorites were never called anywhere — these tiles
    // could only ever display zero, so they must not be advertised.
    expect(dialog.textContent).not.toContain('Time Spent')
    expect(dialog.textContent).not.toContain('Favorites')
  })
})
