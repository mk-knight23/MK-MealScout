import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createAppErrorHandler, GLOBAL_ERROR_NOTICE_ID } from '../errorHandler'

function getNotice(): HTMLElement | null {
  return document.getElementById(GLOBAL_ERROR_NOTICE_ID)
}

describe('createAppErrorHandler (global Vue error handler)', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    getNotice()?.remove()
  })

  it('logs the error with component context', () => {
    const handler = createAppErrorHandler({ isDev: true })
    const error = new Error('boom')
    const instance = { $options: { name: 'RecipeCard' } }

    handler(error, instance as never, 'render function')

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    const [message, loggedError] = consoleErrorSpy.mock.calls[0]
    expect(String(message)).toContain('RecipeCard')
    expect(String(message)).toContain('render function')
    expect(loggedError).toBe(error)
  })

  it('falls back to a generic component label when instance is null', () => {
    const handler = createAppErrorHandler({ isDev: true })

    handler(new Error('boom'), null, 'setup function')

    const [message] = consoleErrorSpy.mock.calls[0]
    expect(String(message)).toContain('unknown component')
    expect(String(message)).toContain('setup function')
  })

  it('does not show a user notice in dev mode', () => {
    const handler = createAppErrorHandler({ isDev: true })

    handler(new Error('boom'), null, 'render function')

    expect(getNotice()).toBeNull()
  })

  it('shows a dismissible user notice in prod mode', () => {
    const handler = createAppErrorHandler({ isDev: false })

    handler(new Error('boom'), null, 'render function')

    const notice = getNotice()
    expect(notice).not.toBeNull()
    expect(notice?.getAttribute('role')).toBe('alert')
    expect(notice?.textContent).toContain('Something went wrong')

    const dismiss = notice?.querySelector<HTMLButtonElement>('button')
    expect(dismiss).toBeTruthy()
    dismiss?.click()
    expect(getNotice()).toBeNull()
  })

  it('still logs to the console in prod mode (no silent swallowing)', () => {
    const handler = createAppErrorHandler({ isDev: false })

    handler(new Error('boom'), null, 'watcher callback')

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
  })

  it('does not stack duplicate notices for repeated errors', () => {
    const handler = createAppErrorHandler({ isDev: false })

    handler(new Error('one'), null, 'render function')
    handler(new Error('two'), null, 'render function')

    expect(document.querySelectorAll(`#${GLOBAL_ERROR_NOTICE_ID}`)).toHaveLength(1)
  })

  it('handles non-Error thrown values without crashing', () => {
    const handler = createAppErrorHandler({ isDev: false })

    expect(() => handler('string failure', null, 'event handler')).not.toThrow()
    expect(getNotice()).not.toBeNull()
  })
})
