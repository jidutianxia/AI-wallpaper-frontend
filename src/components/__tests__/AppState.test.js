import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppState from '../AppState.vue'
import { mountOptions } from '@/test/testUtils'

describe('AppState', () => {
  it('renders empty state text', () => {
    const wrapper = mount(AppState, mountOptions({
      props: { description: '暂无结果' }
    }))

    expect(wrapper.text()).toContain('暂无结果')
  })

  it('emits retry from error state', async () => {
    const wrapper = mount(AppState, mountOptions({
      props: {
        type: 'error',
        description: '加载失败',
        retryable: true
      }
    }))

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})
