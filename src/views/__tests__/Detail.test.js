import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import Detail from '../Detail.vue'
import { getWallpaper, getWallpapers } from '@/api'
import { getLocalStorageItem } from '@/utils/storage'
import { ElMessage } from 'element-plus'
import { mountOptions } from '@/test/testUtils'

const router = {
  back: vi.fn(),
  push: vi.fn()
}
const route = {
  params: { id: '5' }
}
const userStore = {
  isAuthenticated: false,
  info: null
}
const toggleInteraction = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => router
}))

vi.mock('@/store/user', () => ({
  useUserStore: () => userStore
}))

vi.mock('@/api', () => ({
  deleteWallpaper: vi.fn(),
  downloadWallpaperApi: vi.fn(),
  getCategories: vi.fn(),
  getWallpaper: vi.fn(),
  getWallpapers: vi.fn(),
  updateWallpaper: vi.fn()
}))

vi.mock('@/composables/useInteraction', () => ({
  useInteraction: () => ({ toggleInteraction })
}))

vi.mock('@/utils/storage', () => ({
  getLocalStorageItem: vi.fn()
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

describe('Detail view', () => {
  beforeEach(() => {
    router.back.mockClear()
    router.push.mockClear()
    route.params.id = '5'
    window.open = vi.fn()
    vi.mocked(getLocalStorageItem).mockReturnValue('token with spaces')
    vi.mocked(getWallpaper).mockResolvedValue({
      id: 5,
      title: 'Detail Wallpaper',
      url: '/original.jpg',
      width: 1920,
      height: 1080,
      downloads: 7,
      likes: 0,
      views: 1,
      createdAt: '2026-06-08T00:00:00Z',
      uploader: { id: 2, username: 'alice' }
    })
    vi.mocked(getWallpapers).mockResolvedValue({ items: [], total: 0 })
  })

  it('loads wallpaper details from the route id', async () => {
    const wrapper = mount(Detail, mountOptions())
    await flushPromises()

    expect(getWallpaper).toHaveBeenCalledWith('5')
    expect(wrapper.text()).toContain('Detail Wallpaper')
  })

  it('opens downloads with encoded token and noopener protection', async () => {
    const wrapper = mount(Detail, mountOptions())
    await flushPromises()

    await wrapper.find('.btn-gradient-orange').trigger('click')

    expect(window.open).toHaveBeenCalledWith(
      'http://localhost:8080/api/wallpapers/5/download?token=token%20with%20spaces',
      '_blank',
      'noopener,noreferrer'
    )
    expect(ElMessage.success).toHaveBeenCalled()
  })
})
