import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import Home from '../Home.vue'
import { getWallpapers } from '@/api/wallpaper'
import { ElMessage } from 'element-plus'
import { installBrowserMocks, mountOptions } from '@/test/testUtils'

vi.mock('@/api/wallpaper', () => ({
  getWallpapers: vi.fn()
}))

vi.mock('@/components/UnifiedCard.vue', () => ({
  default: {
    name: 'UnifiedCard',
    props: ['data'],
    template: '<article class="mock-card">{{ data.title }}</article>'
  }
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      error: vi.fn()
    }
  }
})

describe('Home view', () => {
  beforeEach(() => {
    installBrowserMocks()
    vi.mocked(getWallpapers).mockReset()
  })

  it('loads wallpapers and renders cards', async () => {
    vi.mocked(getWallpapers).mockResolvedValue({
      items: [{ id: 1, title: 'Mountains', thumbUrl: '/m.jpg', uploader: { username: 'alice' } }],
      total: 1
    })

    const wrapper = mount(Home, mountOptions())
    await flushPromises()

    expect(getWallpapers).toHaveBeenCalledWith({
      page: 1,
      size: 9,
      sort: 'latest'
    })
    expect(wrapper.text()).toContain('Mountains')
  })

  it('shows the error state when the first page fails', async () => {
    vi.mocked(getWallpapers).mockRejectedValue(new Error('network'))

    const wrapper = mount(Home, mountOptions())
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalled()
    expect(wrapper.find('.error-state').exists()).toBe(true)
  })
})
