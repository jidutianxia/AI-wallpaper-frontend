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

  it('scrolls back to the top', async () => {
    const wrapper = mount(FloatingActions, mountOptions())
    const buttons = wrapper.findAll('button')

    await buttons[0].trigger('click')
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})
