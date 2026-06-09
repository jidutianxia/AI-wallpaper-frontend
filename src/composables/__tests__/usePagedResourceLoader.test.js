import { describe, expect, it, vi } from 'vitest'
import { reactive, ref } from 'vue'
import { usePagedResourceLoader } from '../usePagedResourceLoader'

describe('usePagedResourceLoader', () => {
  it('loads, normalizes, and stores paged items', async () => {
    const loading = reactive({ posts: false })
    const target = ref([])
    const onLoaded = vi.fn()
    const { loadPagedResource } = usePagedResourceLoader({ loading })

    const result = await loadPagedResource({
      loadingKey: 'posts',
      target,
      request: () => Promise.resolve({ records: [{ id: 1 }], totalCount: 1 }),
      normalizeItem: (item) => ({ ...item, title: 'normalized' }),
      onLoaded
    })

    expect(loading.posts).toBe(false)
    expect(target.value).toEqual([{ id: 1, title: 'normalized' }])
    expect(result.total).toBe(1)
    expect(onLoaded).toHaveBeenCalledWith(expect.objectContaining({ total: 1 }))
  })

  it('clears the target on request failure while still releasing loading state', async () => {
    const loading = reactive({ likes: false })
    const target = ref([{ id: 1 }])
    const { loadPagedResource } = usePagedResourceLoader({ loading })

    const result = await loadPagedResource({
      loadingKey: 'likes',
      target,
      request: () => Promise.reject(new Error('offline'))
    })

    expect(result).toBeNull()
    expect(target.value).toEqual([])
    expect(loading.likes).toBe(false)
  })
})
