import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkGuestDownloadLimit, getGuestRemainingDownloads } from '../downloadLimit'

describe('downloadLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows five guest downloads per UTC day and then blocks', () => {
    vi.setSystemTime(new Date('2026-06-08T10:00:00.000Z'))

    expect(getGuestRemainingDownloads()).toBe(5)
    expect(checkGuestDownloadLimit()).toBe(true)
    expect(checkGuestDownloadLimit()).toBe(true)
    expect(checkGuestDownloadLimit()).toBe(true)
    expect(checkGuestDownloadLimit()).toBe(true)
    expect(checkGuestDownloadLimit()).toBe(true)
    expect(getGuestRemainingDownloads()).toBe(0)
    expect(checkGuestDownloadLimit()).toBe(false)
  })

  it('uses a separate counter for a new day', () => {
    vi.setSystemTime(new Date('2026-06-08T10:00:00.000Z'))
    checkGuestDownloadLimit()

    vi.setSystemTime(new Date('2026-06-09T00:00:00.000Z'))

    expect(getGuestRemainingDownloads()).toBe(5)
  })
})
