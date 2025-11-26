<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { useDark, useToggle } from '@vueuse/core'
import { ClickOutside as vClickOutside } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

// 搜索相关
const searchKeyword = ref('')
const isSearchFocused = ref(false)
const activeMain = ref('hot')

// 模拟数据
const mainCategories = [
  { key: 'hot', label: '昨日热门' },
  { key: 'type', label: '壁纸种类' },
  { key: 'class', label: '壁纸分类' },
  { key: 'ratio', label: '分辨率' },
  { key: 'color', label: '颜色分类' }
]

const submap = {
  hot: ['最新', '推荐的', '昨日热门', '近三天热门', '上周热门', '上月热门', '近半年热门', '去年热榜'],
  type: ['插画', '二次元', '风景', '极简', '赛博朋克', '像素风', '3D渲染'],
  class: ['人物', '动物', '植物', '建筑', '美食', '运动', '科技'],
  ratio: ['4K', '8K', '1080P', '2K', '超宽屏', '手机竖屏'],
  color: [
    { label: '红色', color: '#ff4d4f' },
    { label: '橙色', color: '#fa8c16' },
    { label: '黄色', color: '#fadb14' },
    { label: '绿色', color: '#52c41a' },
    { label: '青色', color: '#13c2c2' },
    { label: '蓝色', color: '#1890ff' },
    { label: '紫色', color: '#722ed1' },
    { label: '黑白', color: '#000000' }
  ]
}

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
    closeSearch()
  }
}

const handleSearchFocus = () => {
  isSearchFocused.value = true
}

const closeSearch = () => {
  isSearchFocused.value = false
}

const selectSub = (sub) => {
  const cat = activeMain.value
  router.push({ path: '/search', query: { q: searchKeyword.value, cat, sub } })
  closeSearch()
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

const isDark = useDark({ selector: 'html', attribute: 'class', valueDark: 'dark', valueLight: '', storageKey: 'theme' })
const toggleTheme = useToggle(isDark)

// 默认使用暗色模式
if (localStorage.getItem('theme') === null) {
  isDark.value = true
}
</script>

<template>
  <div id="app" :class="{ 'search-active': isSearchFocused }">
    <nav class="navbar">
      <div class="nav-container">
        <!-- Logo & Links (Hidden when searching) -->
        <div class="nav-left" :class="{ 'nav-hidden': isSearchFocused }">
          <router-link to="/" class="nav-brand">AI壁纸</router-link>
          <div class="nav-links">
            <router-link to="/" class="nav-link">首页</router-link>
            <router-link to="/category" class="nav-link">分类</router-link>
          </div>
        </div>
        
        <!-- Search Area (Expands) -->
        <div class="nav-center" :class="{ 'expanded': isSearchFocused }" v-click-outside="closeSearch">
          <div class="search-wrapper">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索壁纸..."
              class="search-input"
              :class="{ 'input-expanded': isSearchFocused }"
              @focus="handleSearchFocus"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon class="search-icon"><Search /></el-icon>
              </template>
            </el-input>
            
            <!-- Categories (Visible only when focused) -->
            <transition name="fade">
              <div class="search-categories" v-if="isSearchFocused">
                <!-- Main Categories with relative positioning for sub-dropdowns -->
                <div class="main-cats">
                  <div 
                    v-for="cat in mainCategories" 
                    :key="cat.key"
                    class="cat-group"
                    @mouseenter="activeMain = cat.key"
                  >
                    <button 
                      class="cat-pill"
                      :class="{ active: activeMain === cat.key }"
                    >
                      {{ cat.label }}
                    </button>
                    
                    <!-- Sub Categories Dropdown (Nested for positioning) -->
                    <transition name="fade-list">
                      <div class="sub-dropdown" v-if="activeMain === cat.key && submap[cat.key]">
                        <div class="sub-list">
                          <button 
                            v-for="sub in submap[cat.key]" 
                            :key="typeof sub === 'object' ? sub.label : sub"
                            class="sub-item"
                            @click.stop="selectSub(typeof sub === 'object' ? sub.label : sub)"
                          >
                            <span v-if="typeof sub === 'object'" class="color-dot" :style="{ background: sub.color }"></span>
                            {{ typeof sub === 'object' ? sub.label : sub }}
                          </button>
                        </div>
                      </div>
                    </transition>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
        
        <!-- Right: User & Theme -->
        <div class="nav-right">
          <template v-if="userStore.isAuthenticated">
            <router-link to="/user" class="nav-link">{{ userStore.info?.username }}</router-link>
            <el-button @click="handleLogout" size="small">退出</el-button>
          </template>
          <template v-else>
            <el-button @click="showLoginDialog = true" size="small">登录</el-button>
          </template>
          <el-switch v-model="isDark" class="theme-switch glow" inline-prompt active-text="暗色" inactive-text="浅色" />
        </div>
      </div>
    </nav>
    
    <main class="main-content">
      <router-view />
    </main>
    
    <!-- 全局页脚 -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <h3>PixFlow</h3>
            <p>发现、分享和创造美好的设计作品。我们致力于为创作者提供最优质的平台。</p>
          </div>
          
          <div class="footer-links">
            <div class="link-group">
              <h4>创作相关</h4>
              <ul>
                <li><a href="#">首页</a></li>
                <li><a href="#">分类</a></li>
                <li><a href="#">关于我们</a></li>
              </ul>
            </div>
            
            <div class="link-group">
              <h4>帮助支持</h4>
              <ul>
                <li><a href="#">帮助中心</a></li>
                <li><a href="#">联系我们</a></li>
                <li><a href="#">意见反馈</a></li>
                <li><a href="#">服务条款</a></li>
              </ul>
            </div>
            
            <div class="link-group">
              <h4>订阅邮件</h4>
              <p>订阅我们的邮件，获取最新的设计灵感和作品推荐。</p>
              <div class="newsletter">
                <el-input placeholder="输入邮箱地址..." />
                <el-button type="primary">订阅</el-button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p>© 2023 PixFlow. 保留所有权利。</p>
        </div>
      </div>
    </footer>
    
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
  display: flex;
  flex-direction: column;
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgba(255,255,255,.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0,0,0,.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 2rem;
  max-width: 1600px;
  margin: 0 auto;
  height: 72px;
  position: relative;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 2rem;
  overflow: hidden;
  max-width: 600px;
  opacity: 1;
  transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}

.nav-left.nav-hidden {
  max-width: 0;
  opacity: 0;
  gap: 0;
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #409eff 0%, #a0cfff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-decoration: none;
  white-space: nowrap;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
  white-space: nowrap;
}

.nav-center {
  flex: 1;
  max-width: 400px;
  min-width: 300px; /* Prevent collapse */
  margin: 0 2rem;
  transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1); /* Smoother timing */
  position: relative;
  flex-shrink: 0; /* Prevent squashing by other elements */
}

.nav-center.expanded {
  max-width: 1200px; /* Replaced none with specific value for transition */
  margin: 0;
  flex: 1;
  display: flex;
  justify-content: flex-start;
  /* Shift left */
  transform: translateX(0); 
}

.search-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.search-input {
  width: 100%;
  transition: all 0.3s;
}

.nav-center.expanded .search-input {
  width: 320px; /* Width of the red box area roughly */
}

/* Search Categories */
.search-categories {
  display: flex;
  align-items: center;
  position: relative;
}

.main-cats {
  display: flex;
  gap: 8px;
}

.cat-group {
  position: relative;
  display: flex;
  align-items: center;
}

.cat-pill {
  padding: 6px 16px;
  border-radius: 99px;
  background: transparent;
  border: 1px solid transparent;
  color: #606266;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.cat-pill:hover, .cat-pill.active {
  background: rgba(64,158,255,0.1);
  color: #409eff;
}

.dark .cat-pill { color: #cbd5e1; }
.dark .cat-pill:hover, .dark .cat-pill.active { background: rgba(64,158,255,0.2); color: #93c5fd; }

/* Sub Categories Dropdown */
.sub-dropdown {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 12px;
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
  min-width: 260px;
  z-index: 101;
}

.dark .sub-dropdown {
  background: transparent;
  border-color: transparent;
}

.sub-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.sub-item {
  padding: 8px 16px;
  border-radius: 99px;
  text-align: center;
  background: #fff;
  border: 1px solid #e4e7ed;
  color: #606266;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.sub-item:hover {
  background: #f5f7fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  color: #409eff;
  border-color: #c6e2ff;
}

.dark .sub-item { 
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0; 
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}
.dark .sub-item:hover { 
  background: #1e293b; 
  color: #fff;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6);
  border-color: rgba(255, 255, 255, 0.3);
}

.color-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  border: 1px solid rgba(0,0,0,0.1);
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
}

.main-content {
  flex: 1;
  padding-top: 2rem;
}

.theme-switch { margin-left: 12px; }

/* Dark Mode */
:root.dark .navbar {
  background-color: rgba(11,18,32,0.8);
  border-bottom-color: rgba(255,255,255,0.08);
}
:root.dark .nav-link { color: #cbd5e1; }
:root.dark .nav-link:hover { color: #93c5fd; }

/* Footer Styles */
.footer {
  background: #2c3e50;
  color: white;
  padding: 3rem 0 1rem;
  margin-top: 4rem;
}
.dark .footer { background: #111827; }

.container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }

.footer-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 3rem;
  margin-bottom: 2rem;
}

.footer-brand h3 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #a0cfff;
}

.footer-brand p { opacity: 0.8; line-height: 1.6; }

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.link-group h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #a0cfff;
}

.link-group ul { list-style: none; padding: 0; }
.link-group li { margin-bottom: 0.5rem; }
.link-group a { color: rgba(255,255,255,0.7); text-decoration: none; transition: 0.3s; }
.link-group a:hover { color: #a0cfff; }
.link-group p { opacity: 0.8; margin-bottom: 1rem; font-size: 0.9rem; }

.newsletter { display: flex; gap: 0.5rem; }

.footer-bottom {
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 1rem;
  text-align: center;
  opacity: 0.6;
}

@media (max-width: 768px) {
  .footer-content { grid-template-columns: 1fr; }
  .footer-links { grid-template-columns: 1fr; }
  .nav-center.expanded .search-input { width: 100%; }
  .main-cats { display: none; } /* Hide cats on mobile or adapt */
}
</style>