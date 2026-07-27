import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import '@testing-library/jest-dom'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, type Router } from 'vue-router'
import App from './App.vue'
import { createAppRouter } from './router'
import { useStatsStore } from './stores/stats'

// Mock fetch
const mockFetch = vi.fn()
Object.defineProperty(globalThis, 'fetch', {
  value: mockFetch,
  writable: true,
})

/** Mount App at a route (memory history: no real URL bar involved). */
async function renderApp(path = '/'): Promise<{ router: Router }> {
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()
  render(App, { global: { plugins: [router] } })
  return { router }
}

describe('MK MealScout Recipe Finder', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', async () => {
    await renderApp()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('renders header with correct elements', async () => {
    await renderApp()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getAllByText(/MK MealScout/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Open settings/i })).toBeInTheDocument()
  })

  it('renders hero section', async () => {
    await renderApp()
    expect(screen.getByText(/Discover Your Next/i)).toBeInTheDocument()
    expect(screen.getByText(/Masterpiece/i)).toBeInTheDocument()
  })

  it('renders search input and button', async () => {
    await renderApp()
    expect(screen.getByRole('textbox', { name: /Search recipes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Search$/i })).toBeInTheDocument()
  })

  it('has proper ARIA landmarks for accessibility', async () => {
    await renderApp()
    // role="application" was removed: it disabled screen-reader document
    // navigation for what is an ordinary document-style page.
    expect(screen.queryByRole('application')).not.toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('renders theme toggle button', async () => {
    await renderApp()
    const themeButton = screen.getByRole('button', { name: /Switch to/i })
    expect(themeButton).toBeInTheDocument()
  })

  it('renders favorites counter', async () => {
    await renderApp()
    expect(screen.getByRole('status', { name: /saved recipes/i })).toBeInTheDocument()
  })

  it('binds the favorites aria-label instead of shipping a literal mustache (MS-3)', async () => {
    await renderApp()
    const status = screen.getByRole('status', { name: /saved recipes/i })
    // The old bug shipped the literal string "{{ store.favorites.length }} saved recipes".
    expect(status).toHaveAccessibleName('0 saved recipes')
    expect(status.getAttribute('aria-label')).not.toContain('{{')
  })

  it('opens the settings dialog when "h" is pressed (shortcut wired end-to-end)', async () => {
    await renderApp()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // Old bugs: (1) actionMap used e.code names so "h" never matched e.key;
    // (2) App.vue's watchEffect toggled help a second time, cancelling the toggle.
    await fireEvent(window, new KeyboardEvent('keydown', { key: 'h', cancelable: true }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('closes the settings dialog with Escape', async () => {
    await renderApp()
    await fireEvent(window, new KeyboardEvent('keydown', { key: 'h', cancelable: true }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await fireEvent(window, new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not count the page load as a search — only real searches', async () => {
    await renderApp()
    const stats = useStatsStore()
    expect(stats.totalSearches).toBe(0)

    await fireEvent.click(screen.getByRole('button', { name: /^Search$/i }))

    expect(stats.totalSearches).toBe(1)
  })

  it('shows only stats that are actually tracked (no fake Time Spent / Favorites tiles)', async () => {
    await renderApp()
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

describe('routing (vue-router, history mode)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('deep link /pantry renders the pantry view', async () => {
    await renderApp('/pantry')
    expect(await screen.findByText(/Your pantry is empty/i)).toBeInTheDocument()
    expect(screen.queryByText(/Discover Your Next/i)).not.toBeInTheDocument()
  })

  it('deep link /grocery renders the grocery view', async () => {
    await renderApp('/grocery')
    expect(await screen.findByText(/grocery list is empty/i)).toBeInTheDocument()
  })

  it('deep link /recipe/:id opens the detail modal over the discover page', async () => {
    await renderApp('/recipe/52772')
    expect(await screen.findByRole('dialog', { name: /Recipe details/i })).toBeInTheDocument()
    // Discover catalogue renders underneath so the deep link has a real page.
    expect(screen.getByText(/Discover Your Next/i)).toBeInTheDocument()
  })

  it('closing a deep-linked recipe (no in-app history) lands on discover', async () => {
    const { router } = await renderApp('/recipe/52772')
    await fireEvent.click(await screen.findByRole('button', { name: /Close recipe details/i }))
    await waitFor(() => expect(router.currentRoute.value.name).toBe('discover'))
    expect(screen.queryByRole('dialog', { name: /Recipe details/i })).not.toBeInTheDocument()
  })

  it('header navigation switches views via routes', async () => {
    const { router } = await renderApp('/')
    const pantryLinks = screen.getAllByRole('link', { name: /Pantry/i })
    await fireEvent.click(pantryLinks[0]!)
    expect(await screen.findByText(/Your pantry is empty/i)).toBeInTheDocument()
    expect(router.currentRoute.value.name).toBe('pantry')
  })

  it('unknown paths render the 404 view', async () => {
    await renderApp('/definitely-not-a-page')
    expect(await screen.findByText(/404 — Page not found/i)).toBeInTheDocument()
  })
})
