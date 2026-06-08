import { describe, expect, it } from 'vitest'
import {
  getAvatarUrl,
  getFullUrl,
  getImageUrl,
  getImageUrls,
  normalizePostImages
} from '../imageHelper'

describe('imageHelper', () => {
  it('preserves absolute, blob, and data urls', () => {
    expect(getFullUrl('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg')
    expect(getFullUrl('blob:http://local/blob-id')).toBe('blob:http://local/blob-id')
    expect(getFullUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
  })

  it('normalizes relative image paths against the backend origin', () => {
    expect(getFullUrl('/uploads/a.jpg')).toBe('http://localhost:8080/uploads/a.jpg')
    expect(getFullUrl('uploads/a.jpg')).toBe('http://localhost:8080/uploads/a.jpg')
  })

  it('extracts image urls from strings, objects, and arrays', () => {
    expect(getImageUrl({ src: '/image.jpg' })).toBe('http://localhost:8080/image.jpg')
    expect(getImageUrl({ path: 'nested/image.jpg' })).toBe('http://localhost:8080/nested/image.jpg')
    expect(getImageUrls([{ url: '/a.jpg' }, '', { src: '/b.jpg' }])).toEqual([
      'http://localhost:8080/a.jpg',
      'http://localhost:8080/b.jpg'
    ])
  })

  it('provides avatar fallback and keeps post objects intact', () => {
    const post = { images: [{ url: '/a.jpg' }] }

    expect(getAvatarUrl('')).toBe('https://i.pravatar.cc/150?u=default')
    expect(normalizePostImages(post)).toBe(post)
  })
})
