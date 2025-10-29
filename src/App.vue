<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

// 搜索相关
const searchKeyword = ref('')

// 登录相关
const showLoginDialog = ref(false)
const loginLoading = ref(false)
const loginForm = ref({
  username: '',
  password: ''
})

// 搜索处理
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      path: '/search',
      query: { q: searchKeyword.value.trim() }
    })
  }
}

// 登录处理
const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  
  loginLoading.value = true
  try {
    await userStore.login(loginForm.value)
    ElMessage.success('登录成功')
    showLoginDialog.value = false
    loginForm.value = { username: '', password: '' }
  } catch (error) {
    ElMessage.error('登录失败：' + (error.response?.data?.message || error.message))
  } finally {
    loginLoading.value = false
  }
}

// 退出登录
const handleLogout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/')
}

// 初始化用户状态
onMounted(() => {
  userStore.initAuth()
})
</script>

<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-left">
        <router-link to="/" class="nav-brand">AI壁纸</router-link>
        <div class="nav-links">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/category" class="nav-link">分类</router-link>
        </div>
      </div>
      
      <div class="nav-center">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索壁纸..."
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #suffix>
            <el-button 
              type="primary" 
              :icon="Search" 
              @click="handleSearch"
              size="small"
            />
          </template>
        </el-input>
      </div>
      
      <div class="nav-right">
        <template v-if="userStore.isAuthenticated">
          <router-link to="/user" class="nav-link">{{ userStore.info?.username }}</router-link>
          <el-button @click="handleLogout" size="small">退出</el-button>
        </template>
        <template v-else>
          <el-button @click="showLoginDialog = true" size="small">登录</el-button>
        </template>
      </div>
    </nav>
    
    <main class="main-content">
      <router-view />
    </main>
    
    <!-- 登录对话框 -->
    <el-dialog v-model="showLoginDialog" title="用户登录" width="400px">
      <el-form :model="loginForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="loginForm.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLoginDialog = false">取消</el-button>
        <el-button type="primary" @click="handleLogin" :loading="loginLoading">登录</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: bold;
  color: #409eff;
  text-decoration: none;
}

.nav-center {
  flex: 1;
  max-width: 400px;
  margin: 0 2rem;
}

.search-input {
  width: 100%;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-link {
  text-decoration: none;
  color: #606266;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s;
}

.nav-link:hover {
  color: #409eff;
  background-color: #f0f9ff;
}

.nav-link.router-link-active {
  color: #409eff;
  background-color: #ecf5ff;
}

.main-content {
  padding: 2rem;
  min-height: calc(100vh - 80px);
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .nav-left {
    width: 100%;
    justify-content: space-between;
    flex-direction: row;
  }
  
  .nav-links {
    gap: 1rem;
  }
  
  .nav-brand {
    font-size: 1.3rem;
  }
  
  .nav-center {
    width: 100%;
    margin: 0;
    max-width: none;
  }
  
  .nav-right {
    width: 100%;
    justify-content: center;
  }
  
  .main-content {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .navbar {
    padding: 0.75rem;
  }
  
  .nav-left {
    flex-direction: column;
    gap: 0.75rem;
    align-items: center;
  }
  
  .nav-links {
    gap: 0.75rem;
  }
  
  .nav-brand {
    font-size: 1.2rem;
  }
  
  .nav-link {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
  
  .search-input {
    font-size: 14px;
  }
  
  .nav-right .el-button {
    font-size: 14px;
  }
  
  .main-content {
    padding: 0.75rem;
  }
}
</style>
