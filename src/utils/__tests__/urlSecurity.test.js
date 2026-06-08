import { afterEach, describe, expect, it, vi } from 'vitest'
import { appendTokenParam, isSafeExternalUrl, isSafeImageUrl, openSecureWindow } from '../urlSecurity'

describe('urlSecurity', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accepts safe image urls and rejects executable protocols', () => {
    expect(isSafeImageUrl('/uploads/a.jpg')).toBe(true)
    expect(isSafeImageUrl('https://cdn.example.com/a.jpg')).toBe(true)
    expect(isSafeImageUrl('data:image/png;base64,abc')).toBe(true)
    expect(isSafeImageUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeImageUrl('data:text/html;base64,abc')).toBe(false)
  })

  it('appends encoded token parameters', () => {
    expect(appendTokenParam('/download', 'a b')).toBe('/download?token=a%20b')
    expect(appendTokenParam('/download?x=1', 'a&b')).toBe('/download?x=1&token=a%26b')
  })

  it('opens only safe external urls with noopener protection', () => {
    window.open = vi.fn()

    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false)
    expect(openSecureWindow('javascript:alert(1)')).toBe(false)
    expect(openSecureWindow('https://example.com/download')).toBe(true)
    expect(window.open).toHaveBeenCalledWith('https://example.com/download', '_blank', 'noopener,noreferrer')
  })
})
