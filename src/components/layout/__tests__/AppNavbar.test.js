import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppNavbar from '../AppNavbar.vue'
import { mountOptions } from '@/test/testUtils'

const push = vi.fn()
const userStore = {
  isAuthenticated: false,
  info: null
}
const isDark = { value: false }

vi.mock('vue-router', () => ({
  useRouter: () => ({ push })
}))

vi.mock('@/store/user', () => ({
  useUserStore: () => userStore
}))

vi.mock('@/composables/useTheme', () => ({
  useTheme: () => ({ isDark })
}))

vi.mock('@/utils/imageHelper', () => ({
  getAvatarUrl: (url) => url || 'avatar-fallback'
}))

describe('AppNavbar', () => {
  beforeEach(() => {
    push.mockClear()
    userStore.isAuthenticated = false
    userStore.info = null
    isDark.value = false
  })

  it('emits login when guest clicks the auth action', async () => {
    const wrapper = mount(AppNavbar, mountOptions())

    await wrapper.find('.nav-right button').trigger('click')

    expect(wrapper.emitted('login')).toHaveLength(1)
  })

  it('pushes search route on enter with the trimmed keyword', async () => {
    const wrapper = mount(AppNavbar, mountOptions())
    const input = wrapper.find('input')

    await input.setValue('  nature  ')
    await input.trigger('keyup.enter')

    expect(push).toHaveBeenCalledWith({
      path: '/search',
      query: { q: 'nature' }
    })
  })

  it('emits notify and logout for authenticated users', async () => {
    userStore.isAuthenticated = true
    userStore.info = { username: 'alice', avatarUrl: '/avatar.png' }
    const wrapper = mount(AppNavbar, mountOptions())
    const buttons = wrapper.findAll('.nav-right button')

    await buttons[0].trigger('click')
    await buttons[1].trigger('click')

    expect(wrapper.text()).toContain('alice')
    expect(wrapper.emitted('notify')).toHaveLength(1)
    expect(wrapper.emitted('logout')).toHaveLength(1)
  })

  it('opens and closes the mobile menu through menu links', async () => {
    const wrapper = mount(AppNavbar, mountOptions())

    await wrapper.find('.hamburger').trigger('click')
    expect(wrapper.find('.mobile-menu').exists()).toBe(true)

    await wrapper.find('.mobile-link').trigger('click')
    expect(wrapper.find('.mobile-menu').exists()).toBe(false)
  })
})
