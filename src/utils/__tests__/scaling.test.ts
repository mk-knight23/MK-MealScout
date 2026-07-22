import { describe, it, expect } from 'vitest'
import {
  parseMeasure,
  scaleQuantity,
  scaleMeasure,
  formatQuantity,
  convertVolume,
  convertMass,
} from '../scaling'

describe('parseMeasure', () => {
  it('parses whole numbers', () => {
    expect(parseMeasure('2 cups flour')).toEqual({
      raw: '2 cups flour',
      quantity: 2,
      unit: 'cups',
      suffix: 'flour',
    })
  })

  it('parses mixed fractions', () => {
    const m = parseMeasure('1 1/2 tbsp olive oil')
    expect(m.quantity).toBeCloseTo(1.5, 4)
    expect(m.unit).toBe('tbsp')
    expect(m.suffix).toBe('olive oil')
  })

  it('parses lone fractions', () => {
    const m = parseMeasure('1/4 tsp salt')
    expect(m.quantity).toBeCloseTo(0.25, 4)
    expect(m.unit).toBe('tsp')
  })

  it('parses unicode fractions', () => {
    const m = parseMeasure('½ cup milk')
    expect(m.quantity).toBeCloseTo(0.5, 4)
    expect(m.unit).toBe('cup')
  })

  it('parses ranges by averaging', () => {
    const m = parseMeasure('2-3 cloves garlic')
    expect(m.quantity).toBeCloseTo(2.5, 4)
    expect(m.unit).toBe('cloves')
  })

  it('handles unit-only measures', () => {
    const m = parseMeasure('a pinch of salt')
    expect(m.quantity).toBeNull()
  })

  it('handles bare quantity without unit', () => {
    const m = parseMeasure('3 eggs')
    expect(m.quantity).toBe(3)
    expect(m.unit).toBe('')
    expect(m.suffix).toBe('eggs')
  })

  it('handles empty string', () => {
    expect(parseMeasure('').quantity).toBeNull()
  })
})

describe('scaleQuantity', () => {
  it('scales cleanly', () => {
    expect(scaleQuantity(2, 3)).toBe(6)
    expect(scaleQuantity(1.5, 2)).toBe(3)
    expect(scaleQuantity(0.25, 4)).toBe(1)
  })

  it('passes through null and invalid factors', () => {
    expect(scaleQuantity(null, 2)).toBeNull()
    expect(scaleQuantity(2, 0)).toBe(2)
    expect(scaleQuantity(2, -1)).toBe(2)
    expect(scaleQuantity(2, NaN)).toBe(2)
  })
})

describe('formatQuantity', () => {
  it('preserves integers', () => {
    expect(formatQuantity(3)).toBe('3')
  })
  it('recognizes common fractions', () => {
    expect(formatQuantity(0.5)).toBe('1/2')
    expect(formatQuantity(0.25)).toBe('1/4')
    expect(formatQuantity(1.5)).toBe('1 1/2')
    expect(formatQuantity(2.75)).toBe('2 3/4')
  })
  it('falls back to decimal for uncommon fractions', () => {
    expect(formatQuantity(0.42)).toBe('0.42')
  })
  it('handles null', () => {
    expect(formatQuantity(null)).toBe('')
  })
})

describe('scaleMeasure end-to-end', () => {
  it('doubles a mixed fraction cleanly', () => {
    const out = scaleMeasure('1 1/2 tbsp olive oil', 2)
    expect(out.scaled).toBe('3 tbsp olive oil')
  })

  it('halves a whole with unit', () => {
    const out = scaleMeasure('2 cups flour', 0.5)
    expect(out.scaled).toBe('1 cups flour')
  })

  it('scales a unit-less quantity', () => {
    const out = scaleMeasure('3 eggs', 2)
    expect(out.scaled).toBe('6 eggs')
  })

  it('leaves unparseable measures intact', () => {
    const out = scaleMeasure('a pinch of salt', 4)
    expect(out.scaled).toBe('a pinch of salt')
    expect(out.quantity).toBeNull()
  })
})

describe('conversions', () => {
  it('converts tbsp to ml', () => {
    expect(convertVolume(1, 'tbsp', 'ml')).toBeCloseTo(14.7868, 3)
  })
  it('converts cup to ml', () => {
    expect(convertVolume(1, 'cup', 'ml')).toBeCloseTo(236.588, 3)
  })
  it('converts oz to g', () => {
    expect(convertMass(1, 'oz', 'g')).toBeCloseTo(28.3495, 3)
  })
  it('converts lb to kg', () => {
    expect(convertMass(1, 'lb', 'kg')).toBeCloseTo(0.4536, 3)
  })
  it('returns null for unknown units', () => {
    expect(convertVolume(1, 'foo', 'ml')).toBeNull()
    expect(convertMass(1, 'g', 'foo')).toBeNull()
  })
})
