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

export const getWallpapers = (params) => request.get('/wallpapers', { params }).then(r => r.data)
export const getWallpaper = (id) => request.get(`/wallpapers/${id}`).then(r => r.data)
export const likeWallpaper = (id) => request.post(`/wallpapers/${id}/like`)
export const favoriteWallpaper = (id) => request.post(`/wallpapers/${id}/favorite`)
export const getCategories = () => request.get('/categories').then(r => r.data)
export const uploadWallpaper = (formData) => request.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

export const getMyFavorites = () => request.get('/wallpapers/my/favorites').then(r => r.data)
export const getMyLikes = () => request.get('/wallpapers/my/likes').then(r => r.data)

// Community APIs
export const getCommunityPosts = (params) => request.get('/community/posts', { params }).then(r => r.data)
export const getCommunityPost = (id) => request.get(`/community/posts/${id}`).then(r => r.data)
export const getCommunityRecentUsers = () => request.get('/community/recent-users').then(r => r.data)
export const getCommunityPostComments = (id, params) => request.get(`/community/posts/${id}/comments`, { params }).then(r => r.data)
export const createCommunityPost = (payload) => request.post('/community/posts', payload).then(r => r.data)
export const likeCommunityPost = (id) => request.post(`/community/posts/${id}/like`).then(r => r.data)
export const commentCommunityPost = (id, content) => request.post(`/community/posts/${id}/comments`, { content }).then(r => r.data)
export const getMyCommunityPosts = (params) => request.get('/community/my/posts', { params }).then(r => r.data)
export const getUserCommunityPosts = (userId, params) => request.get(`/community/users/${userId}/posts`, { params }).then(r => r.data)
export const favoriteCommunityPost = (id) => request.post(`/community/posts/${id}/favorite`).then(r => r.data)

export default request
