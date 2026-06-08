import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { ElMessage } from 'element-plus'
import { AUTH_CHANGED_EVENT, AUTH_REQUIRED_EVENT } from '@/utils/authEvents'
import { useAuthSession } from '../useAuthSession'

const router = {
  currentRoute: {
    value: {
      path: '/community',
      query: { tag: 'art' },
      hash: '#top'
    }
  },
  push: vi.fn(),
  replace: vi.fn()
}

const userStore = {
  clearSession: vi.fn(),
  initAuth: vi.fn(),
  logout: vi.fn()
}

vi.mock('vue-router', () => ({
  useRouter: () => router
}))

vi.mock('@/store/user', () => ({
  useUserStore: () => userStore
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn()
  }
}))

const Harness = defineComponent({
  props: {
    onAuthRequired: Function
  },
  setup(props, { expose }) {
    const api = useAuthSession({ onAuthRequired: props.onAuthRequired })
    expose(api)
    return () => null
  }
})

describe('useAuthSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initializes auth on mount, handles auth events, and removes listeners on unmount', () => {
    const onAuthRequired = vi.fn()
    const wrapper = mount(Harness, { props: { onAuthRequired } })

    expect(userStore.initAuth).toHaveBeenCalledOnce()

    window.dispatchEvent(new CustomEvent(AUTH_REQUIRED_EVENT, {
      detail: { reason: 'unauthorized' }
    }))
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT))

    expect(userStore.clearSession).toHaveBeenCalledWith({ notify: false })
    expect(onAuthRequired).toHaveBeenCalledWith(expect.objectContaining({
      detail: { reason: 'unauthorized' }
    }))
    expect(router.replace).toHaveBeenCalledWith({
      path: '/community',
      query: { tag: 'art' },
      hash: '#top'
    })

    wrapper.unmount()
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT))

    expect(router.replace).toHaveBeenCalledTimes(1)
  })

  it('logs out through the store and routes back home', () => {
    const wrapper = mount(Harness)

    wrapper.vm.handleLogout()

    expect(userStore.logout).toHaveBeenCalledOnce()
    expect(ElMessage.success).toHaveBeenCalled()
    expect(router.push).toHaveBeenCalledWith('/')
  })
})
