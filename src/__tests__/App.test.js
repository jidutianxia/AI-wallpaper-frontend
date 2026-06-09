import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'
import { mountOptions } from '@/test/testUtils'

const mocks = vi.hoisted(() => ({
  initTheme: vi.fn(),
  handleLogout: vi.fn()
}))

vi.mock('@/composables/useTheme', () => ({
  useTheme: () => ({ initTheme: mocks.initTheme })
}))

vi.mock('@/composables/useAuthSession', () => ({
  useAuthSession: () => ({ handleLogout: mocks.handleLogout })
}))

vi.mock('@/components/layout/AppNavbar.vue', () => ({
  default: {
    name: 'AppNavbar',
    template: '<nav><button class="login" @click="$emit(\'login\')">login</button><button class="logout" @click="$emit(\'logout\')">logout</button><button class="notify" @click="$emit(\'notify\')">notify</button></nav>'
  }
}))

vi.mock('@/components/layout/FloatingActions.vue', () => ({
  default: {
    name: 'FloatingActions',
    template: '<button class="settings" @click="$emit(\'settings\')">settings</button>'
  }
}))

vi.mock('@/components/layout/AppFooter.vue', () => ({
  default: {
    name: 'AppFooter',
    template: '<footer>footer</footer>'
  }
}))

vi.mock('@/components/layout/AuthDialog.vue', () => ({
  default: {
    name: 'AuthDialog',
    template: '<section class="auth-dialog">auth</section>'
  }
}))

vi.mock('@/components/layout/NotificationCenter.vue', () => ({
  default: {
    name: 'NotificationCenter',
    template: '<section class="notification-center">notify</section>'
  }
}))

describe('App', () => {
  beforeEach(() => {
    mocks.initTheme.mockClear()
    mocks.handleLogout.mockClear()
  })

  it('initializes theme and wires layout events', async () => {
    const wrapper = mount(App, mountOptions())

    expect(mocks.initTheme).toHaveBeenCalledOnce()

    await wrapper.find('.logout').trigger('click')
    await wrapper.find('.login').trigger('click')
    await wrapper.find('.notify').trigger('click')
    await wrapper.find('.settings').trigger('click')

    expect(mocks.handleLogout).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('暂无更多设置')
  })
})
