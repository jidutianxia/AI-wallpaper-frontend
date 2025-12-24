import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Detail from '@/views/Detail.vue'
import Category from '@/views/Category.vue'
import Search from '@/views/Search.vue'
import User from '@/views/User.vue'
import Community from '@/views/Community.vue'
import CommunityDetail from '@/views/CommunityDetail.vue'
import CommunityImage from '@/views/CommunityImage.vue'
import UserProfile from '@/views/UserProfile.vue'
import CommunityCompose from '@/views/CommunityCompose.vue'
import Register from '@/views/Register.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/detail/:id', component: Detail },
  { path: '/category/:id', component: Category },
  { path: '/category', component: Category },
  { path: '/search', component: Search },
  { path: '/user', component: User },
  { path: '/community', component: Community },
  { path: '/community/post/:id', component: CommunityDetail },
  { path: '/community/post/:id/image/:index', component: CommunityImage },
  { path: '/community/compose', component: CommunityCompose, beforeEnter: () => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.dispatchEvent(new CustomEvent('auth-required'))
      return '/community'
    }
  } },
  { path: '/register', component: Register },
  { path: '/profile/:id', component: UserProfile },
]

export default createRouter({
  history: createWebHistory(),
  routes
})
