/**
 * MS-S2: upstream TheMealDB fields (strSource, strYoutube) are bound to
 * `:href` in the recipe modal. A poisoned/compromised API record could carry
 * a `javascript:` (or `data:`, `vbscript:`, ...) URL that would execute on
 * click. Only explicit http/https URLs are allowed through; everything else
 * resolves to an empty string, which callers treat as "no link".
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

/**
 * Returns a normalized absolute URL when `raw` is a string with an http or
 * https scheme; returns '' for every other input (other schemes, relative
 * URLs, garbage, non-strings). Uses the URL parser rather than string
 * matching so scheme-evasion tricks (mixed case, embedded tabs/newlines)
 * are normalized before the check.
 */
export function safeExternalUrl(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return ''
  }
  return ALLOWED_PROTOCOLS.has(parsed.protocol) ? parsed.href : ''
}
