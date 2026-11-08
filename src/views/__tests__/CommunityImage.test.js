import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import CommunityImage from '../CommunityImage.vue'
import {
  downloadCommunityPostImage,
  downloadWallpaperApi,
  getCategories,
  getCommunityPost,
  getCommunityPostImageMeta,
  submitWallpaperFromPost
} from '@/api'
import { mountOptions } from '@/test/testUtils'
import { ElMessage } from 'element-plus'

const push = vi.fn()
const share = vi.fn()
const toggleInteraction = vi.fn()
const userStore = { info: { id: 7, username: 'alice' } }

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '5', index: '0' } }),
  useRouter: () => ({ push })
}))

vi.mock('@/store/user', () => ({
  useUserStore: () => userStore
}))

vi.mock('@/api', () => ({
  downloadCommunityPostImage: vi.fn(),
  downloadWallpaperApi: vi.fn(),
  getCategories: vi.fn(),
  getCommunityPost: vi.fn(),
  getCommunityPostImageMeta: vi.fn(),
  submitWallpaperFromPost: vi.fn()
}))

vi.mock('@/composables/useInteraction', () => ({
  useInteraction: () => ({ toggleInteraction })
}))

vi.mock('@/composables/useShare', () => ({
  useShare: () => ({ share })
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

describe('CommunityImage view', () => {
  it('allows image likes before a post image is submitted as a wallpaper', async () => {
    vi.mocked(getCommunityPostImageMeta).mockResolvedValueOnce({ likes: 3, wallpaperInfo: null })
    const wrapper = mount(CommunityImage, mountOptions())
    await flushPromises()
    await wrapper.vm.toggleImageLike()
    expect(toggleInteraction).toHaveBeenCalledWith(expect.anything(), 'like', 'image', { postId: 5, imageIndex: 0 })
    wrapper.unmount()
  })
  beforeEach(() => {
    push.mockClear()
    share.mockClear()
    toggleInteraction.mockClear()
    vi.mocked(getCategories).mockResolvedValue([{ id: 1, name: 'Nature' }])
    vi.mocked(getCommunityPost).mockResolvedValue({
      id: 5,
      title: 'Image Post',
      content: 'Image content',
      images: ['/image.jpg'],
      tags: ['art'],
      author: { id: 7, username: 'alice', avatarUrl: '/avatar.png' },
      createdAt: '2026-01-01T00:00:00.000Z'
    })
    vi.mocked(getCommunityPostImageMeta).mockResolvedValue({
      width: 1920,
      height: 1080,
      fileSize: 2048,
      format: 'JPG',
      likes: 3,
      wallpaperInfo: { id: 99 }
    })
    vi.mocked(downloadCommunityPostImage).mockResolvedValue({ downloadUrl: 'https://example.com/download.jpg' })
    vi.mocked(downloadWallpaperApi).mockResolvedValue({ downloadUrl: 'https://example.com/wallpaper.jpg' })
    vi.mocked(submitWallpaperFromPost).mockResolvedValue({})
    window.open = vi.fn()
  })

  it('uses the wallpaper download policy and links to the wallpaper detail', async () => {
    const wrapper = mount(CommunityImage, mountOptions())
    await flushPromises()

    expect(getCommunityPost).toHaveBeenCalledWith(5)
    expect(getCommunityPostImageMeta).toHaveBeenCalledWith(5, 0)
    expect(wrapper.text()).toContain('Image Post')
    expect(wrapper.text()).toContain('1920')

    await wrapper.vm.download()
    expect(downloadWallpaperApi).toHaveBeenCalledWith(99)
    expect(downloadCommunityPostImage).not.toHaveBeenCalled()

    await wrapper.vm.shareImage()
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: 'Image Post' }))

    await wrapper.vm.goWallpaper()
    expect(push).toHaveBeenCalledWith('/detail/99')
  })

  it('opens safe post image downloads when the image is not a wallpaper', async () => {
    vi.mocked(getCommunityPostImageMeta).mockResolvedValueOnce({
      width: 1920,
      height: 1080,
      fileSize: 2048,
      format: 'JPG',
      likes: 3,
      wallpaperInfo: null
    })
    const wrapper = mount(CommunityImage, mountOptions())
    await flushPromises()

    await wrapper.vm.download()

    expect(downloadCommunityPostImage).toHaveBeenCalledWith(5, 0)
    expect(window.open).toHaveBeenCalledWith(
      'https://example.com/download.jpg',
      '_blank',
      'noopener,noreferrer'
    )
    expect(ElMessage.success).toHaveBeenCalledWith('开始下载')
  })
})
