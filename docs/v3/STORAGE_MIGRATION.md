# V3 Storage — IndexedDB Service, Hydration Mechanics, v1 Migration

**Date**: 2026-07-26. Wave 3 architecture (behavior-preserving).

## Service layout (`src/storage/`)

| Module | Role |
|---|---|
| `types.ts` | `AsyncKeyValueStore` — async mirror of the localStorage API (string values, same keys) |
| `indexedDbStore.ts` | Primary adapter. DB `mealscout-storage`, object store `kv`, version 1. Writes awaited to transaction commit. |
| `localStorageStore.ts` | Fallback (Safari private mode / IDB open failure). Uses the **same keys** as v1 sync persistence — fallback browsers need no migration. Probe-write detects write-disabled storage. |
| `memoryStore.ts` | Last resort; session-only. |
| `index.ts` | `getStorage()` singleton with detection chain IndexedDB → localStorage → memory. Never rejects. |
| `migration.ts` | Non-destructive v1 copy (below). |

String values in/out means the schema-guarded parsers (`parsePantryJson`,
`parseGroceryJson`) remain the **only** schema layer, unchanged.

## v1 → IndexedDB migration policy

Source keys: `mealscout:v1:pantry`, `mealscout:v1:grocery` (localStorage envelopes).

- **Copy, never move.** The v1 localStorage keys are **KEPT for one release**
  (this release) so rolling back to the previous build still finds its data.
  The keys are scheduled for removal in the release **after** V3 architecture
  ships and is verified in production — track in CHANGELOG.
- **Never overwrites** a value already present in IndexedDB (target assumed
  newer once it has data).
- **Verified**: every copy is read back and compared; a mismatched copy is
  removed from the target and reported, so hydration falls back to the
  retained v1 key.
- **Idempotent**: safe to run on every startup (it runs during store
  hydration).
- **No-op on the localStorage fallback**: source and target are the same keys.

Other localStorage keys (`recipe-favorites`, `culinara-settings`,
`culinara-stats`) are **out of scope** for this wave: settings must stay a
sync read to avoid a first-paint theme flash; their unification onto
`mk.mealscout.*` keys is a Wave 3 design-system item (see V3_DESIGN_SYSTEM).

## Hydration mechanics (ready-gate + mutation queue)

Pantry and grocery stores hydrate asynchronously via the service:

- Stores start with `entries/items = []` and `hydrated = false`.
- `_persist()` remains the single write choke point and is **gated**: it
  never writes before hydration completes, so a write-before-hydration can
  NEVER persist an empty array over real data.
- Mutations that arrive before hydration completes are expressed as pure
  list operations. They are applied optimistically to the in-memory state
  (UI stays responsive) **and queued**; when hydration completes they are
  **replayed on top of the hydrated data**, then persisted once.
- If storage cannot be read at all, the gate stays closed: the session runs
  in-memory and never destroys stored data.
- Empty-state UI ("Your pantry is empty…") is keyed on the `isReady` flag so
  it cannot flash during load.

Regression tests: `src/stores/__tests__/hydration.test.ts` pins the exact
write-before-hydration race for both stores.
