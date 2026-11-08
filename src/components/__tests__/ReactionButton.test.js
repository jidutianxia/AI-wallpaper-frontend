import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ReactionButton from '../ReactionButton.vue'
describe('confirmed reaction feedback', () => {
  it('waits for success before celebrating and does not celebrate a rollback', async () => {
    const w = mount(ReactionButton)
    await w.setProps({ active: true, pendingAction: 'like' })
    expect(w.classes()).not.toContain('is-celebrating')
    await w.setProps({ active: false, pendingAction: null })
    expect(w.classes()).not.toContain('is-celebrating')
    await w.setProps({ active: true, pendingAction: 'like' })
    await w.setProps({ pendingAction: null })
    expect(w.classes()).toContain('is-celebrating')
    expect(w.attributes('aria-pressed')).toBe('true')
    w.unmount()
  })

  it('locks the pair but shows progress only on the requested action', async () => {
    const like = mount(ReactionButton, { props: { pendingAction: 'like' } })
    const favorite = mount(ReactionButton, { props: { kind: 'favorite', pendingAction: 'like' } })
    expect(like.find('.reaction-pending').exists()).toBe(true)
    expect(favorite.find('.reaction-pending').exists()).toBe(false)
    expect(favorite.attributes('aria-busy')).toBe('false')
    expect(favorite.element.disabled).toBe(true)
    await like.setProps({ pendingAction: 'favorite' })
    await favorite.setProps({ pendingAction: 'favorite' })
    expect(like.find('.reaction-pending').exists()).toBe(false)
    expect(favorite.find('.reaction-pending').exists()).toBe(true)
    like.unmount()
    favorite.unmount()
  })

  it('clears the previous burst immediately when the reaction is undone', async () => {
    const w = mount(ReactionButton)
    await w.setProps({ active: true, pendingAction: 'like' })
    await w.setProps({ pendingAction: null })
    expect(w.find('.reaction-rays').exists()).toBe(true)
    await w.setProps({ active: false, pendingAction: 'like' })
    expect(w.find('.reaction-rays').exists()).toBe(false)
    expect(w.classes()).not.toContain('is-celebrating')
    await w.setProps({ pendingAction: null })
    expect(w.find('.reaction-rays').exists()).toBe(false)
    w.unmount()
  })
})
