import { describe, it, expect } from 'vitest'
import { isEditableTarget } from '../useKeyboardControls'

describe('isEditableTarget (shortcut editable-target guard)', () => {
  it('treats text inputs as editable', () => {
    const input = document.createElement('input')
    input.type = 'text'
    expect(isEditableTarget(input)).toBe(true)
  })

  it('treats textareas as editable', () => {
    expect(isEditableTarget(document.createElement('textarea'))).toBe(true)
  })

  it('treats selects as editable', () => {
    expect(isEditableTarget(document.createElement('select'))).toBe(true)
  })

  it('treats contenteditable elements as editable', () => {
    const div = document.createElement('div')
    div.setAttribute('contenteditable', 'true')
    expect(isEditableTarget(div)).toBe(true)

    const empty = document.createElement('div')
    empty.setAttribute('contenteditable', '')
    expect(isEditableTarget(empty)).toBe(true)
  })

  it('treats a child of a contenteditable region as editable (closest match)', () => {
    const region = document.createElement('div')
    region.setAttribute('contenteditable', 'true')
    const span = document.createElement('span')
    region.appendChild(span)
    expect(isEditableTarget(span)).toBe(true)
  })

  it('does not treat contenteditable="false" as editable', () => {
    const div = document.createElement('div')
    div.setAttribute('contenteditable', 'false')
    expect(isEditableTarget(div)).toBe(false)
  })

  it('does not treat non-editable elements as editable', () => {
    expect(isEditableTarget(document.createElement('div'))).toBe(false)
    expect(isEditableTarget(document.createElement('button'))).toBe(false)
  })

  it('returns false for null or non-element targets', () => {
    expect(isEditableTarget(null)).toBe(false)
    expect(isEditableTarget(window as unknown as EventTarget)).toBe(false)
  })
})
