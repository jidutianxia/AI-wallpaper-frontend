import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
})

// 请求拦截器 - 添加token
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误
request.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem('token')
      try { ElMessage.warning('请先登录后再进行操作') } catch {}
      window.dispatchEvent(new CustomEvent('auth-required'))
    } else {
      const msg = error.response?.data?.message || error.message
      try { ElMessage.error(msg) } catch {}
    }
    return Promise.reject(error)
  }
)

const unwrap = (r) => (r?.data?.data ?? r?.data?.result ?? r?.data)

export const getWallpapers = (params) => request.get('/wallpapers', { params }).then(unwrap)
export const getWallpaper = (id) => request.get(`/wallpapers/${id}`).then(unwrap)
export const likeWallpaper = (id) => request.post(`/wallpapers/${id}/like`)
export const favoriteWallpaper = (id) => request.post(`/wallpapers/${id}/favorite`)
export const getCategories = () => request.get('/categories').then(unwrap)
export const uploadWallpaper = (formData) => request.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

export const getMyFavorites = () => request.get('/wallpapers/my/favorites').then(unwrap)
export const getMyLikes = () => request.get('/wallpapers/my/likes').then(unwrap)

// Community APIs
export const getCommunityPosts = (params) => request.get('/community/posts', { params }).then(unwrap)
export const getCommunityPost = (id) => request.get(`/community/posts/${id}`).then(unwrap)
export const getCommunityRecentUsers = () => request.get('/community/recent-users').then(unwrap)
export const getCommunityPostComments = (id, params) => request.get(`/community/posts/${id}/comments`, { params }).then(unwrap)
export const createCommunityPost = (payload) => request.post('/community/posts', payload).then(unwrap)
export const likeCommunityPost = (id) => request.post(`/community/posts/${id}/like`).then(unwrap)
export const commentCommunityPost = (id, content) => request.post(`/community/posts/${id}/comments`, { content }).then(unwrap)
export const getMyCommunityPosts = (params) => request.get('/community/my/posts', { params }).then(unwrap)
export const getUserCommunityPosts = (userId, params) => request.get(`/community/users/${userId}/posts`, { params }).then(unwrap)
export const favoriteCommunityPost = (id) => request.post(`/community/posts/${id}/favorite`).then(unwrap)
// User Center APIs (v3)
export const getUserStats = () => request.get('/user/stats').then(unwrap)
export const getUserReceivedComments = (params) => request.get('/user/received/comments', { params }).then(unwrap)
export const getUserReceivedLikes = (params) => request.get('/user/received/likes', { params }).then(unwrap)
export const getUserLikes = (params) => request.get('/user/likes', { params }).then(unwrap)
export const getUserPostFavorites = (params) => request.get('/user/post-favorites', { params }).then(unwrap)
export const getUserFavorites = (params) => request.get('/user/favorites', { params }).then(unwrap)

// Image-level (community post) APIs - optional; UI will gracefully fallback if backend not ready
export const getCommunityPostImageMeta = (postId, index) => request.get(`/community/posts/${postId}/images/${index}`).then(unwrap)
export const likeCommunityPostImage = (postId, index) => request.post(`/community/posts/${postId}/images/${index}/like`).then(unwrap)
export const favoriteCommunityPostImage = (postId, index) => request.post(`/community/posts/${postId}/images/${index}/favorite`).then(unwrap)
export const downloadCommunityPostImage = (postId, index) => request.post(`/community/posts/${postId}/images/${index}/download`).then(unwrap)

export default request
