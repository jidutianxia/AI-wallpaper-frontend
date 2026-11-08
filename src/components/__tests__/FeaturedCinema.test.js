import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import FeaturedCinema from '../FeaturedCinema.vue'
import { mountOptions } from '@/test/testUtils'

const open = vi.fn()
const isOpen = ref(false)
vi.mock('@/composables/usePhotoViewer', () => ({
  usePhotoViewer: () => ({ open, opening: ref(false), isOpen }),
}))
const works = [
  { id: 1, title: 'Aurora', url: '/a.jpg' },
  { id: 2, title: 'Lake', url: '/b.jpg' },
]
let wrapper
let reduce = false
const create = () => {
  wrapper = mount(
    FeaturedCinema,
    mountOptions({
      props: { wallpapers: works },
      global: { stubs: { Transition: true } },
    }),
  )
  return wrapper
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
  open.mockClear()
  isOpen.value = false
  reduce = false
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: reduce,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
})
afterEach(() => {
  wrapper?.unmount()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('FeaturedCinema interaction', () => {
  it('pauses the countdown while hovered, resumes the remaining time, and cleans up', async () => {
    create()
    await nextTick()
    await vi.advanceTimersByTimeAsync(3000)
    await wrapper.trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(8000)
    expect(wrapper.find('h1').text()).toBe('Aurora')
    await wrapper.trigger('mouseleave')
    await vi.advanceTimersByTimeAsync(4100)
    expect(wrapper.find('h1').text()).toBe('Lake')
    wrapper.unmount()
    wrapper = null
    expect(vi.getTimerCount()).toBe(0)
  })
  it('cycles with arrow keys and sends the selected original to the fullscreen viewer', async () => {
    create()
    await wrapper.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.find('h1').text()).toBe('Lake')
    await wrapper.find('[aria-label="全屏查看"]').trigger('click')
    expect(open).toHaveBeenCalledWith([
      expect.objectContaining({ id: 1 }),
      expect.objectContaining({
        id: 2,
        url: expect.stringContaining('/b.jpg'),
      }),
    ], 1)
    expect(wrapper.find('.el-dialog').exists()).toBe(false)
  })
  it('pauses only while fullscreen is open and then resumes the countdown', async () => {
    create()
    open.mockImplementationOnce(() => { isOpen.value = true })
    await wrapper.find('[aria-label="全屏查看"]').trigger('click')
    expect(wrapper.classes()).not.toContain('is-running')
    expect(wrapper.find('.cinema-play').attributes('aria-pressed')).toBe('false')
    await vi.advanceTimersByTimeAsync(8000)
    expect(wrapper.find('h1').text()).toBe('Aurora')
    isOpen.value = false
    await vi.advanceTimersByTimeAsync(7100)
    expect(wrapper.find('h1').text()).toBe('Lake')
  })
  it('switches device mode in place and toggles back to the image', async () => {
    create()
    const button = wrapper.find('[aria-label="锁屏预览"]')
    await button.trigger('click')
    expect(wrapper.classes()).toContain('view-phone')
    expect(button.attributes('aria-pressed')).toBe('true')
    await button.trigger('click')
    expect(wrapper.classes()).toContain('view-original')
  })
  it('allows explicit fullscreen immediately after swipe while suppressing the trailing image tap', async () => {
    create()
    await wrapper.trigger('pointerdown', { pointerType: 'touch', clientX: 250, clientY: 100 })
    await wrapper.trigger('pointerup', { pointerType: 'touch', clientX: 100, clientY: 100 })
    expect(wrapper.find('h1').text()).toBe('Lake')
    await wrapper.find('.cinema-picture').trigger('click')
    expect(open).not.toHaveBeenCalled()
    await wrapper.find('[aria-label="全屏查看"]').trigger('click')
    expect(open).toHaveBeenCalledOnce()
  })
  it('opens fullscreen on a stationary touch even when the browser suppresses click', async () => {
    create()
    const button = wrapper.find('[data-fullscreen]')
    await button.trigger('pointerdown', { pointerType: 'touch', clientX: 250, clientY: 100 })
    await button.trigger('pointerup', { pointerType: 'touch', clientX: 250, clientY: 100 })
    expect(open).toHaveBeenCalledOnce()
  })
  it('does not autoplay when reduced motion is preferred', async () => {
    reduce = true
    create()
    await nextTick()
    await vi.advanceTimersByTimeAsync(15000)
    expect(wrapper.find('h1').text()).toBe('Aurora')
    expect(wrapper.find('.cinema-play').exists()).toBe(false)
    await wrapper.find('[aria-label="下一张精选"]').trigger('click')
    expect(wrapper.find('h1').text()).toBe('Lake')
  })
})
