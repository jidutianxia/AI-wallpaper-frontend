import axios from 'axios'

const request = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE || '/api'
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const getWallpapers = (params) => request.get('/wallpapers', { params }).then(r => r.data)
export const getWallpaper = (id) => request.get(`/wallpapers/${id}`).then(r => r.data)
export const likeWallpaper = (id) => request.post(`/wallpapers/${id}/like`)
export const favoriteWallpaper = (id) => request.post(`/wallpapers/${id}/favorite`)
export const getCategories = () => request.get('/categories').then(r => r.data)
export const uploadWallpaper = (formData) => request.post('/admin/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

export default request