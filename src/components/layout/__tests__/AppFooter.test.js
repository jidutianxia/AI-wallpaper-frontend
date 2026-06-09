import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppFooter from '../AppFooter.vue'
import { mountOptions } from '@/test/testUtils'

describe('AppFooter', () => {
  it('renders brand, support links, and newsletter form', () => {
    const wrapper = mount(AppFooter, mountOptions())

    expect(wrapper.text()).toContain('PixFlow')
    expect(wrapper.text()).toContain('帮助支持')
    expect(wrapper.text()).toContain('订阅')
  })
})
