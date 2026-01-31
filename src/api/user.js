import request, { unwrap } from './request'

// Auth APIs
export const login = (payload) => request.post('/auth/login', payload)
export const register = (payload) => request.post('/auth/register', payload)
export const getMe = () => request.get('/auth/me').then(unwrap)
export const updateMe = (payload) => request.put('/auth/me', payload).then(unwrap) // Added missing API
export const githubLogin = (code) => request.post('/auth/github', { code }).then(unwrap)

// User Stats
export const getUserStats = () => request.get('/user/stats').then(unwrap)

// User Resources (My)
export const getMyPosts = (params) => request.get('/community/my/posts', { params }).then(unwrap)
export const getMyFavorites = (params) => request.get('/community/my/favorites', { params }).then(unwrap)
export const getMyLikes = (params) => request.get('/community/my/likes', { params }).then(unwrap)
export const getMyWallpaperFavorites = (params) => request.get('/wallpapers/my/favorites', { params }).then(unwrap)
export const getMyWallpaperLikes = (params) => request.get('/wallpapers/my/likes', { params }).then(unwrap) // Added missing API

// User Resources (Received)
export const getUserReceivedComments = (params) => request.get('/user/received/comments', { params }).then(unwrap)
export const getUserReceivedLikes = (params) => request.get('/user/received/likes', { params }).then(unwrap)

// Follow System
export const followUser = (userId) => request.post(`/users/${userId}/follow`).then(unwrap)
export const unfollowUser = (userId) => request.delete(`/users/${userId}/follow`).then(unwrap)
export const getFollowState = (userId) => request.get(`/users/${userId}/follow/state`).then(unwrap)
export const getFollowersCount = (userId) => request.get(`/users/${userId}/followers/count`).then(unwrap)

// Other User's Public Data (Community)
export const getUserCommunityPosts = (userId, params) => request.get(`/community/users/${userId}/posts`, { params }).then(unwrap)
// Note: These "Other User" APIs might not be in API_REFERENCE.md but are used in UserProfile.vue
export const getOtherUserLikedPosts = (userId, params) => request.get(`/users/${userId}/likes`, { params }).then(unwrap)
export const getOtherUserPostFavorites = (userId, params) => request.get(`/users/${userId}/post-favorites`, { params }).then(unwrap)

// Aliases for compatibility
export const getMyCommunityPosts = getMyPosts
export const getMyPostFavorites = getMyFavorites
export const getUserPostFavorites = getMyFavorites
export const getUserLikes = getMyLikes
