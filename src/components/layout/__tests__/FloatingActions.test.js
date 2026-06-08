import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FloatingActions from '../FloatingActions.vue'
import { mountOptions } from '@/test/testUtils'

const isDark = { value: false }
const toggleTheme = vi.fn(() => {
  isDark.value = !isDark.value
})

vi.mock('@/composables/useTheme', () => ({
  useTheme: () => ({ isDark, toggleTheme })
}))

describe('FloatingActions', () => {
  beforeEach(() => {
    isDark.value = false
    toggleTheme.mockClear()
    window.scrollTo = vi.fn()
  })

  it('toggles theme, side, settings, and scroll actions', async () => {
    const wrapper = mount(FloatingActions, mountOptions())
    const buttons = wrapper.findAll('button')

    await buttons[0].trigger('click')
    await buttons[1].trigger('click')
    await buttons[2].trigger('click')
    await buttons[3].trigger('click')

    expect(toggleTheme).toHaveBeenCalledOnce()
    expect(wrapper.classes()).toContain('left')
    expect(wrapper.emitted('settings')).toHaveLength(1)
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})
