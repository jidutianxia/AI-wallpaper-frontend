import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ElMessage } from 'element-plus'
import Register from '../Register.vue'
import { requestAuth } from '@/utils/authEvents'
import { mountOptions } from '@/test/testUtils'

const push = vi.fn()
const register = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push })
}))

vi.mock('@/store/user', () => ({
  useUserStore: () => ({ register })
}))

vi.mock('@/utils/authEvents', () => ({
  requestAuth: vi.fn()
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

describe('Register view', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    register.mockResolvedValue({})
  })

  it('requires username and password', async () => {
    const wrapper = mount(Register, mountOptions())

    await wrapper.find('button').trigger('click')

    expect(ElMessage.warning).toHaveBeenCalledWith('请输入用户名和密码')
    expect(register).not.toHaveBeenCalled()
  })

  it('registers and opens login guidance', async () => {
    const wrapper = mount(Register, mountOptions())

    wrapper.vm.form.username = 'alice'
    wrapper.vm.form.email = 'alice@example.com'
    wrapper.vm.form.password = 'secret'
    await wrapper.vm.submit()
    await flushPromises()

    expect(register).toHaveBeenCalledWith(wrapper.vm.form)
    expect(ElMessage.success).toHaveBeenCalledWith('注册成功，请登录')
    expect(push).toHaveBeenCalledWith('/')
    expect(requestAuth).toHaveBeenCalledWith({ reason: 'registered' })
  })
})
