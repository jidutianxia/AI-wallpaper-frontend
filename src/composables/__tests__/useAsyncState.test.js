import { describe, expect, it, vi } from 'vitest'
import { isStaleRequestError } from '../usePagedList'
import { useAsyncState } from '../useAsyncState'

const createDeferred = () => {
  let resolve
  let reject
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, resolve, reject }
}

describe('useAsyncState', () => {
  it('tracks loading, success state, and returned data', async () => {
    const task = vi.fn().mockResolvedValue({ id: 1 })
    const asyncState = useAsyncState(task, { initialData: null })

    const result = await asyncState.run('arg')

    expect(task).toHaveBeenCalledWith('arg')
    expect(result).toEqual({ id: 1 })
    expect(asyncState.data.value).toEqual({ id: 1 })
    expect(asyncState.state.value).toBe('success')
    expect(asyncState.loading.value).toBe(false)
    expect(asyncState.error.value).toBeNull()
  })

  it('tracks failures without replacing existing data', async () => {
    const error = new Error('failed')
    const asyncState = useAsyncState(vi.fn().mockRejectedValue(error), {
      initialData: ['existing']
    })

    await expect(asyncState.run()).rejects.toBe(error)

    expect(asyncState.data.value).toEqual(['existing'])
    expect(asyncState.error.value).toBe(error)
    expect(asyncState.state.value).toBe('error')
  })

  it('ignores stale results when a newer request wins', async () => {
    const first = createDeferred()
    const second = createDeferred()
    const task = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const asyncState = useAsyncState(task, { initialData: 'initial' })

    const firstRun = asyncState.run()
    const secondRun = asyncState.run()

    first.resolve('old')
    await expect(firstRun.then(() => false, isStaleRequestError)).resolves.toBe(true)
    expect(asyncState.data.value).toBe('initial')
    expect(asyncState.loading.value).toBe(true)

    second.resolve('new')
    await expect(secondRun).resolves.toBe('new')
    expect(asyncState.data.value).toBe('new')
    expect(asyncState.error.value).toBeNull()
  })

  it('retries the last task and resets to the initial data', async () => {
    const task = vi.fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second')
    const asyncState = useAsyncState(task, { initialData: 'initial' })

    await asyncState.run(1)
    await asyncState.retry()

    expect(task).toHaveBeenLastCalledWith(1)
    expect(asyncState.data.value).toBe('second')

    asyncState.reset()
    expect(asyncState.data.value).toBe('initial')
    expect(asyncState.state.value).toBe('idle')
    expect(asyncState.error.value).toBeNull()
  })
})
