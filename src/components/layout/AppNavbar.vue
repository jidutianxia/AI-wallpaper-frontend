<script setup>
import { nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ClickOutside as vClickOutside } from 'element-plus'
import { Search, Menu, Bell, Sunny, Moon, User, SwitchButton, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { useTheme } from '@/composables/useTheme'
import { getAvatarUrl } from '@/utils/imageHelper'

defineEmits(['login', 'logout', 'notify'])

const router = useRouter()
const userStore = useUserStore()
const { isDark, toggleTheme } = useTheme()

const searchPanel = ref(null)
const searchInput = ref(null)
const searchKeyword = ref('')
const isSearchFocused = ref(false)
const activeMain = ref('hot')
const mobileMenuOpen = ref(false)

const mainCategories = [
  { key: 'hot', label: '热门推荐' },
  { key: 'type', label: '壁纸类型' },
  { key: 'class', label: '壁纸分类' },
  { key: 'ratio', label: '分辨率' },
  { key: 'color', label: '颜色分类' }
]

const submap = {
  hot: ['最新', '热门', '下载最多'],
  type: ['插画', '二次元', '风景', '极简', '赛博朋克', '像素风', '3D 渲染'],
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
    { label: '黑色', color: '#222222' },
    { label: '白色', color: '#ffffff' }
  ]
}

const closeSearch = () => {
  isSearchFocused.value = false
}

const handleSearch = () => {
  const q = searchKeyword.value.trim()
  router.push({ path: '/search', query: q ? { q } : {} })
  closeSearch()
}

const selectSub = (sub) => {
  const query = searchKeyword.value.trim() ? { q: searchKeyword.value.trim() } : {}
  const resolutions = { '1080P': '1920x1080', '2K': '2560x1440', '4K': '3840x2160', '8K': '7680x4320', '超宽屏': 'ultrawide', '手机竖屏': 'portrait' }
  const colors = { '红色': 'red', '橙色': 'orange', '黄色': 'yellow', '绿色': 'green', '青色': 'cyan', '蓝色': 'blue', '紫色': 'purple', '黑色': 'black', '白色': 'white' }
  if (activeMain.value === 'ratio') query.res = resolutions[sub]
  else if (activeMain.value === 'color') { query.cat = 'color'; query.sub = colors[sub] }
  else if (activeMain.value === 'hot') query.sort = { '最新': 'latest', '热门': 'hot', '下载最多': 'download' }[sub]
  else { query.cat = 'hot'; query.sub = sub }
  router.push({ path: '/search', query })
  closeSearch()
}
const searchFocusOut = (event) => { if (!searchPanel.value?.contains(event.relatedTarget)) closeSearch() }
const closeSearchFromKeyboard = () => {
  searchInput.value?.focus()
  closeSearch()
}
const focusFilters = async () => {
  isSearchFocused.value = true
  await nextTick()
  searchPanel.value?.querySelector('.cat-pill')?.focus()
}
watch(() => router.currentRoute?.value?.fullPath, () => { closeSearch(); mobileMenuOpen.value = false })

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
</script>

<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-left">
        <el-button class="hamburger" aria-label="打开导航" :aria-expanded="mobileMenuOpen" text @click="mobileMenuOpen = !mobileMenuOpen">
          <el-icon><Menu /></el-icon>
        </el-button>
        <router-link to="/" class="nav-brand"><svg class="brand-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9V2h7M15 2h7v7M22 15v7h-7M9 22H2v-7" /><path d="m7 16 5-8 5 8" /></svg><span>AI 壁纸</span></router-link>
        <div class="nav-links">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/category" class="nav-link">分类</router-link>
          <router-link to="/community" class="nav-link">社区</router-link>
          <router-link to="/user?tab=wallpaperFavorites" class="nav-link">收藏</router-link>
        </div>
      </div>

      <div ref="searchPanel" @focusout="searchFocusOut" @keydown.esc.stop="closeSearchFromKeyboard" v-show="!['/search', '/category'].includes(router.currentRoute?.value?.path)" class="nav-center" :class="{ expanded: isSearchFocused }" v-click-outside="closeSearch">
        <div class="search-wrapper">
          <el-input
            ref="searchInput"
            v-model="searchKeyword"
            aria-label="搜索壁纸" placeholder="搜索壁纸"
            clearable autocomplete="off" maxlength="120"
            class="search-input"
            :class="{ 'input-expanded': isSearchFocused }"
            @focus="isSearchFocused = true"
            @click="isSearchFocused = true"
            @keyup.enter="handleSearch" @keydown.down.prevent="focusFilters"
          >
            <template #prefix>
              <button class="nav-search-submit" aria-label="搜索" title="搜索" @click="handleSearch"><el-icon class="search-icon"><Search /></el-icon></button>
            </template>
          </el-input>

          <transition name="search-panel">
            <div v-if="isSearchFocused" class="search-categories" aria-label="快捷筛选">
              <div class="main-cats">
                <button v-for="cat in mainCategories" :key="cat.key" class="cat-pill" :class="{ active: activeMain === cat.key }" :aria-pressed="activeMain === cat.key" @mouseenter="activeMain = cat.key" @click="activeMain = cat.key">{{ cat.label }}</button>
              </div>
              <transition name="search-options" mode="out-in">
                <div :key="activeMain" class="sub-list">
                  <button v-for="sub in submap[activeMain]" :key="typeof sub === 'object' ? sub.label : sub" class="sub-item" @click="selectSub(typeof sub === 'object' ? sub.label : sub)"><span v-if="typeof sub === 'object'" class="color-dot" :style="{ background: sub.color }"/>{{ typeof sub === 'object' ? sub.label : sub }}</button>
                </div>
              </transition>
            </div>
          </transition>
        </div>
      </div>

      <div class="nav-right">
        <router-link to="/search" class="nav-search-shortcut" aria-label="搜索壁纸" title="搜索壁纸"><el-icon><Search /></el-icon></router-link>
        <router-link to="/community/compose" class="nav-publish" aria-label="发布作品" title="发布作品"><el-icon><Plus /></el-icon></router-link>
        <template v-if="userStore.isAuthenticated">
          <el-button class="notify-btn" aria-label="通知" circle @click="$emit('notify')">
            <el-icon><Bell /></el-icon>
          </el-button>
          <router-link to="/user" class="nav-link member-link" aria-label="个人中心" title="个人中心">
            <el-avatar :src="getAvatarUrl(userStore.info?.avatarUrl)" size="small" class="nav-avatar" />
            <span class="member-name">{{ userStore.info?.username }}</span>
          </router-link>
          <el-button class="logout-btn" circle aria-label="退出登录" title="退出登录" @click="$emit('logout')"><el-icon><SwitchButton /></el-icon></el-button>
        </template>
        <template v-else>
          <el-button circle aria-label="登录" title="登录" @click="$emit('login')"><el-icon><User /></el-icon></el-button>
        </template>
        <el-button class="theme-switch" circle :aria-label="isDark ? '切换浅色模式' : '切换深色模式'" @click="toggleTheme"><el-icon><Sunny v-if="isDark" /><Moon v-else /></el-icon></el-button>
      </div>
    </div>
  </nav>

  <transition name="fade">
    <div v-if="mobileMenuOpen" class="mobile-menu">
      <router-link to="/" class="mobile-link" @click="closeMobileMenu">首页</router-link>
      <router-link to="/category" class="mobile-link" @click="closeMobileMenu">分类</router-link>
      <router-link to="/community" class="mobile-link" @click="closeMobileMenu">社区</router-link>
      <router-link to="/user?tab=wallpaperFavorites" class="mobile-link" @click="closeMobileMenu">收藏</router-link>
      <router-link to="/community/compose" class="mobile-link" @click="closeMobileMenu" aria-label="发布作品" title="发布作品"><el-icon><Plus /></el-icon></router-link>
      <div v-if="userStore.isAuthenticated" class="mobile-account-actions">
        <el-button circle aria-label="通知" title="通知" @click="$emit('notify'); closeMobileMenu()"><el-icon><Bell /></el-icon></el-button>
        <el-button circle aria-label="退出登录" title="退出登录" @click="$emit('logout'); closeMobileMenu()"><el-icon><SwitchButton /></el-icon></el-button>
      </div>
    </div>
  </transition>
</template>
