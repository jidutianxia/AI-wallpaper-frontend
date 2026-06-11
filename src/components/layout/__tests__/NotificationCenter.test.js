import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import NotificationCenter from '../NotificationCenter.vue'
import { getNotifications, getUserReceivedComments, getUserReceivedLikes } from '@/api'
import { mountOptions } from '@/test/testUtils'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push })
}))

vi.mock('@/api', () => ({
  getNotifications: vi.fn(),
  getUserReceivedComments: vi.fn(),
  getUserReceivedLikes: vi.fn()
}))

describe('NotificationCenter', () => {
  beforeEach(() => {
    push.mockClear()
    vi.mocked(getUserReceivedComments).mockResolvedValue({
      records: [{ id: 1, title: 'comment notice', createdAt: 'today' }]
    })
    vi.mocked(getUserReceivedLikes).mockResolvedValue({
      list: [{ id: 2, content: 'like notice', time: 'now' }]
    })
    vi.mocked(getNotifications).mockResolvedValue({
      items: [{ id: 3, type: 'FOLLOW', actor: { id: 7, username: 'alice' }, createdAt: 'later' }]
    })
  })

  it('loads comment, like, and follower notifications when opened', async () => {
    const wrapper = mount(NotificationCenter, mountOptions({
      props: {
        modelValue: false
      }
    }))

    await wrapper.setProps({ modelValue: true })
    await flushPromises()

    expect(getUserReceivedComments).toHaveBeenCalledWith({ page: 1, size: 10 })
    expect(getUserReceivedLikes).toHaveBeenCalledWith({ page: 1, size: 10 })
    expect(getNotifications).toHaveBeenCalledWith({ type: 'followers', page: 1, size: 10 })
    expect(wrapper.text()).toContain('comment notice')

    await wrapper.findAll('.notify-item')[1].trigger('click')

    expect(wrapper.text()).toContain('like notice')

    await wrapper.findAll('.notify-item')[2].trigger('click')
    expect(wrapper.text()).toContain('alice 关注了你')
    await wrapper.find('.notify-card').trigger('click')
    expect(push).toHaveBeenCalledWith('/profile/7')
  })
})
