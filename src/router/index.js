import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'
import { requestAuth } from '@/utils/authEvents'

const view = (name) => () => import(`@/views/${name}.vue`)

const routes = [
  { path: '/', component: view('Home') },
  { path: '/detail/:id', component: view('Detail') },
  { path: '/category/:id', component: view('Category') },
  { path: '/category', component: view('Category') },
  { path: '/search', component: view('Search') },
  { path: '/user', component: view('User'), meta: { requiresAuth: true, authFallback: '/' } },
  { path: '/community', component: view('Community') },
  { path: '/community/post/:id', component: view('CommunityDetail') },
  { path: '/community/post/:id/image/:index', component: view('CommunityImage') },
  {
    path: '/community/compose',
    component: view('CommunityCompose'),
    meta: { requiresAuth: true, authFallback: '/community' }
  },
  { path: '/register', component: view('Register') },
  { path: '/profile/:id', component: view('UserProfile') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const userStore = useUserStore()
  if (userStore.isAuthenticated) return true

  if (userStore.token && !userStore.info) {
    try {
      await userStore.fetchUser()
      if (userStore.isAuthenticated) return true
    } catch {}
  }

  requestAuth({ reason: 'route', redirect: to.fullPath })
  return to.meta.authFallback || '/'
})

export default router
