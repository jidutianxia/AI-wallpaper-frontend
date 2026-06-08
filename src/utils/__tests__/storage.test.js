import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getLocalStorageItem,
  getLocalStorageKeys,
  removeLocalStorageItem,
  setLocalStorageItem
} from '../storage'

describe('storage helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('reads, writes, removes, and lists localStorage keys', () => {
    setLocalStorageItem('token', 'abc')
    setLocalStorageItem('theme', 'dark')

    expect(getLocalStorageItem('token')).toBe('abc')
    expect(getLocalStorageKeys()).toEqual(expect.arrayContaining(['token', 'theme']))

    removeLocalStorageItem('token')

    expect(getLocalStorageItem('token', 'fallback')).toBe('fallback')
  })

  it('returns fallbacks and does not throw when storage access fails', () => {
    const blockedStorage = new Proxy({}, {
      get(_target, prop) {
        if (['getItem', 'setItem', 'removeItem'].includes(prop)) {
          return vi.fn(() => {
            throw new Error('blocked')
          })
        }
        return undefined
      },
      ownKeys() {
        throw new Error('blocked')
      }
    })
    vi.stubGlobal('localStorage', blockedStorage)

    expect(getLocalStorageItem('token', 'fallback')).toBe('fallback')
    expect(() => setLocalStorageItem('token', 'abc')).not.toThrow()
    expect(() => removeLocalStorageItem('token')).not.toThrow()
    expect(getLocalStorageKeys()).toEqual([])
  })
})
