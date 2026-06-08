import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { AUTH_CHANGED_EVENT, AUTH_REQUIRED_EVENT } from '@/utils/authEvents'

export function useAuthSession(options = {}) {
  const router = useRouter()
  const userStore = useUserStore()
  const { onAuthRequired } = options

  const refreshCurrentRoute = () => {
    try {
      const current = router.currentRoute.value
      router.replace({
        path: current.path,
        query: current.query,
        hash: current.hash
      })
    } catch {}
  }

  const handleAuthRequired = (event) => {
    if (event?.detail?.reason === 'unauthorized') {
      userStore.clearSession({ notify: false })
    }
    onAuthRequired?.(event)
  }

  const handleAuthChanged = () => {
    refreshCurrentRoute()
  }

  const handleLogout = () => {
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  }

  onMounted(() => {
    window.addEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired)
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged)
    userStore.initAuth()
  })

  onUnmounted(() => {
    window.removeEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired)
    window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged)
  })

  return {
    userStore,
    handleLogout
  }
}
