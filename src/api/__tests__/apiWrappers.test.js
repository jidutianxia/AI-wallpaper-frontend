import { beforeEach, describe, expect, it, vi } from 'vitest'
import request, { unwrap } from '../request'
import * as communityApi from '../community'
import * as notificationApi from '../notification'
import * as userApi from '../user'
import * as wallpaperApi from '../wallpaper'

vi.mock('../request', () => {
  const request = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
  return {
    default: request,
    unwrap: vi.fn((response) => response?.data?.data ?? response?.data ?? response)
  }
})

const responseOf = (data = { ok: true }) => ({ data: { data } })

describe('api wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    request.get.mockResolvedValue(responseOf())
    request.post.mockResolvedValue(responseOf())
    request.put.mockResolvedValue(responseOf())
    request.delete.mockResolvedValue(responseOf())
  })

  it('wraps wallpaper endpoints with the expected methods and payloads', async () => {
    await wallpaperApi.getWallpapers({ page: 1 })
    await wallpaperApi.getWallpaper(5)
    await wallpaperApi.updateWallpaperTags(5, ['nature'])
    await wallpaperApi.updateWallpaper(5, { title: 'New' })
    await wallpaperApi.deleteWallpaper(5)
    await wallpaperApi.downloadWallpaperApi(5)
    await wallpaperApi.likeWallpaper(5)
    await wallpaperApi.favoriteWallpaper(5)
    await wallpaperApi.submitWallpaperFromPost({ postId: 9 })
    const formData = new FormData()
    await wallpaperApi.uploadWallpaper(formData)
    await wallpaperApi.getCategories()

    expect(request.get).toHaveBeenCalledWith('/wallpapers', { params: { page: 1 } })
    expect(request.get).toHaveBeenCalledWith('/wallpapers/5')
    expect(request.put).toHaveBeenCalledWith('/wallpapers/5/tags', { tags: ['nature'] })
    expect(request.put).toHaveBeenCalledWith('/wallpapers/5', { title: 'New' })
    expect(request.delete).toHaveBeenCalledWith('/wallpapers/5')
    expect(request.get).toHaveBeenCalledWith('/wallpapers/5/download')
    expect(request.post).toHaveBeenCalledWith('/wallpapers/5/like')
    expect(request.post).toHaveBeenCalledWith('/wallpapers/5/favorite')
    expect(request.post).toHaveBeenCalledWith('/wallpapers/submit-from-post', { postId: 9 })
    expect(request.post).toHaveBeenCalledWith('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    expect(request.get).toHaveBeenCalledWith('/categories')
    expect(unwrap).toHaveBeenCalled()
  })

  it('wraps community endpoints and preserves upload request config', async () => {
    await communityApi.getCommunityPosts({ tag: 'art' })
    await communityApi.getCommunityPost(7)
    await communityApi.createCommunityPost({ title: 'Post' })
    await communityApi.updateCommunityPost(7, { title: 'Updated' })
    await communityApi.deleteCommunityPost(7)
    await communityApi.likeCommunityPost(7)
    await communityApi.favoriteCommunityPost(7)
    await communityApi.getCommunityPostComments(7, { page: 2 })
    await communityApi.commentCommunityPost(7, 'hello')
    await communityApi.getCommunityPostImageMeta(7, 1)
    await communityApi.likeCommunityPostImage(7, 1)
    await communityApi.favoriteCommunityPostImage(7, 1)
    await communityApi.downloadCommunityPostImage(7, 1)
    await communityApi.getCommunityTags()
    await communityApi.getCommunityRecentUsers()
    await communityApi.getMyFavoriteCommunityImages({ page: 1 })

    const formData = new FormData()
    const onUploadProgress = vi.fn()
    await communityApi.uploadCommunityImage(formData, {
      headers: { 'X-Trace-Id': 'abc' },
      onUploadProgress
    })

    expect(request.get).toHaveBeenCalledWith('/community/posts', { params: { tag: 'art' } })
    expect(request.get).toHaveBeenCalledWith('/community/posts/7')
    expect(request.post).toHaveBeenCalledWith('/community/posts', { title: 'Post' })
    expect(request.put).toHaveBeenCalledWith('/community/posts/7', { title: 'Updated' })
    expect(request.delete).toHaveBeenCalledWith('/community/posts/7')
    expect(request.post).toHaveBeenCalledWith('/community/posts/7/like')
    expect(request.post).toHaveBeenCalledWith('/community/posts/7/favorite')
    expect(request.get).toHaveBeenCalledWith('/community/posts/7/comments', { params: { page: 2 } })
    expect(request.post).toHaveBeenCalledWith('/community/posts/7/comments', { content: 'hello' })
    expect(request.get).toHaveBeenCalledWith('/community/posts/7/images/1')
    expect(request.post).toHaveBeenCalledWith('/community/posts/7/images/1/like')
    expect(request.post).toHaveBeenCalledWith('/community/posts/7/images/1/favorite')
    expect(request.get).toHaveBeenCalledWith('/community/posts/7/images/1/download')
    expect(request.get).toHaveBeenCalledWith('/community/tags')
    expect(request.get).toHaveBeenCalledWith('/community/recent-users')
    expect(request.get).toHaveBeenCalledWith('/community/my/favorite-images', { params: { page: 1 } })
    expect(request.post).toHaveBeenCalledWith('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Trace-Id': 'abc'
      },
      onUploadProgress
    })
  })

  it('wraps notification endpoints', async () => {
    await notificationApi.getNotifications({ unread: true })
    await notificationApi.markNotificationRead(3)
    await notificationApi.markAllNotificationsRead()

    expect(request.get).toHaveBeenCalledWith('/notifications', { params: { unread: true } })
    expect(request.post).toHaveBeenCalledWith('/notifications/3/read')
    expect(request.post).toHaveBeenCalledWith('/notifications/read-all')
  })

  it('wraps user endpoints and normalizes uploaded post previews', async () => {
    await userApi.login({ username: 'alice' })
    await userApi.register({ username: 'alice' })
    await userApi.getMe()
    await userApi.updateMe({ nickname: 'Alice' })
    await userApi.githubLogin('code')
    const formData = new FormData()
    await userApi.uploadFile(formData)
    await userApi.getUserStats()
    await userApi.getMyLikedWallpapers({ page: 1 })
    await userApi.getMyWallpapers({ page: 1 })
    await userApi.getMyLikes({ page: 1 })
    await userApi.getMyPosts({ page: 1 })
    await userApi.getMyPostFavorites({ page: 1 })
    await userApi.getUserReceivedComments({ page: 1 })
    await userApi.getUserReceivedLikes({ page: 1 })
    await userApi.getUserProfile(8)
    await userApi.followUser(8)
    await userApi.unfollowUser(8)
    await userApi.getUserFollowers(8, { page: 1 })
    await userApi.getUserFollowing(8, { page: 1 })
    await userApi.getUserCommunityPosts(8, { page: 1 })
    await userApi.getOtherUserLikedPosts(8, { page: 1 })
    await userApi.getOtherUserPostFavorites(8, { page: 1 })

    request.get.mockResolvedValueOnce(responseOf({
      records: [
        { id: 10, title: 'Upload', images: [{ url: '/upload.png' }], status: '' }
      ],
      totalCount: 1
    }))
    const uploads = await userApi.getUserUploads({ page: 1 })

    expect(request.post).toHaveBeenCalledWith('/auth/login', { username: 'alice' })
    expect(request.post).toHaveBeenCalledWith('/auth/register', { username: 'alice' })
    expect(request.get).toHaveBeenCalledWith('/auth/me')
    expect(request.put).toHaveBeenCalledWith('/auth/me', { nickname: 'Alice' })
    expect(request.post).toHaveBeenCalledWith('/auth/github', { code: 'code' })
    expect(request.post).toHaveBeenCalledWith('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    expect(request.get).toHaveBeenCalledWith('/user/stats')
    expect(request.get).toHaveBeenCalledWith('/user/liked-wallpapers', { params: { page: 1 } })
    expect(request.get).toHaveBeenCalledWith('/user/favorites', { params: { page: 1 } })
    expect(request.get).toHaveBeenCalledWith('/user/likes', { params: { page: 1 } })
    expect(request.get).toHaveBeenCalledWith('/community/my/posts', { params: { page: 1 } })
    expect(request.get).toHaveBeenCalledWith('/community/my/favorites', { params: { page: 1 } })
    expect(request.get).toHaveBeenCalledWith('/user/received/comments', { params: { page: 1 } })
    expect(request.get).toHaveBeenCalledWith('/user/received/likes', { params: { page: 1 } })
    expect(request.get).toHaveBeenCalledWith('/users/8/profile')
    expect(request.post).toHaveBeenCalledWith('/users/8/follow')
    expect(request.delete).toHaveBeenCalledWith('/users/8/follow')
    expect(request.get).toHaveBeenCalledWith('/users/8/followers', { params: { page: 1 } })
    expect(request.get).toHaveBeenCalledWith('/users/8/following', { params: { page: 1 } })
    expect(request.get).toHaveBeenCalledWith('/community/users/8/posts', { params: { page: 1 } })
    expect(request.get).toHaveBeenCalledWith('/users/8/likes', { params: { page: 1 } })
    expect(request.get).toHaveBeenCalledWith('/users/8/favorites', { params: { page: 1 } })
    expect(uploads).toEqual([
      expect.objectContaining({
        id: 10,
        title: 'Upload',
        thumbUrl: '/upload.png',
        status: 'approved'
      })
    ])
  })
})
