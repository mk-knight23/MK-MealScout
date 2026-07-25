import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { isEditableTarget, useKeyboardControls } from '../useKeyboardControls'
import { useSettingsStore } from '../../stores/settings'

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

/** Host component so the composable's onMounted/onUnmounted lifecycle runs. */
const KeyboardHost = defineComponent({
  setup() {
    const { lastAction, getShortcuts } = useKeyboardControls()
    return { lastAction, getShortcuts }
  },
  render() {
    return h('div')
  },
})

function press(target: EventTarget, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}

describe('useKeyboardControls (shortcut handling)', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountHost() {
    return mount(KeyboardHost, { global: { plugins: [pinia] } })
  }

  it('toggles help when "h" is pressed (bug: map used e.code names, lookup used e.key)', () => {
    mountHost()
    const settings = useSettingsStore()
    expect(settings.showHelp).toBe(false)

    const event = press(window, 'h')

    expect(settings.showHelp).toBe(true)
    expect(event.defaultPrevented).toBe(true)
  })

  it('toggles help for uppercase "H" (shift held)', () => {
    mountHost()
    const settings = useSettingsStore()

    press(window, 'H')

    expect(settings.showHelp).toBe(true)
  })

  it('toggles help when "?" is pressed', () => {
    mountHost()
    const settings = useSettingsStore()

    press(window, '?')

    expect(settings.showHelp).toBe(true)
  })

  it('closes help with Escape when help is open', () => {
    mountHost()
    const settings = useSettingsStore()
    settings.toggleHelp()
    expect(settings.showHelp).toBe(true)

    press(window, 'Escape')

    expect(settings.showHelp).toBe(false)
  })

  it('reports Escape as a close action so modals can react', () => {
    const wrapper = mountHost()

    press(window, 'Escape')

    expect(wrapper.vm.lastAction).toBe('close')
  })

  it('does not hijack shortcut keys while the user is typing in a field', () => {
    mountHost()
    const settings = useSettingsStore()
    const input = document.createElement('input')
    document.body.appendChild(input)

    press(input, 'h')

    expect(settings.showHelp).toBe(false)
    input.remove()
  })

  it('does not toggle help for Ctrl/Cmd+H (browser shortcut)', () => {
    mountHost()
    const settings = useSettingsStore()

    press(window, 'h', { ctrlKey: true })
    press(window, 'h', { metaKey: true })

    expect(settings.showHelp).toBe(false)
  })

  it('leaves browser Ctrl+S / Ctrl+F alone (save/search have no real handlers)', () => {
    const wrapper = mountHost()

    const save = press(window, 's', { ctrlKey: true })
    const find = press(window, 'f', { ctrlKey: true })

    expect(save.defaultPrevented).toBe(false)
    expect(find.defaultPrevented).toBe(false)
    expect(wrapper.vm.lastAction).toBe('none')
  })

  it('advertises only shortcuts with real handlers (no Ctrl+S / Ctrl+F fake controls)', () => {
    const wrapper = mountHost()
    const advertised = wrapper.vm.getShortcuts().map(shortcut => shortcut.key)

    expect(advertised.some(key => /ctrl|cmd|meta/i.test(key))).toBe(false)
    expect(advertised).toContain('Escape')
    expect(advertised).toContain('H')
    expect(advertised).toContain('?')
  })

  it('stops listening after unmount', () => {
    const wrapper = mountHost()
    const settings = useSettingsStore()
    wrapper.unmount()

    press(window, 'h')

    expect(settings.showHelp).toBe(false)
  })
})
