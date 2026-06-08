import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/store/user'
import { useInteraction } from '../useInteraction'
import {
  favoriteCommunityPost,
  favoriteWallpaper,
  likeCommunityPost,
  likeCommunityPostImage,
  likeWallpaper
} from '@/api'
import { ElMessage } from 'element-plus'
import { requestAuth } from '@/utils/authEvents'

vi.mock('@/api', () => ({
  likeWallpaper: vi.fn(),
  favoriteWallpaper: vi.fn(),
  likeCommunityPost: vi.fn(),
  favoriteCommunityPost: vi.fn(),
  likeCommunityPostImage: vi.fn(),
  favoriteCommunityPostImage: vi.fn()
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn()
  }
}))

vi.mock('@/utils/authEvents', () => ({
  requestAuth: vi.fn()
}))

describe('useInteraction', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    setActivePinia(createPinia())
    const userStore = useUserStore()
    userStore.token = 'token'
    userStore.info = { id: 1, username: 'tester' }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('requests authentication and skips api calls when the user is not logged in', async () => {
    const userStore = useUserStore()
    userStore.token = ''
    userStore.info = null
    const target = { id: 10, liked: false, likes: 0 }
    const { toggleInteraction } = useInteraction()

    const result = await toggleInteraction(target, 'like', 'post')

    expect(result).toBe(false)
    expect(ElMessage.warning).toHaveBeenCalled()
    expect(requestAuth).toHaveBeenCalledWith({ reason: 'interaction' })
    expect(likeCommunityPost).not.toHaveBeenCalled()
    expect(target.liked).toBe(false)
  })

  it('skips duplicate interactions while a target is locked', async () => {
    const target = { id: 10, liked: false, likes: 0, _interacting: true }
    const { toggleInteraction } = useInteraction()

    const result = await toggleInteraction(target, 'like', 'wallpaper')

    expect(result).toBe(false)
    expect(likeWallpaper).not.toHaveBeenCalled()
    expect(target.liked).toBe(false)
  })

  it('optimistically updates and syncs definitive backend like state', async () => {
    vi.mocked(likeCommunityPost).mockResolvedValue({ liked: true, likes: 5 })
    const target = { id: 10, liked: false, likes: 0, favorited: false, favorites: 0 }
    const { toggleInteraction } = useInteraction()

    const result = await toggleInteraction(target, 'like', 'post', {
      successMessage: (post) => post.liked ? 'like ok' : 'unlike ok'
    })

    expect(result).toBe(true)
    expect(target.liked).toBe(true)
    expect(target.likes).toBe(5)
    expect(ElMessage.success).toHaveBeenCalledWith('like ok')
  })

  it('rolls back optimistic favorite state when the API fails', async () => {
    vi.mocked(favoriteCommunityPost).mockRejectedValue(new Error('network'))
    const target = { id: 10, liked: false, likes: 0, favorited: false, favorites: 0 }
    const { toggleInteraction } = useInteraction()

    const result = await toggleInteraction(target, 'favorite', 'post')

    expect(result).toBe(false)
    expect(target.favorited).toBe(false)
    expect(target.favorites).toBe(0)
    expect(ElMessage.error).toHaveBeenCalled()
  })

  it('handles wallpaper favorite interactions without a favorites counter', async () => {
    vi.mocked(favoriteWallpaper).mockResolvedValue({ isFavorited: true })
    const target = { id: 20, isLiked: false, likes: 0, isFavorited: false }
    const { toggleInteraction } = useInteraction()

    const result = await toggleInteraction(target, 'favorite', 'wallpaper')

    expect(result).toBe(true)
    expect(favoriteWallpaper).toHaveBeenCalledWith(20)
    expect(target.isFavorited).toBe(true)
    expect(target.favorites).toBeUndefined()
  })

  it('routes image-level likes through post id and image index options', async () => {
    vi.mocked(likeCommunityPostImage).mockResolvedValue({ isLiked: true, likes: 2 })
    const target = { id: 'image-row', isLiked: false, likes: 1, isFavorited: false, favorites: 0 }
    const { toggleInteraction } = useInteraction()

    const result = await toggleInteraction(target, 'like', 'image', {
      postId: 30,
      imageIndex: 4
    })

    expect(result).toBe(true)
    expect(likeCommunityPostImage).toHaveBeenCalledWith(30, 4)
    expect(target.isLiked).toBe(true)
    expect(target.likes).toBe(2)
  })
})
