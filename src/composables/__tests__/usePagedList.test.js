import { describe, expect, it, vi } from 'vitest'
import {
  isStaleRequestError,
  useCancelableRequest,
  usePagedList
} from '../usePagedList'

const createDeferred = () => {
  let resolve
  let reject
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, resolve, reject }
}

describe('useCancelableRequest', () => {
  it('ignores stale results when a newer request has started', async () => {
    const first = createDeferred()
    const second = createDeferred()
    const { loading, run } = useCancelableRequest()

    const firstRun = run(() => first.promise)
    const secondRun = run(() => second.promise)

    first.resolve('old')
    await expect(firstRun.then(() => false, isStaleRequestError)).resolves.toBe(true)
    expect(loading.value).toBe(true)

    second.resolve('new')
    await expect(secondRun).resolves.toBe('new')
    expect(loading.value).toBe(false)
  })
})

describe('usePagedList', () => {
  it('normalizes paged responses and appends later pages', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ records: [{ id: 1, name: 'first' }], totalCount: 2, current: 1, pageSize: 1 })
      .mockResolvedValueOnce({ list: [{ id: 2, name: 'second' }], count: 2, current: 2, pageSize: 1 })

    const list = usePagedList({
      fetcher,
      initialPageSize: 1,
      normalizeItem: (item) => ({ ...item, normalized: true })
    })

    await list.load()
    expect(list.items.value).toEqual([{ id: 1, name: 'first', normalized: true }])
    expect(list.hasMore.value).toBe(true)

    await list.load({ page: 2, append: true })

    expect(fetcher).toHaveBeenLastCalledWith({ page: 2, size: 1 })
    expect(list.items.value).toEqual([
      { id: 1, name: 'first', normalized: true },
      { id: 2, name: 'second', normalized: true }
    ])
    expect(list.total.value).toBe(2)
    expect(list.hasMore.value).toBe(false)
  })
})
