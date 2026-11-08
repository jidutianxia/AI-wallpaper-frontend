import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import MediaSurface from '../MediaSurface.vue'
let enter, wrapper
beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class { constructor(fn) { enter = fn } observe() {} disconnect() {} })
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
})
afterEach(() => { wrapper?.unmount(); vi.unstubAllGlobals() })
describe('media loading lifecycle', () => {
  it('does not request media outside the viewport, reveals after load, and retries a failed source', async () => {
    wrapper = mount(MediaSurface, { props: { src: '/uploads/a.jpg', alt: '作品' } })
    expect(wrapper.find('img').exists()).toBe(false)
    enter([{ isIntersecting: true }]); await flushPromises()
    expect(wrapper.find('img').attributes('src')).toContain('/uploads/a.jpg')
    await wrapper.find('img').trigger('load')
    expect(wrapper.attributes('aria-busy')).toBe('false')
    await wrapper.setProps({ src: '/uploads/b.jpg' })
    expect(wrapper.attributes('aria-busy')).toBe('true')
    await wrapper.find('img').trigger('error')
    expect(wrapper.classes()).toContain('is-failed')
    await wrapper.find('.media-retry').trigger('click')
    expect(wrapper.classes()).not.toContain('is-failed')
  })
  it('uses a video poster without requesting video until hover and pauses the player on leave', async () => {
    wrapper = mount(MediaSurface, { props: { src: '/uploads/a.mp4' } })
    enter([{ isIntersecting: true }]); await flushPromises()
    expect(wrapper.find('img').attributes('src')).toContain('a.mp4.jpg')
    expect(wrapper.find('video').exists()).toBe(false)
    await wrapper.trigger('mouseenter'); await flushPromises()
    expect(wrapper.find('video').attributes('src')).toContain('a.mp4')
    await wrapper.trigger('mouseleave'); await flushPromises()
    expect(wrapper.find('video').element.paused).toBe(true)
  })
  it('does not autoplay when reduced motion is requested but permits explicit play', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
    wrapper = mount(MediaSurface, { props: { src: '/uploads/a.mp4', autoplay: true } })
    enter([{ isIntersecting: true }]); await flushPromises()
    expect(wrapper.find('video').exists()).toBe(false)
    await wrapper.setProps({ play: true }); await flushPromises()
    expect(wrapper.find('video').exists()).toBe(true)
    enter([{ isIntersecting: false }]); await flushPromises()
    expect(wrapper.find('video').element.paused).toBe(true)
  })
})
