import { describe, it, expect } from 'vitest'
import { safeExternalUrl } from '../url'

describe('safeExternalUrl (MS-S2 — scheme allowlist for upstream links)', () => {
  it('accepts plain https URLs', () => {
    expect(safeExternalUrl('https://www.youtube.com/watch?v=abc123')).toBe(
      'https://www.youtube.com/watch?v=abc123'
    )
  })

  it('accepts plain http URLs', () => {
    expect(safeExternalUrl('http://example.com/recipe')).toBe('http://example.com/recipe')
  })

  it('trims surrounding whitespace on valid URLs', () => {
    expect(safeExternalUrl('  https://example.com/  ')).toBe('https://example.com/')
  })

  it('rejects javascript: URLs from a poisoned API record', () => {
    expect(safeExternalUrl('javascript:alert(document.cookie)')).toBe('')
  })

  it('rejects mixed-case scheme evasion (JaVaScRiPt:)', () => {
    expect(safeExternalUrl('JaVaScRiPt:alert(1)')).toBe('')
  })

  it('rejects scheme evasion via embedded tab/newline characters', () => {
    // The URL parser strips ASCII tab/newline, so these still parse as javascript:
    expect(safeExternalUrl('java\tscript:alert(1)')).toBe('')
    expect(safeExternalUrl('java\nscript:alert(1)')).toBe('')
    expect(safeExternalUrl(' \n javascript:alert(1)')).toBe('')
  })

  it('rejects data: URLs', () => {
    expect(safeExternalUrl('data:text/html,<script>alert(1)</script>')).toBe('')
  })

  it('rejects vbscript: and other non-web schemes', () => {
    expect(safeExternalUrl('vbscript:msgbox(1)')).toBe('')
    expect(safeExternalUrl('ftp://example.com/file')).toBe('')
    expect(safeExternalUrl('file:///etc/passwd')).toBe('')
  })

  it('rejects protocol-relative URLs (no explicit scheme to allowlist)', () => {
    expect(safeExternalUrl('//evil.example.com/x')).toBe('')
  })

  it('rejects relative paths and unparseable garbage', () => {
    expect(safeExternalUrl('/recipes/52772')).toBe('')
    expect(safeExternalUrl('not a url at all')).toBe('')
  })

  it('returns empty string for empty and non-string input', () => {
    expect(safeExternalUrl('')).toBe('')
    expect(safeExternalUrl('   ')).toBe('')
    expect(safeExternalUrl(undefined)).toBe('')
    expect(safeExternalUrl(null)).toBe('')
    expect(safeExternalUrl(42)).toBe('')
  })
})
