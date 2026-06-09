import axios from 'axios'
import { ElMessage } from 'element-plus'
import { requestAuth } from '@/utils/authEvents'
import { getLocalStorageItem, removeLocalStorageItem } from '@/utils/storage'

// 请求失败需要尽快回到可交互状态；401 提醒做节流，避免并发接口重复弹登录提示。
const REQUEST_TIMEOUT_MS = 15000
const AUTH_WARNING_DEDUPE_MS = 1500
let lastUnauthorizedAt = 0

// 将传输层错误归一成稳定中文文案，后端业务错误仍优先展示后端 message。
export const getErrorMessage = (error) => {
  if (error.code === 'ECONNABORTED') return '请求超时，请稍后重试'
  if (!error.response) return '网络连接异常，请稍后重试'
  return error.response?.data?.message || error.message || '请求失败，请稍后重试'
}

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: REQUEST_TIMEOUT_MS
})

request.interceptors.request.use(
  config => {
    const token = getLocalStorageItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => {
    const res = response.data
    // 兼容后端 { code, message, data } 业务码，业务失败在这里统一中断调用链。
    if (res && res.code !== undefined && res.code !== 200) {
      const msg = res.message || '请求失败，请稍后重试'
      try { ElMessage.error(msg) } catch {}
      return Promise.reject(new Error(msg))
    }
    return response
  },
  error => {
    const status = error.response?.status
    if (status === 401) {
      // 401 表示会话失效：清 token 并只触发一次登录引导，防止多个接口同时失败造成提示风暴。
      removeLocalStorageItem('token')
      const now = Date.now()
      if (now - lastUnauthorizedAt > AUTH_WARNING_DEDUPE_MS) {
        lastUnauthorizedAt = now
        try { ElMessage.warning('请先登录后再进行操作') } catch {}
        requestAuth({ reason: 'unauthorized' })
      }
    } else {
      try { ElMessage.error(getErrorMessage(error)) } catch {}
    }
    return Promise.reject(error)
  }
)

export const unwrap = (r) => (r?.data?.data ?? r?.data)

export default request
