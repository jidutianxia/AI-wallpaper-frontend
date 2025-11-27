<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Menu, Sunny, Moon, Top, Setting } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { useDark, useToggle } from '@vueuse/core'
import { ClickOutside as vClickOutside } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

// 搜索相关
const searchKeyword = ref('')
const isSearchFocused = ref(false)
const activeMain = ref('hot')
const mobileMenuOpen = ref(false)

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

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
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

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const actionsSide = ref('right')
const toggleActionsSide = () => {
  actionsSide.value = actionsSide.value === 'right' ? 'left' : 'right'
}
const showSettingsDrawer = ref(false)
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
        <el-button class="hamburger" @click="toggleMobileMenu" circle>
          <el-icon><Menu /></el-icon>
        </el-button>
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
    <transition name="fade">
      <div class="mobile-menu" v-if="mobileMenuOpen">
        <router-link to="/" class="mobile-link" @click="mobileMenuOpen=false">首页</router-link>
        <router-link to="/category" class="mobile-link" @click="mobileMenuOpen=false">分类</router-link>
      </div>
    </transition>

    <div class="floating-actions" :class="actionsSide">
      <el-button class="fab" circle @click="toggleTheme()">
        <el-icon v-if="isDark"><Sunny /></el-icon>
        <el-icon v-else><Moon /></el-icon>
      </el-button>
      <el-button class="fab" circle @click="toggleActionsSide"><span class="icon-text">↔</span></el-button>
      <el-button class="fab" circle @click="showSettingsDrawer=true"><el-icon><Setting /></el-icon></el-button>
      <el-button class="fab" circle @click="scrollToTop">
        <el-icon><Top /></el-icon>
      </el-button>
    </div>
    
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
    <el-dialog v-model="showLoginDialog" title="用户登录" width="400px" class="login-dialog">
      <el-form :model="loginForm" label-width="80px" size="large" style="padding-top: 10px;">
        <el-form-item label="用户名">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="login-btn-group">
          <el-button class="login-btn" @click="showLoginDialog = false">取消</el-button>
          <el-button class="login-btn" type="primary" @click="handleLogin" :loading="loginLoading">登录</el-button>
        </div>
      </template>
    </el-dialog>
    <el-drawer v-model="showSettingsDrawer" title="快捷设置" direction="rtl" size="240px">
      <div class="settings">
        <div class="settings-item" style="justify-content: center; color: #909399; padding: 20px 0;">
          暂无更多设置
        </div>
      </div>
    </el-drawer>
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
  max-width: 100rem; /* 1600px */
  margin: 0 auto;
  height: 4.5rem; /* 72px */
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
  max-width: 25rem;
  min-width: 18.75rem; /* 300px */
  margin: 0 2rem;
  transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1); /* Smoother timing */
  position: relative;
  flex-shrink: 0; /* Prevent squashing by other elements */
}

.nav-center.expanded {
  max-width: 75rem; /* 1200px */
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

/* Custom Login Dialog Buttons */
.login-btn-group {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
:deep(.el-dialog__footer) {
  padding-top: 10px;
  padding-bottom: 24px;
}
.login-btn {
  padding: 8px 20px !important;
  height: 32px !important;
  border-radius: 8px !important;
  font-weight: 500;
}

.floating-actions {
  position: fixed;
  right: 1rem;
  bottom: 6rem;
  display: none; /* Hidden on Desktop */
  flex-direction: column;
  align-items: center;
  gap: 1rem; /* Increased gap slightly */
  z-index: 200;
}
.floating-actions.left { left: 1rem; right: auto; }
.fab { 
  width: 40px; 
  height: 40px; 
  padding: 0; 
  margin-left: 0 !important; /* Fix alignment issue */
  font-size: 1.1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
}
.fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}
.dark .fab {
  background: #1f2937;
  color: #e5e7eb;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}
.icon-text { font-size: 18px; line-height: 1; font-weight: bold; }
.settings { display: flex; flex-direction: column; gap: 1rem; }
.settings-item { display: flex; justify-content: space-between; align-items: center; }

/* Mobile Responsive */
@media (max-width: 768px) {
  .nav-container { padding: 0.6rem 1rem; height: 3.5rem; }
  .nav-links { display: none; }
  .hamburger { display: inline-flex; }
  .nav-right { gap: 0.5rem; }
  .theme-switch { display: none; }
  .nav-center { max-width: 100%; margin: 0 0.5rem; }
  .nav-center.expanded { max-width: 100%; }
  .search-wrapper { gap: 0.75rem; }
  .search-categories { flex-direction: column; align-items: flex-start; }
  .main-cats { overflow-x: auto; gap: 0.5rem; }
  .sub-dropdown { position: static; transform: none; margin-top: 0.5rem; min-width: 100%; }
  .sub-list { grid-template-columns: 1fr; }
  .cat-pill { padding: 0.375rem 0.875rem; }
  .sub-item { padding: 0.5rem 0.875rem; }
  .mobile-menu { padding: 0.5rem 1rem; background: rgba(255,255,255,0.95); border-top: 1px solid rgba(0,0,0,.06); }
  :root.dark .mobile-menu { background: rgba(11,18,32,0.95); border-top-color: rgba(255,255,255,.08); }
  .mobile-link { display: block; padding: 0.75rem 0; color: inherit; text-decoration: none; }
  .floating-actions { display: flex; }
}

/* Tablet Responsive */
@media (min-width: 768px) and (max-width: 1024px) {
  .nav-center { max-width: 56rem; }
  .sub-list { grid-template-columns: 1fr 1fr; }
  .search-wrapper { gap: 1rem; }
  .floating-actions { display: flex; }
}



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

<style>
/* Dark Dialog Overrides (Global) */
:root.dark .el-overlay {
  background-color: rgba(10, 15, 26, 0.9);
  /* backdrop-filter: blur(4px); Removed to prevent flickering */
  transform: translateZ(0); /* Force GPU layer to isolate from background */
}
:root.dark .el-dialog {
  background: #1f2937;
  color: #e5e7eb;
  border: 1px solid #374151;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}
:root.dark .el-dialog__title { color: #e5e7eb; font-weight: 600; }
:root.dark .el-dialog__headerbtn { top: 0; right: 0; padding: 16px; }
:root.dark .el-dialog__headerbtn .el-dialog__close { color: #9ca3af; }
:root.dark .el-dialog__headerbtn:hover .el-dialog__close { color: #fff; }
:root.dark .el-input__wrapper {
  background: #111827;
  border: 1px solid #374151;
  box-shadow: none !important;
  padding: 8px 12px;
}
:root.dark .el-input__wrapper.is-focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 1px #60a5fa !important;
}
:root.dark .el-input__inner { color: #e5e7eb; }
:root.dark .el-form-item__label { color: #d1d5db; }
</style>
