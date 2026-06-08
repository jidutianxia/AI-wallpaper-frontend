import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import Search from '../Search.vue'
import { getCategories, getWallpapers } from '@/api'
import { installBrowserMocks, mountOptions } from '@/test/testUtils'

const push = vi.fn()
const route = { query: { q: 'sky' } }

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => route
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

describe('Search view', () => {
  beforeEach(() => {
    installBrowserMocks()
    push.mockClear()
    route.query = { q: 'sky' }
    vi.mocked(getWallpapers).mockResolvedValue({
      items: [{ id: 1, title: 'Blue Sky', url: '/sky.jpg' }],
      total: 1
    })
    vi.mocked(getCategories).mockResolvedValue([{ id: 10, name: 'Nature' }])
  })

  it('loads initial search results from the route query', async () => {
    const wrapper = mount(Search, mountOptions())
    await flushPromises()

    expect(getWallpapers).toHaveBeenCalledWith(expect.objectContaining({
      q: 'sky',
      page: 1,
      size: 12
    }))
    expect(getCategories).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('Blue Sky')
  })

  it('pushes a search url when submitting a new query', async () => {
    const wrapper = mount(Search, mountOptions())
    await flushPromises()

    await wrapper.find('input').setValue('forest')
    await wrapper.find('input').trigger('keyup.enter')

    expect(push).toHaveBeenCalledWith({
      path: '/search',
      query: { q: 'forest' }
    })
  })
})
