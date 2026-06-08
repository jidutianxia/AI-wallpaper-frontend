import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import Community from '../Community.vue'
import {
  getCommunityPostComments,
  getCommunityPostImageMeta,
  getCommunityPosts,
  getCommunityRecentUsers,
  getUserStats
} from '@/api'
import { requestAuth } from '@/utils/authEvents'
import { installBrowserMocks, mountOptions } from '@/test/testUtils'

const routerPush = vi.fn()
const userStore = {
  isAuthenticated: false,
  info: null
}
const toggleInteraction = vi.fn()
const share = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush })
}))

vi.mock('@/store/user', () => ({
  useUserStore: () => userStore
}))

vi.mock('@/api', () => ({
  getCommunityPost: vi.fn(),
  getCommunityPostComments: vi.fn(),
  getCommunityPostImageMeta: vi.fn(),
  getCommunityPosts: vi.fn(),
  getCommunityRecentUsers: vi.fn(),
  getUserStats: vi.fn(),
  commentCommunityPost: vi.fn()
}))

vi.mock('@/utils/authEvents', () => ({
  requestAuth: vi.fn()
}))

vi.mock('@/composables/useInteraction', () => ({
  useInteraction: () => ({ toggleInteraction })
}))

vi.mock('@/composables/useShare', () => ({
  useShare: () => ({ share })
}))

vi.mock('@vueuse/core', () => ({
  useDebounceFn: (fn) => fn
}))

vi.mock('@/components/CommentItem.vue', () => ({
  default: {
    name: 'CommentItem',
    props: ['comment'],
    template: '<div class="comment-item">{{ comment.content }}</div>'
  }
}))

describe('Community view', () => {
  beforeEach(() => {
    installBrowserMocks()
    routerPush.mockClear()
    userStore.isAuthenticated = false
    userStore.info = null
    toggleInteraction.mockClear()
    share.mockClear()
    vi.mocked(requestAuth).mockClear()
    vi.mocked(getCommunityPosts).mockImplementation((params = {}) => {
      if (params.sort === 'popular') {
        return Promise.resolve({ items: [{ id: 2, title: 'Hot Post' }], total: 1 })
      }
      return Promise.resolve({
        items: [{
          id: 1,
          title: 'Fresh Post',
          content: 'hello',
          author: { id: 7, username: 'alice' },
          images: ['/a.jpg'],
          tags: ['tag'],
          likes: 0,
          favorites: 0
        }],
        total: 1
      })
    })
    vi.mocked(getCommunityRecentUsers).mockResolvedValue([{ id: 3, username: 'recent' }])
    vi.mocked(getUserStats).mockResolvedValue({ postCount: 1, likeCount: 2, receivedLikes: 3 })
    vi.mocked(getCommunityPostComments).mockResolvedValue({ items: [{ id: 4, content: 'comment' }] })
    vi.mocked(getCommunityPostImageMeta).mockResolvedValue({ wallpaperInfo: { id: 99 } })
  })

  it('loads posts, hot posts, and recent users', async () => {
    const wrapper = mount(Community, mountOptions())
    await flushPromises()

    expect(wrapper.text()).toContain('Fresh Post')
    expect(wrapper.text()).toContain('Hot Post')
    expect(wrapper.text()).toContain('recent')
  })

  it('asks guests to authenticate before publishing', async () => {
    const wrapper = mount(Community, mountOptions())
    await flushPromises()

    await wrapper.find('.publish-btn').trigger('click')

    expect(requestAuth).toHaveBeenCalledWith({ reason: 'publish' })
    expect(routerPush).not.toHaveBeenCalledWith('/community/compose')
  })

  it('routes authenticated users to compose', async () => {
    userStore.isAuthenticated = true
    userStore.info = { id: 1, username: 'me' }
    const wrapper = mount(Community, mountOptions())
    await flushPromises()

    await wrapper.find('.publish-btn').trigger('click')

    expect(routerPush).toHaveBeenCalledWith('/community/compose')
  })
})
