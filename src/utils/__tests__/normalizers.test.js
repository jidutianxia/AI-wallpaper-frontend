import { describe, expect, it } from 'vitest'
import {
  normalizePagedResult,
  normalizePost,
  normalizeUser,
  normalizeWallpaper
} from '../normalizers'

describe('normalizers', () => {
  it('normalizes post field aliases and image objects', () => {
    const post = normalizePost({
      postId: 12,
      title: '作品',
      images: [{ url: '/a.jpg' }, { src: '/b.jpg' }],
      author: '{"id":7,"nickname":"作者","avatar":"/avatar.png"}',
      isLiked: true,
      favoriteCount: '4',
      commentCount: '2',
      likesCount: '9'
    })

    expect(post.id).toBe(12)
    expect(post.images).toEqual(['/a.jpg', '/b.jpg'])
    expect(post.author).toMatchObject({ id: 7, nickname: '作者', avatarUrl: '/avatar.png' })
    expect(post.liked).toBe(true)
    expect(post.favorites).toBe(4)
    expect(post.commentsCount).toBe(2)
    expect(post.likes).toBe(9)
  })

  it('normalizes wallpaper aliases without losing original fields', () => {
    const wallpaper = normalizeWallpaper({
      wallpaperId: 5,
      imageUrl: '/original.jpg',
      thumbnailUrl: '/thumb.jpg',
      uploader: { userId: 3, name: 'alice' },
      isFavorited: true,
      views: '20'
    })

    expect(wallpaper.id).toBe(5)
    expect(wallpaper.url).toBe('/original.jpg')
    expect(wallpaper.thumbUrl).toBe('/thumb.jpg')
    expect(wallpaper.uploader).toMatchObject({ id: 3, username: 'alice' })
    expect(wallpaper.favorited).toBe(true)
    expect(wallpaper.views).toBe(20)
  })

  it('normalizes common paged response shapes', () => {
    const page = normalizePagedResult({ records: [{ id: 1 }], totalCount: '6' }, normalizePost)

    expect(page.items).toHaveLength(1)
    expect(page.items[0].id).toBe(1)
    expect(page.total).toBe(6)
  })

  it('normalizes string users', () => {
    expect(normalizeUser('guest')).toMatchObject({ username: 'guest' })
  })
})
