import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Detail from '@/views/Detail.vue'
import Category from '@/views/Category.vue'
import Search from '@/views/Search.vue'
import User from '@/views/User.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/detail/:id', component: Detail },
  { path: '/category/:id', component: Category },
  { path: '/search', component: Search },
  { path: '/user', component: User },
]

export default createRouter({
  history: createWebHistory(),
  routes
})
