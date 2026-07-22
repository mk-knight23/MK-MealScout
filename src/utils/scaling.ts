// Recipe scaling + unit conversion. Deterministic, no network.
// Handles fractions ("1 1/2 tbsp"), decimals, ranges ("2-3 cups"), plain counts, and
// common metric/imperial units for volume + mass.

export interface ParsedMeasure {
  raw: string
  quantity: number | null
  unit: string
  suffix: string
}

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
  '⅙': 1 / 6, '⅚': 5 / 6, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
}

const KNOWN_UNITS = new Set([
  'cup', 'cups',
  'tbsp', 'tablespoon', 'tablespoons',
  'tsp', 'teaspoon', 'teaspoons',
  'oz', 'ounce', 'ounces',
  'lb', 'lbs', 'pound', 'pounds',
  'g', 'gram', 'grams',
  'kg', 'kilogram', 'kilograms',
  'ml', 'milliliter', 'milliliters',
  'l', 'liter', 'liters', 'litre', 'litres',
  'pinch', 'dash',
  'clove', 'cloves',
  'can', 'cans',
  'slice', 'slices',
  'piece', 'pieces',
  'stick', 'sticks',
])

function normalizeFractions(input: string): string {
  let s = input
  for (const [glyph, val] of Object.entries(UNICODE_FRACTIONS)) {
    s = s.replace(new RegExp(glyph, 'g'), ` ${val} `)
  }
  return s.trim()
}

function parseFractionToken(token: string): number | null {
  const m = token.match(/^(\d+)\/(\d+)$/)
  if (!m || m[1] === undefined || m[2] === undefined) return null
  const num = parseInt(m[1], 10)
  const den = parseInt(m[2], 10)
  if (den === 0) return null
  return num / den
}

/** Split tokens like "400g" or "250ml" into quantity + known unit. */
function splitQuantityUnitToken(token: string): string[] {
  const m = token.match(/^(\d+(?:\.\d+)?)([a-zA-Z]+)$/)
  if (m && m[1] !== undefined && m[2] !== undefined && KNOWN_UNITS.has(m[2].toLowerCase())) {
    return [m[1], m[2]]
  }
  return [token]
}

export function parseMeasure(raw: string): ParsedMeasure {
  const original = raw
  const cleaned = normalizeFractions(raw).replace(/[,]/g, ' ').trim()
  if (!cleaned) return { raw: original, quantity: null, unit: '', suffix: '' }

  const tokens = cleaned.split(/\s+/).flatMap(splitQuantityUnitToken)
  let quantity: number | null = null
  let idx = 0

  const rangeMatch = tokens[0]?.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/)
  if (rangeMatch && rangeMatch[1] !== undefined && rangeMatch[2] !== undefined) {
    quantity = (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2
    idx = 1
  } else {
    const first = parseFractionToken(tokens[0] || '')
    if (first !== null) {
      quantity = first
      idx = 1
    } else if (tokens[0] !== undefined && !Number.isNaN(parseFloat(tokens[0]))) {
      const wholeCandidate = parseFloat(tokens[0])
      idx = 1
      quantity = wholeCandidate
      const maybeFrac = parseFractionToken(tokens[1] || '')
      if (maybeFrac !== null) {
        quantity += maybeFrac
        idx = 2
      }
    }
  }

  const rest = tokens.slice(idx)
  let unit = ''
  let suffix = ''

  if (rest.length > 0) {
    const candidate = (rest[0] ?? '').toLowerCase().replace(/\./g, '')
    if (KNOWN_UNITS.has(candidate)) {
      unit = candidate
      suffix = rest.slice(1).join(' ')
    } else {
      suffix = rest.join(' ')
    }
  }

  return { raw: original, quantity, unit, suffix }
}

export function scaleQuantity(qty: number | null, factor: number): number | null {
  if (qty === null || !Number.isFinite(qty)) return qty
  if (!Number.isFinite(factor) || factor <= 0) return qty
  return round4(qty * factor)
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}

export function formatQuantity(qty: number | null): string {
  if (qty === null) return ''
  if (Number.isInteger(qty)) return String(qty)
  const whole = Math.floor(qty)
  const frac = qty - whole
  const fractionMap: Array<[number, string]> = [
    [0.125, '1/8'],
    [0.25, '1/4'],
    [1 / 3, '1/3'],
    [0.5, '1/2'],
    [2 / 3, '2/3'],
    [0.75, '3/4'],
    [0.875, '7/8'],
  ]
  for (const [v, s] of fractionMap) {
    if (Math.abs(frac - v) < 0.02) {
      return whole > 0 ? `${whole} ${s}` : s
    }
  }
  return qty.toFixed(2).replace(/\.?0+$/, '')
}

export interface ScaledMeasure {
  original: string
  scaled: string
  quantity: number | null
  unit: string
}

export function scaleMeasure(raw: string, factor: number): ScaledMeasure {
  const parsed = parseMeasure(raw)
  const newQty = scaleQuantity(parsed.quantity, factor)
  const parts: string[] = []
  if (newQty !== null) parts.push(formatQuantity(newQty))
  if (parsed.unit) parts.push(parsed.unit)
  if (parsed.suffix) parts.push(parsed.suffix)
  return {
    original: raw,
    scaled: parts.join(' ').trim() || raw,
    quantity: newQty,
    unit: parsed.unit,
  }
}

const VOLUME_TO_ML: Record<string, number> = {
  tsp: 4.92892, teaspoon: 4.92892, teaspoons: 4.92892,
  tbsp: 14.7868, tablespoon: 14.7868, tablespoons: 14.7868,
  cup: 236.588, cups: 236.588,
  ml: 1, milliliter: 1, milliliters: 1,
  l: 1000, liter: 1000, liters: 1000, litre: 1000, litres: 1000,
}

const MASS_TO_G: Record<string, number> = {
  oz: 28.3495, ounce: 28.3495, ounces: 28.3495,
  lb: 453.592, lbs: 453.592, pound: 453.592, pounds: 453.592,
  g: 1, gram: 1, grams: 1,
  kg: 1000, kilogram: 1000, kilograms: 1000,
}

export function convertVolume(qty: number, from: string, to: string): number | null {
  const f = VOLUME_TO_ML[from]
  const t = VOLUME_TO_ML[to]
  if (!f || !t) return null
  return round4((qty * f) / t)
}

export function convertMass(qty: number, from: string, to: string): number | null {
  const f = MASS_TO_G[from]
  const t = MASS_TO_G[to]
  if (!f || !t) return null
  return round4((qty * f) / t)
}
