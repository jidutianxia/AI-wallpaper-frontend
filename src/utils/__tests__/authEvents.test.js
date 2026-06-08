import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AUTH_CHANGED_EVENT,
  AUTH_REQUIRED_EVENT,
  notifyAuthChanged,
  requestAuth
} from '../authEvents'

describe('authEvents', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('emits auth-required with detail', () => {
    const dispatchEvent = vi.fn()
    vi.stubGlobal('window', { dispatchEvent })

    requestAuth({ reason: 'route' })

    expect(dispatchEvent).toHaveBeenCalledOnce()
    expect(dispatchEvent.mock.calls[0][0]).toMatchObject({
      type: AUTH_REQUIRED_EVENT,
      detail: { reason: 'route' }
    })
  })

  it('emits auth-changed with detail', () => {
    const dispatchEvent = vi.fn()
    vi.stubGlobal('window', { dispatchEvent })

    notifyAuthChanged({ type: 'login' })

    expect(dispatchEvent).toHaveBeenCalledOnce()
    expect(dispatchEvent.mock.calls[0][0]).toMatchObject({
      type: AUTH_CHANGED_EVENT,
      detail: { type: 'login' }
    })
  })
})
