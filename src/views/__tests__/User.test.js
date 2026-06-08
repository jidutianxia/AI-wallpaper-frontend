import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ElMessage } from 'element-plus'
import User from '../User.vue'
import {
  getCategories,
  getMyCommunityPosts,
  getUserStats
} from '@/api'
import { mountOptions } from '@/test/testUtils'

const routerPush = vi.fn()
const userStore = {
  token: '',
  isAuthenticated: false,
  info: null,
  initAuth: vi.fn(),
  fetchUser: vi.fn()
}

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush })
}))

vi.mock('@/store/user', () => ({
  useUserStore: () => userStore
}))

vi.mock('@/api', () => ({
  deleteCommunityPost: vi.fn(),
  deleteWallpaper: vi.fn(),
  favoriteWallpaper: vi.fn(),
  getCategories: vi.fn(),
  getMyCommunityPosts: vi.fn(),
  getMyFavoriteCommunityImages: vi.fn(),
  getMyLikedWallpapers: vi.fn(),
  getMyPostFavorites: vi.fn(),
  getMyWallpaperFavorites: vi.fn(),
  getUserLikes: vi.fn(),
  getUserStats: vi.fn(),
  getUserUploads: vi.fn(),
  likeWallpaper: vi.fn(),
  updateCommunityPost: vi.fn(),
  updateMe: vi.fn(),
  uploadFile: vi.fn(),
  uploadWallpaper: vi.fn()
}))

vi.mock('@/components/UnifiedCard.vue', () => ({
  default: {
    name: 'UnifiedCard',
    props: ['title', 'data'],
    template: '<article class="mock-card">{{ title || data?.title }}</article>'
  }
}))

vi.mock('@/utils/authEvents', () => ({
  notifyAuthChanged: vi.fn()
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      error: vi.fn(),
      success: vi.fn(),
      warning: vi.fn()
    },
    ElMessageBox: {
      confirm: vi.fn()
    }
  }
})

describe('User view', () => {
  beforeEach(() => {
    routerPush.mockClear()
    userStore.token = ''
    userStore.isAuthenticated = false
    userStore.info = null
    userStore.initAuth.mockReset()
    vi.mocked(getCategories).mockResolvedValue([{ id: 1, name: 'Nature' }])
    vi.mocked(getUserStats).mockResolvedValue({
      postCount: 2,
      favoriteCount: 3,
      likeCount: 4
    })
    vi.mocked(getMyCommunityPosts).mockResolvedValue({
      items: [{ id: 10, title: 'My Post', content: 'content', tags: ['tag'] }],
      total: 1
    })
  })

  it('redirects guests away from the user center', async () => {
    mount(User, mountOptions())
    await flushPromises()

    expect(ElMessage.warning).toHaveBeenCalled()
    expect(routerPush).toHaveBeenCalledWith('/')
    expect(getUserStats).not.toHaveBeenCalled()
  })

  it('loads authenticated profile stats and the default posts tab', async () => {
    userStore.token = 'token'
    userStore.isAuthenticated = true
    userStore.info = { id: 1, username: 'alice' }

    const wrapper = mount(User, mountOptions())
    await flushPromises()

    expect(getCategories).toHaveBeenCalledOnce()
    expect(getUserStats).toHaveBeenCalledOnce()
    expect(getMyCommunityPosts).toHaveBeenCalledWith({ page: 1, size: 50 })
    expect(wrapper.text()).toContain('alice')
    expect(wrapper.text()).toContain('My Post')
    expect(wrapper.text()).toContain('2')
  })
})
