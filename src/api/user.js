import request, { unwrap } from './request'
import { normalizePagedResult, normalizePost } from '@/utils/normalizers'

// Auth APIs
export const login = (payload) => request.post('/auth/login', payload).then(unwrap)
export const register = (payload) => request.post('/auth/register', payload).then(unwrap)
export const getMe = () => request.get('/auth/me').then(unwrap)
export const updateMe = (payload) => request.put('/auth/me', payload).then(unwrap) // Added missing API
export const githubLogin = (code) => request.post('/auth/github', { code }).then(unwrap)
export const uploadFile = (formData) => request.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(unwrap)

// User Stats
export const getUserStats = () => request.get('/user/stats').then(unwrap)

// User Resources (My)
export const getMyLikedWallpapers = (params) => request.get('/user/liked-wallpapers', { params }).then(unwrap) // My Liked Wallpapers (in WallpaperController)
export const getMyWallpapers = (params) => request.get('/user/favorites', { params }).then(unwrap) // My Favorites (Wallpapers)
export const getMyLikes = (params) => request.get('/user/likes', { params }).then(unwrap) // My Likes (Posts)
export const getMyPosts = (params) => request.get('/community/my/posts', { params }).then(unwrap) // My Posts
export const getMyPostFavorites = (params) => request.get('/community/my/favorites', { params }).then(unwrap) // My Favorites (Posts)
export const getUserUploads = (params) => request.get('/community/my/posts', { params }).then(r => {
  const res = unwrap(r)
  const pageData = normalizePagedResult(res, normalizePost)
  return pageData.items.map(p => ({
    id: p.id,
    title: p.title,
    ...p,
    thumbUrl: p.thumbUrl || p.cover || p.images?.[0] || '',
    status: p.status || 'approved'
  }))
}) // My Uploads (Mapped from My Posts)

// User Resources (Received)
export const getUserReceivedComments = (params) => request.get('/user/received/comments', { params }).then(unwrap)
export const getUserReceivedLikes = (params) => request.get('/user/received/likes', { params }).then(unwrap)

// Public User Profile & Relations
export const getUserProfile = (id) => request.get(`/users/${id}/profile`).then(unwrap)
export const followUser = (id) => request.post(`/users/${id}/follow`).then(unwrap)
export const unfollowUser = (id) => request.delete(`/users/${id}/follow`).then(unwrap)
export const getUserFollowers = (id, params) => request.get(`/users/${id}/followers`, { params }).then(unwrap)
export const getUserFollowing = (id, params) => request.get(`/users/${id}/following`, { params }).then(unwrap)

// Other User's Data (Restored/Assumed)
export const getUserCommunityPosts = (userId, params) => request.get(`/community/users/${userId}/posts`, { params }).then(unwrap)
export const getOtherUserLikedPosts = (userId, params) => request.get(`/users/${userId}/likes`, { params }).then(unwrap)
export const getOtherUserPostFavorites = (userId, params) => request.get(`/users/${userId}/favorites`, { params }).then(unwrap) // Assuming favorites

// Aliases
export const getMyFavorites = getMyWallpapers

export const getMyWallpaperFavorites = getMyWallpapers
export const getUserLikes = getMyLikes
export const getMyCommunityPosts = getMyPosts
export const getUserPostFavorites = getMyPostFavorites

