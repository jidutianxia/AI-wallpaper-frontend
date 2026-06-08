import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ElMessage } from 'element-plus'
import AuthDialog from '../AuthDialog.vue'
import { mountOptions } from '@/test/testUtils'

const routerPush = vi.fn()
const userStore = {
  login: vi.fn()
}

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush })
}))

vi.mock('@/store/user', () => ({
  useUserStore: () => userStore
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      error: vi.fn(),
      success: vi.fn(),
      warning: vi.fn()
    }
  }
})

describe('AuthDialog', () => {
  beforeEach(() => {
    routerPush.mockClear()
    userStore.login.mockReset()
  })

  it('warns when submitting empty credentials', async () => {
    const wrapper = mount(AuthDialog, mountOptions({
      props: { modelValue: true }
    }))

    await wrapper.findAll('button').at(-1).trigger('click')

    expect(ElMessage.warning).toHaveBeenCalled()
    expect(userStore.login).not.toHaveBeenCalled()
  })

  it('logs in and closes the dialog on success', async () => {
    userStore.login.mockResolvedValue({ token: 'token' })
    const updates = []
    const wrapper = mount(AuthDialog, mountOptions({
      props: {
        modelValue: true,
        'onUpdate:modelValue': (value) => updates.push(value)
      }
    }))
    const inputs = wrapper.findAll('input')

    await inputs[0].setValue('alice')
    await inputs[1].setValue('secret')
    await wrapper.findAll('button').at(-1).trigger('click')
    await flushPromises()

    expect(userStore.login).toHaveBeenCalledWith({
      username: 'alice',
      password: 'secret'
    })
    expect(ElMessage.success).toHaveBeenCalled()
    expect(updates).toContain(false)
  })

  it('routes to register from the secondary action', async () => {
    const wrapper = mount(AuthDialog, mountOptions({
      props: { modelValue: true }
    }))

    await wrapper.findAll('button')[1].trigger('click')

    expect(routerPush).toHaveBeenCalledWith('/register')
  })
})
