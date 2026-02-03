import { defineStore } from 'pinia'
import { login, register, getMe } from '@/api/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    info: null,
    isLoggedIn: false
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
        localStorage.setItem('token', this.token)
        
        // Login response might contain userInfo, update it directly if available
        if (data.userInfo) {
          this.info = data.userInfo
          this.isLoggedIn = true
        }
        
        // Always fetch latest user info to ensure avatar and other details are up to date
        // This solves the issue where avatar might be missing after re-login
        await this.fetchUser()
        
        try { window.dispatchEvent(new CustomEvent('auth-changed', { detail: { type: 'login' } })) } catch {}
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
      try {
        const data = await getMe()
        this.info = data
        this.isLoggedIn = true
      } catch (error) {
        // If 401, the interceptor handles it, but we should also clean up
        // However, getMe failure might be due to network, so don't auto-logout unless 401 (handled by interceptor event)
        // But for safety, if we can't get user info, we are effectively not logged in fully
        // Let's rely on the interceptor for 401 logout.
        throw error
      }
    },
    
    logout() {
      this.token = ''
      this.info = null
      this.isLoggedIn = false
      localStorage.removeItem('token')
      try {
        const keys = Object.keys(localStorage)
        keys.forEach(k => {
          if (k.startsWith('community_interactions_')) localStorage.removeItem(k)
        })
      } catch {}
      try { window.dispatchEvent(new CustomEvent('auth-changed', { detail: { type: 'logout' } })) } catch {}
    },
    
    async initAuth() {
      if (this.token) {
        this.isLoggedIn = true 
        try {
          await this.fetchUser()
        } catch (error) {
           // If fetchUser fails (e.g. 401), interceptor will trigger auth-required
           // If it's 401, we should clear token.
           // Since we can't easily check status here without raw error object which might be wrapped.
           // We rely on interceptor.
        }
      }
    }
  }
})
