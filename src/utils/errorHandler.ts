import type { ComponentPublicInstance } from 'vue'

export const GLOBAL_ERROR_NOTICE_ID = 'ms-global-error-notice'

const NOTICE_MESSAGE = 'Something went wrong. Please refresh the page if the problem persists.'

interface ErrorHandlerOptions {
  isDev: boolean
}

type VueErrorHandler = (
  err: unknown,
  instance: ComponentPublicInstance | null,
  info: string
) => void

function getComponentLabel(instance: ComponentPublicInstance | null): string {
  const options = instance?.$options as { name?: string; __name?: string } | undefined
  return options?.name || options?.__name || 'unknown component'
}

/**
 * Minimal dismissible error notice rendered outside the Vue tree, so it still
 * works when the app itself is the thing that crashed. Only one instance is
 * shown at a time.
 */
function showErrorNotice(): void {
  if (document.getElementById(GLOBAL_ERROR_NOTICE_ID)) return

  const notice = document.createElement('div')
  notice.id = GLOBAL_ERROR_NOTICE_ID
  notice.setAttribute('role', 'alert')
  notice.style.cssText = [
    'position:fixed',
    'bottom:1rem',
    'left:50%',
    'transform:translateX(-50%)',
    'z-index:9999',
    'display:flex',
    'align-items:center',
    'gap:0.75rem',
    'max-width:90vw',
    'padding:0.75rem 1rem',
    'border-radius:0.75rem',
    'background:#1e293b',
    'color:#fff',
    'font-family:system-ui,sans-serif',
    'font-size:0.875rem',
    'box-shadow:0 10px 25px rgba(0,0,0,0.3)',
  ].join(';')

  const text = document.createElement('span')
  text.textContent = NOTICE_MESSAGE

  const dismiss = document.createElement('button')
  dismiss.type = 'button'
  dismiss.textContent = '✕'
  dismiss.setAttribute('aria-label', 'Dismiss error notice')
  dismiss.style.cssText =
    'background:none;border:none;color:#fff;cursor:pointer;font-size:1rem;padding:0.25rem'
  dismiss.addEventListener('click', () => notice.remove())

  notice.appendChild(text)
  notice.appendChild(dismiss)
  document.body.appendChild(notice)
}

/**
 * Global Vue error handler factory for app.config.errorHandler.
 * Always logs with component context (never swallow errors silently);
 * in production it additionally shows a dismissible user notice.
 */
export function createAppErrorHandler({ isDev }: ErrorHandlerOptions): VueErrorHandler {
  return (err, instance, info) => {
    const label = getComponentLabel(instance)
    console.error(`[MealScout] Unhandled error in <${label}> (${info}):`, err)

    if (!isDev) {
      showErrorNotice()
    }
  }
}
