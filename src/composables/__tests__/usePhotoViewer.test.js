import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { usePhotoViewer } from '../usePhotoViewer'

const mocks = vi.hoisted(() => ({
  init: vi.fn(),
  destroy: vi.fn(),
  create: vi.fn(),
  events: {},
}))
vi.mock('photoswipe', () => ({
  default: class {
    constructor(options) {
      mocks.create(options)
    }
    init() {
      mocks.init()
    }
    on(name, callback) { mocks.events[name] = callback }
    destroy() {
      mocks.destroy()
    }
  },
}))
const Host = defineComponent({
  setup() {
    return usePhotoViewer()
  },
  template: '<div />',
})
describe('PhotoSwipe integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.matchMedia = vi.fn(() => ({ matches: false }))
  })
  it('uses real dimensions and localized controls, then releases the viewer on navigation', async () => {
    const wrapper = mount(Host)
    await wrapper.vm.open([
      {
        url: '/preview-assets/lake.jpg',
        width: 1600,
        height: 900,
        title: '山湖',
      },
    ])
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        dataSource: [
          expect.objectContaining({
            src: '/preview-assets/lake.jpg',
            width: 1600,
            height: 900,
            alt: '山湖',
          }),
        ],
        closeTitle: '关闭预览',
        wheelToZoom: true,
      }),
    )
    expect(mocks.init).toHaveBeenCalledOnce()
    wrapper.unmount()
    expect(mocks.destroy).toHaveBeenCalledOnce()
  })
  it('does not open a late viewer after the component has been unmounted', async () => {
    const wrapper = mount(Host)
    const pending = wrapper.vm.open([
      { url: '/preview-assets/lake.jpg', width: 1600, height: 900 },
    ])
    wrapper.unmount()
    await pending
    await flushPromises()
    expect(mocks.init).not.toHaveBeenCalled()
  })
  it('respects reduced motion', async () => {
    window.matchMedia = vi.fn(() => ({ matches: true }))
    const wrapper = mount(Host)
    await wrapper.vm.open([
      { url: '/preview-assets/lake.jpg', width: 1600, height: 900 },
    ])
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ showAnimationDuration: 0 }),
    )
    wrapper.unmount()
  })
  it('returns focus to the initiating control after the lazy viewer closes', async () => {
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()
    const wrapper = mount(Host)
    await wrapper.vm.open([{ url: '/preview-assets/lake.jpg', width: 1600, height: 900 }])
    trigger.blur()
    mocks.events.destroy()
    expect(document.activeElement).toBe(trigger)
    wrapper.unmount()
    trigger.remove()
  })
})
