import type { AsyncKeyValueStore } from './types'

/** v1 sync-persistence envelopes eligible for copy into IndexedDB. */
export const V1_LOCALSTORAGE_KEYS = ['mealscout:v1:pantry', 'mealscout:v1:grocery'] as const

export interface MigrationReport {
  /** Keys copied into the target and verified by read-back. */
  copied: string[]
  /** Keys with nothing to do (no source data, target already has data, or fallback store). */
  skipped: string[]
  /** Keys whose copy failed or failed verification (source left untouched). */
  failed: string[]
}

function readSourceLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/**
 * Non-destructive migration of the v1 localStorage envelopes into the async
 * storage target:
 *
 * - COPY, never move: the v1 localStorage keys are KEPT for one release so
 *   a rollback to the previous build still finds its data.
 * - Never overwrites values already present in the target (the target is
 *   assumed newer once it has data).
 * - Each copy is verified by read-back; a failed verification is rolled
 *   back in the target and reported, and hydration falls back to reading
 *   the retained v1 key directly.
 * - No-op on the localStorage fallback store: source and target are the
 *   same keys in the same storage.
 *
 * Idempotent and safe to run on every startup.
 */
export async function migrateV1LocalStorage(
  target: AsyncKeyValueStore,
  source: Storage | null = readSourceLocalStorage()
): Promise<MigrationReport> {
  const report: MigrationReport = { copied: [], skipped: [], failed: [] }

  if (target.kind !== 'indexeddb' || !source) {
    report.skipped = [...V1_LOCALSTORAGE_KEYS]
    return report
  }

  for (const key of V1_LOCALSTORAGE_KEYS) {
    try {
      const value = source.getItem(key)
      if (value === null) {
        report.skipped.push(key)
        continue
      }
      const existing = await target.getItem(key)
      if (existing !== null) {
        report.skipped.push(key)
        continue
      }
      await target.setItem(key, value)
      const verified = await target.getItem(key)
      if (verified === value) {
        report.copied.push(key)
      } else {
        // Corrupted copy: remove it so hydration reads the retained v1 key.
        try {
          await target.removeItem(key)
        } catch {
          // Best effort; the v1 source key is still authoritative.
        }
        report.failed.push(key)
      }
    } catch {
      report.failed.push(key)
    }
  }
  return report
}
