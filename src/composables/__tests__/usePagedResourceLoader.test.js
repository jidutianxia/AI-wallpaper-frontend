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
    const errors = reactive({ likes: null })
    const target = ref([{ id: 1 }])
    const { loadPagedResource } = usePagedResourceLoader({ loading, errors })
    const error = new Error('offline')

    const result = await loadPagedResource({
      loadingKey: 'likes',
      target,
      request: () => Promise.reject(error)
    })

    expect(result).toBeNull()
    expect(target.value).toEqual([])
    expect(loading.likes).toBe(false)
    expect(errors.likes).toBe(error)
  })

  it('ignores stale responses for the same loading key', async () => {
    const loading = reactive({ posts: false })
    const target = ref([])
    const { loadPagedResource } = usePagedResourceLoader({ loading })
    let resolveFirst

    const first = loadPagedResource({
      loadingKey: 'posts',
      target,
      request: () => new Promise(resolve => { resolveFirst = resolve })
    })
    const second = loadPagedResource({
      loadingKey: 'posts',
      target,
      request: () => Promise.resolve({ items: [{ id: 2 }], total: 1 })
    })

    await second
    resolveFirst({ items: [{ id: 1 }], total: 1 })
    await first

    expect(target.value).toEqual([{ id: 2 }])
    expect(loading.posts).toBe(false)
  })
})
