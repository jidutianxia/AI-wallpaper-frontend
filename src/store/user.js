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
    async login(payload) {
      try {
        const r = await request.post('/auth/login', payload)
        this.token = r.data.token
        localStorage.setItem('token', this.token)
        await this.fetchUser()
        this.isLoggedIn = true
        return r.data
      } catch (error) {
        throw error
      }
    },
    
    async register(payload) {
      try {
        const r = await request.post('/auth/register', payload)
        return r.data
      } catch (error) {
        throw error
      }
    },
    
    async fetchUser() {
      try {
        const r = await request.get('/auth/me')
        this.info = r.data
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
    },
    
    async initAuth() {
      if (this.token) {
        try {
          await this.fetchUser()
        } catch (error) {
          this.logout()
        }
      }
    }
  }
})