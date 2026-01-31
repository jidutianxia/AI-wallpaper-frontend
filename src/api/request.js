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

export const unwrap = (r) => (r?.data?.data ?? r?.data?.result ?? r?.data)

export default request
