import { describe, expect, it } from 'vitest'
import { validateImageFile, validateUploadCount } from '../uploadValidation'

const file = (type, sizeMB = 1) => ({
  type,
  size: sizeMB * 1024 * 1024
})

describe('uploadValidation', () => {
  it('accepts supported image files within the configured size', () => {
    expect(validateImageFile(file('image/png', 1), { maxSizeMB: 2 })).toEqual({
      valid: true,
      message: ''
    })
  })

  it('rejects missing, unsupported, and oversized files', () => {
    expect(validateImageFile(null).valid).toBe(false)
    expect(validateImageFile(file('application/pdf')).message).toContain('仅支持')
    expect(validateImageFile(file('image/png', 11), { maxSizeMB: 10 }).message).toBe('图片大小不能超过 10MB')
  })

  it('validates upload count limits', () => {
    expect(validateUploadCount([1, 2], 3).valid).toBe(true)
    expect(validateUploadCount([1, 2, 3, 4], 3)).toEqual({
      valid: false,
      message: '最多只能上传 3 张图片'
    })
  })
})
