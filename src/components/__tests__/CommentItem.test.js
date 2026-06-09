import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CommentItem from '../CommentItem.vue'
import { mountOptions } from '@/test/testUtils'

const push = vi.fn()
const userStore = { info: null }

vi.mock('vue-router', () => ({
  useRouter: () => ({ push })
}))

vi.mock('@/store/user', () => ({
  useUserStore: () => userStore
}))

describe('CommentItem', () => {
  beforeEach(() => {
    push.mockClear()
    userStore.info = null
  })

  it('renders comment author and routes to their profile', async () => {
    const wrapper = mount(CommentItem, mountOptions({
      props: {
        comment: {
          content: 'Nice work',
          createdAt: '2026-01-01T00:00:00.000Z',
          author: { id: 7, username: 'alice', avatarUrl: '/avatar.png' }
        }
      }
    }))

    expect(wrapper.text()).toContain('alice')
    expect(wrapper.text()).toContain('Nice work')

    await wrapper.trigger('click')

    expect(push).toHaveBeenCalledWith('/profile/7')
  })

  it('routes to the user center for the current user', async () => {
    userStore.info = { id: 7 }
    const wrapper = mount(CommentItem, mountOptions({
      props: {
        comment: {
          content: 'My comment',
          author: { id: 7, username: 'me' }
        }
      }
    }))

    await wrapper.trigger('click')

    expect(push).toHaveBeenCalledWith('/user')
  })
})
