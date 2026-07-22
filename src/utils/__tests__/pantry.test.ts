import { describe, it, expect } from 'vitest'
import {
  PANTRY_PRESETS,
  daysUntilExpiry,
  isExpiringSoon,
  parsePantryJson,
  sanitizePantryEntry,
  serializePantry,
  type PantryEntry,
} from '@/utils/pantry'

const validEntry: PantryEntry = {
  id: 'abc-1',
  name: 'Eggs',
  quantityNote: '6',
  expiresAt: '2026-08-01',
  addedAt: '2026-07-20T10:00:00.000Z',
}

describe('parsePantryJson (corrupt-input handling)', () => {
  it('returns empty pantry for null input', () => {
    expect(parsePantryJson(null)).toEqual([])
  })

  it('returns empty pantry for empty string', () => {
    expect(parsePantryJson('')).toEqual([])
  })

  it('returns empty pantry for corrupt JSON without throwing', () => {
    expect(parsePantryJson('{not json at all')).toEqual([])
    expect(parsePantryJson('][')).toEqual([])
  })

  it('returns empty pantry for wrong top-level shapes', () => {
    expect(parsePantryJson('42')).toEqual([])
    expect(parsePantryJson('"string"')).toEqual([])
    expect(parsePantryJson('[]')).toEqual([])
    expect(parsePantryJson('{"version":1}')).toEqual([])
    expect(parsePantryJson('{"entries":"nope"}')).toEqual([])
  })

  it('drops invalid entries but keeps valid ones', () => {
    const raw = JSON.stringify({
      version: 1,
      entries: [
        validEntry,
        { id: 'x' }, // missing name
        { name: 'No id' }, // missing id
        { id: 'y', name: '   ' }, // blank name
        null,
        'garbage',
        { ...validEntry, id: 'abc-2', name: 'Milk' },
      ],
    })
    const result = parsePantryJson(raw)
    expect(result.map(e => e.name)).toEqual(['Eggs', 'Milk'])
  })

  it('deduplicates entries with the same id', () => {
    const raw = JSON.stringify({
      version: 1,
      entries: [validEntry, { ...validEntry, name: 'Duplicate' }],
    })
    expect(parsePantryJson(raw)).toHaveLength(1)
  })

  it('round-trips through serializePantry', () => {
    const raw = serializePantry([validEntry])
    expect(parsePantryJson(raw)).toEqual([validEntry])
  })

  it('fills safe defaults for missing optional fields', () => {
    const raw = JSON.stringify({ version: 1, entries: [{ id: 'z', name: 'Butter' }] })
    const [entry] = parsePantryJson(raw)
    expect(entry.quantityNote).toBe('')
    expect(entry.expiresAt).toBe('')
    expect(typeof entry.addedAt).toBe('string')
  })
})

describe('sanitizePantryEntry', () => {
  it('rejects non-object values', () => {
    expect(sanitizePantryEntry(null)).toBeNull()
    expect(sanitizePantryEntry([])).toBeNull()
    expect(sanitizePantryEntry('x')).toBeNull()
  })

  it('trims name and notes', () => {
    const entry = sanitizePantryEntry({ id: 'a', name: '  Rice  ', quantityNote: ' 1kg ' })
    expect(entry?.name).toBe('Rice')
    expect(entry?.quantityNote).toBe('1kg')
  })
})

describe('expiry helpers', () => {
  const now = new Date('2026-07-22T12:00:00')

  it('flags dates within the 5-day window as expiring soon', () => {
    expect(isExpiringSoon('2026-07-22', now)).toBe(true) // today
    expect(isExpiringSoon('2026-07-27', now)).toBe(true) // exactly 5 days
  })

  it('does not flag dates beyond the window', () => {
    expect(isExpiringSoon('2026-07-28', now)).toBe(false) // 6 days
    expect(isExpiringSoon('2026-12-25', now)).toBe(false)
  })

  it('flags already-expired dates', () => {
    expect(isExpiringSoon('2026-07-01', now)).toBe(true)
  })

  it('never flags empty or invalid dates', () => {
    expect(isExpiringSoon('', now)).toBe(false)
    expect(isExpiringSoon('not-a-date', now)).toBe(false)
  })

  it('computes whole-day deltas', () => {
    expect(daysUntilExpiry('2026-07-25', now)).toBe(3)
    expect(daysUntilExpiry('2026-07-20', now)).toBe(-2)
    expect(daysUntilExpiry('', now)).toBeNull()
  })
})

describe('PANTRY_PRESETS', () => {
  it('provides at least two presets with non-empty ingredient lists', () => {
    expect(PANTRY_PRESETS.length).toBeGreaterThanOrEqual(2)
    for (const preset of PANTRY_PRESETS) {
      expect(preset.label.length).toBeGreaterThan(0)
      expect(preset.ingredients.length).toBeGreaterThan(0)
    }
  })
})
