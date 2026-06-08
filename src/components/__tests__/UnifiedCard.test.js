import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UnifiedCard from '../UnifiedCard.vue'
import { mountOptions } from '@/test/testUtils'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push })
}))

describe('UnifiedCard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    push.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders card data and navigates to detail by id', async () => {
    const wrapper = mount(UnifiedCard, mountOptions({
      props: {
        data: {
          id: 8,
          title: 'Wallpaper',
          author: 'alice',
          thumb: '/thumb.jpg'
        },
        likes: 12,
        favorites: 3
      }
    }))

    expect(wrapper.text()).toContain('Wallpaper')
    expect(wrapper.text()).toContain('alice')
    expect(wrapper.text()).toContain('12')
    expect(wrapper.text()).toContain('3')

    await wrapper.trigger('click')

    expect(push).toHaveBeenCalledWith('/detail/8')
  })

  it('does not navigate when target route is invalid', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mount(UnifiedCard, mountOptions({
      props: {
        title: 'Broken',
        to: '[object Object]'
      }
    }))

    await wrapper.trigger('click')

    expect(push).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })

  it('cycles through hover images and resets on mouseleave', async () => {
    const wrapper = mount(UnifiedCard, mountOptions({
      props: {
        title: 'Gallery',
        images: ['/a.jpg', '/b.jpg', '/c.jpg']
      }
    }))

    expect(wrapper.find('img').attributes('src')).toBe('/a.jpg')

    await wrapper.trigger('mouseenter')
    vi.advanceTimersByTime(1200)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('img').attributes('src')).toBe('/b.jpg')

    await wrapper.trigger('mouseleave')

    expect(wrapper.find('img').attributes('src')).toBe('/a.jpg')
  })
})
