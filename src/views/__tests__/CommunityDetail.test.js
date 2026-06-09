import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import CommunityDetail from '../CommunityDetail.vue'
import {
  commentCommunityPost,
  getCommunityPost,
  getCommunityPostImageMeta
} from '@/api'
import { mountOptions } from '@/test/testUtils'

const push = vi.fn()
const toggleInteraction = vi.fn()
const share = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '5' } }),
  useRouter: () => ({ push })
}))

vi.mock('@/api', () => ({
  commentCommunityPost: vi.fn(),
  getCommunityPost: vi.fn(),
  getCommunityPostImageMeta: vi.fn()
}))

vi.mock('@/composables/useInteraction', () => ({
  useInteraction: () => ({ toggleInteraction })
}))

vi.mock('@/composables/useShare', () => ({
  useShare: () => ({ share })
}))

vi.mock('@/components/CommentItem.vue', () => ({
  default: {
    name: 'CommentItem',
    props: ['comment'],
    template: '<div class="comment-item">{{ comment.content }}</div>'
  }
}))

describe('CommunityDetail view', () => {
  beforeEach(() => {
    push.mockClear()
    toggleInteraction.mockClear()
    share.mockClear()
    vi.mocked(getCommunityPost).mockResolvedValue({
      id: 5,
      title: 'Shared Work',
      content: 'Detail content',
      tags: ['art'],
      images: ['/a.jpg'],
      likes: 1,
      favorites: 2,
      author: { id: 7, username: 'alice', avatarUrl: '/avatar.png' },
      comments: [{ content: 'first' }]
    })
    vi.mocked(commentCommunityPost).mockResolvedValue({})
    vi.mocked(getCommunityPostImageMeta).mockResolvedValue({ wallpaperInfo: { id: 99 } })
  })

  it('loads a post and supports comments, sharing, and image navigation', async () => {
    const wrapper = mount(CommunityDetail, mountOptions())
    await flushPromises()

    expect(getCommunityPost).toHaveBeenCalledWith(5)
    expect(wrapper.text()).toContain('Shared Work')
    expect(wrapper.text()).toContain('first')

    wrapper.vm.newComment = 'new comment'
    await wrapper.vm.submitComment()
    expect(commentCommunityPost).toHaveBeenCalledWith(5, 'new comment')
    expect(wrapper.text()).toContain('new comment')

    await wrapper.vm.shareDetail()
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: 'Shared Work' }))

    await wrapper.vm.goImage(0)
    expect(push).toHaveBeenCalledWith('/detail/99')
  })
})
