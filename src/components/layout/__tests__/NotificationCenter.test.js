import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import NotificationCenter from '../NotificationCenter.vue'
import { getUserReceivedComments, getUserReceivedLikes } from '@/api'
import { mountOptions } from '@/test/testUtils'

vi.mock('@/api', () => ({
  getUserReceivedComments: vi.fn(),
  getUserReceivedLikes: vi.fn()
}))

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.mocked(getUserReceivedComments).mockResolvedValue({
      records: [{ id: 1, title: 'comment notice', createdAt: 'today' }]
    })
    vi.mocked(getUserReceivedLikes).mockResolvedValue({
      list: [{ id: 2, content: 'like notice', time: 'now' }]
    })
  })

  it('loads comment and like notifications when opened', async () => {
    const wrapper = mount(NotificationCenter, mountOptions({
      props: {
        modelValue: false
      }
    }))

    await wrapper.setProps({ modelValue: true })
    await flushPromises()

    expect(getUserReceivedComments).toHaveBeenCalledWith({ page: 1, size: 10 })
    expect(getUserReceivedLikes).toHaveBeenCalledWith({ page: 1, size: 10 })
    expect(wrapper.text()).toContain('comment notice')

    await wrapper.findAll('.notify-item')[1].trigger('click')

    expect(wrapper.text()).toContain('like notice')
  })
})
