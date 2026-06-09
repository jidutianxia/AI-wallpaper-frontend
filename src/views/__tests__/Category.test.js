import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import Category from '../Category.vue'
import { getCategories, getWallpapers } from '@/api'
import { installBrowserMocks, mountOptions } from '@/test/testUtils'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push })
}))

vi.mock('@/api', () => ({
  getCategories: vi.fn(),
  getWallpapers: vi.fn()
}))

vi.mock('@/components/UnifiedCard.vue', () => ({
  default: {
    name: 'UnifiedCard',
    props: ['data'],
    template: '<article class="mock-card">{{ data.title }}</article>'
  }
}))

describe('Category view', () => {
  beforeEach(() => {
    installBrowserMocks()
    push.mockClear()
    vi.mocked(getCategories).mockResolvedValue([{ id: 1, name: 'Nature' }])
    vi.mocked(getWallpapers).mockResolvedValue({
      items: [{ id: 8, title: 'Forest', thumbUrl: '/forest.jpg', uploader: { username: 'alice' } }],
      total: 1
    })
  })

  it('loads default recommendations and renders cards', async () => {
    const wrapper = mount(Category, mountOptions())
    await flushPromises()

    expect(getCategories).toHaveBeenCalledOnce()
    expect(getWallpapers).toHaveBeenCalledWith({
      page: 1,
      size: 9,
      resolution: '',
      sortBy: 'likes'
    })
    expect(wrapper.text()).toContain('Forest')
  })

  it('navigates to search with the active filters when viewing more', async () => {
    const wrapper = mount(Category, mountOptions())
    await flushPromises()

    await wrapper.find('.view-more').trigger('click')

    expect(push).toHaveBeenCalledWith({ path: '/search', query: {} })
  })
})
