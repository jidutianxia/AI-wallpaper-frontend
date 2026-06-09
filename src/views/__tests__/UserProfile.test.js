import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import UserProfile from '../UserProfile.vue'
import {
  followUser,
  getOtherUserLikedPosts,
  getOtherUserPostFavorites,
  getUserCommunityPosts,
  getUserProfile
} from '@/api'
import { mountOptions } from '@/test/testUtils'

const push = vi.fn()
const userStore = { info: { id: 1, username: 'me' } }

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '7' } }),
  useRouter: () => ({ push })
}))

vi.mock('@/store/user', () => ({
  useUserStore: () => userStore
}))

vi.mock('@/api', () => ({
  followUser: vi.fn(),
  getMyCommunityPosts: vi.fn(),
  getOtherUserLikedPosts: vi.fn(),
  getOtherUserPostFavorites: vi.fn(),
  getUserCommunityPosts: vi.fn(),
  getUserLikes: vi.fn(),
  getUserPostFavorites: vi.fn(),
  getUserProfile: vi.fn(),
  unfollowUser: vi.fn()
}))

vi.mock('@/components/UnifiedCard.vue', () => ({
  default: {
    name: 'UnifiedCard',
    props: ['title'],
    template: '<article class="mock-card">{{ title }}</article>'
  }
}))

describe('UserProfile view', () => {
  beforeEach(() => {
    push.mockClear()
    vi.mocked(getUserProfile).mockResolvedValue({
      id: 7,
      username: 'alice',
      nickname: 'Alice',
      avatarUrl: '/avatar.png',
      isFollowing: false
    })
    vi.mocked(getUserCommunityPosts).mockResolvedValue({
      items: [{ id: 10, title: 'Post A', content: 'hello', images: [{ url: '/a.jpg' }], tags: ['art'], author: { username: 'alice' } }]
    })
    vi.mocked(getOtherUserLikedPosts).mockResolvedValue({
      items: [{ id: 11, title: 'Liked Post', images: ['/liked.jpg'], author: { username: 'bob' } }]
    })
    vi.mocked(getOtherUserPostFavorites).mockResolvedValue({
      items: [{ id: 12, title: 'Favorite Post', cover: { url: '/fav.jpg' }, author: { username: 'carol' } }]
    })
    vi.mocked(followUser).mockResolvedValue({})
  })

  it('loads public profile data and supports follow and navigation', async () => {
    const wrapper = mount(UserProfile, mountOptions())
    await flushPromises()

    expect(getUserProfile).toHaveBeenCalledWith('7')
    expect(getUserCommunityPosts).toHaveBeenCalledWith('7', { page: 1, size: 20 })
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Post A')
    expect(wrapper.text()).toContain('Liked Post')
    expect(wrapper.text()).toContain('Favorite Post')

    await wrapper.vm.toggleFollow()
    expect(followUser).toHaveBeenCalledWith('7')
    expect(wrapper.vm.isFollowing).toBe(true)

    wrapper.vm.goPost(10)
    expect(push).toHaveBeenCalledWith('/community/post/10')
  })
})
