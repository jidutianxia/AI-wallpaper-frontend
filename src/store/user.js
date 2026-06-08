import { defineStore } from 'pinia'
import { login, register, getMe } from '@/api/user'
import { notifyAuthChanged } from '@/utils/authEvents'
import {
  getLocalStorageItem,
  getLocalStorageKeys,
  removeLocalStorageItem,
  setLocalStorageItem
} from '@/utils/storage'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getLocalStorageItem('token'),
    info: null,
    isLoggedIn: false,
    fetchPromise: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.info
  },
  
  actions: {
    async login(payload) {
      try {
        const data = await login(payload)
        const token = data.token
        if (!token) throw new Error('登录响应缺少 token')
        
        this.token = token
        setLocalStorageItem('token', this.token)
        
        // Login response might contain userInfo, update it directly if available
        if (data.userInfo) {
          this.info = data.userInfo
          this.isLoggedIn = true
        }
        
        // Always fetch latest user info to ensure avatar and other details are up to date
        // This solves the issue where avatar might be missing after re-login
        await this.fetchUser()
        
        notifyAuthChanged({ type: 'login' })
        return data
      } catch (error) {
        throw error
      }
    },
    
    async register(payload) {
      try {
        return await register(payload)
      } catch (error) {
        throw error
      }
    },
    
    async fetchUser() {
      // Deduplicate requests
      if (this.fetchPromise) return this.fetchPromise

      this.fetchPromise = (async () => {
        try {
          const data = await getMe()
          this.info = data
          this.isLoggedIn = true
          return data
        } catch (error) {
          // If 401, the interceptor handles it, but we should also clean up
          // However, getMe failure might be due to network, so don't auto-logout unless 401 (handled by interceptor event)
          // But for safety, if we can't get user info, we are effectively not logged in fully
          // Let's rely on the interceptor for 401 logout.
          throw error
        } finally {
          this.fetchPromise = null
        }
      })()

      return this.fetchPromise
    },
    
    clearSession(options = {}) {
      const { notify = true, type = 'logout' } = options
      this.token = ''
      this.info = null
      this.isLoggedIn = false
      removeLocalStorageItem('token')
      try {
        const keys = getLocalStorageKeys()
        keys.forEach(k => {
          if (k.startsWith('community_interactions_')) removeLocalStorageItem(k)
        })
      } catch {}
      if (notify) notifyAuthChanged({ type })
    },

    logout() {
      this.clearSession({ type: 'logout' })
    },
    
    async initAuth() {
      if (this.token) {
        this.isLoggedIn = true 
        try {
          await this.fetchUser()
        } catch (error) {
          if (error?.response?.status === 401 || !getLocalStorageItem('token')) {
            this.clearSession({ notify: false })
          }
        }
      }
    }
  }
})
