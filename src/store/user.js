import { defineStore } from 'pinia'
import request from '@/api/wallpaper'

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
    _extract(data) {
      // 兼容 {result:{...}} / {data:{...}} / 直接对象
      return data?.result ?? data?.data ?? data
    },
    _extractToken(data) {
      const d = this._extract(data) || {}
      // 兼容 token / access_token / Authorization("Bearer xxx")
      let t = d.token || d.access_token || d.authToken
      if (!t && typeof d.Authorization === 'string') {
        t = d.Authorization.replace(/^Bearer\s+/i, '')
      }
      return t
    },
    async login(payload) {
      try {
        const r = await request.post('/auth/login', payload)
        const data = this._extract(r.data)
        const token = this._extractToken(r.data)
        if (!token) throw new Error('登录响应缺少 token')
        this.token = token
        localStorage.setItem('token', this.token)
        await this.fetchUser()
        this.isLoggedIn = true
        try { window.dispatchEvent(new CustomEvent('auth-changed', { detail: { type: 'login' } })) } catch {}
        return data
      } catch (error) {
        throw error
      }
    },
    
    async register(payload) {
      try {
        const r = await request.post('/auth/register', payload)
        return this._extract(r.data)
      } catch (error) {
        throw error
      }
    },
    
    async fetchUser() {
      try {
        const r = await request.get('/auth/me')
        const data = this._extract(r.data)
        this.info = data
        this.isLoggedIn = true
      } catch (error) {
        this.logout()
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
        // 如果有 token，先标记为“已登录”（但 info 可能为空）
        // 这可以防止路由守卫在 fetchUser 完成前就拦截
        this.isLoggedIn = true 
        try {
          await this.fetchUser()
        } catch (error) {
          this.logout()
        }
      }
    }
  }
})
