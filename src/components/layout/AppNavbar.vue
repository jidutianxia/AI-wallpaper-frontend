<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ClickOutside as vClickOutside } from 'element-plus'
import { Search, Menu, Bell } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { useTheme } from '@/composables/useTheme'
import { getAvatarUrl } from '@/utils/imageHelper'

defineEmits(['login', 'logout', 'notify'])

const router = useRouter()
const userStore = useUserStore()
const { isDark } = useTheme()

const searchKeyword = ref('')
const isSearchFocused = ref(false)
const activeMain = ref('hot')
const mobileMenuOpen = ref(false)

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

const closeSearch = () => {
  isSearchFocused.value = false
}

const handleSearch = () => {
  const q = searchKeyword.value.trim()
  if (!q) return
  router.push({ path: '/search', query: { q } })
  closeSearch()
}

const selectSub = (sub) => {
  router.push({
    path: '/search',
    query: {
      q: searchKeyword.value,
      cat: activeMain.value,
      sub
    }
  })
  closeSearch()
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
</script>

<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-left" :class="{ 'nav-hidden': isSearchFocused }">
        <el-button class="hamburger" text @click="mobileMenuOpen = !mobileMenuOpen">
          <el-icon><Menu /></el-icon>
        </el-button>
        <router-link to="/" class="nav-brand">AI壁纸</router-link>
        <div class="nav-links">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/category" class="nav-link">分类</router-link>
          <router-link to="/community" class="nav-link">社区</router-link>
        </div>
      </div>

      <div class="nav-center" :class="{ expanded: isSearchFocused }" v-click-outside="closeSearch">
        <div class="search-wrapper">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索壁纸..."
            class="search-input"
            :class="{ 'input-expanded': isSearchFocused }"
            @focus="isSearchFocused = true"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon class="search-icon" @click="handleSearch" style="cursor: pointer"><Search /></el-icon>
            </template>
          </el-input>

          <transition name="fade">
            <div v-if="isSearchFocused" class="search-categories">
              <div class="main-cats">
                <div
                  v-for="cat in mainCategories"
                  :key="cat.key"
                  class="cat-group"
                  @mouseenter="activeMain = cat.key"
                >
                  <button class="cat-pill" :class="{ active: activeMain === cat.key }">
                    {{ cat.label }}
                  </button>

                  <transition name="fade-list">
                    <div v-if="activeMain === cat.key && submap[cat.key]" class="sub-dropdown">
                      <div class="sub-list">
                        <button
                          v-for="sub in submap[cat.key]"
                          :key="typeof sub === 'object' ? sub.label : sub"
                          class="sub-item"
                          @click.stop="selectSub(typeof sub === 'object' ? sub.label : sub)"
                        >
                          <span
                            v-if="typeof sub === 'object'"
                            class="color-dot"
                            :style="{ background: sub.color }"
                          />
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

      <div class="nav-right">
        <template v-if="userStore.isAuthenticated">
          <el-button class="notify-btn" circle @click="$emit('notify')">
            <el-icon><Bell /></el-icon>
          </el-button>
          <router-link to="/user" class="nav-link">
            <el-avatar :src="getAvatarUrl(userStore.info?.avatarUrl)" size="small" class="nav-avatar" />
            {{ userStore.info?.username }}
          </router-link>
          <el-button size="small" @click="$emit('logout')">退出</el-button>
        </template>
        <template v-else>
          <el-button size="small" @click="$emit('login')">登录</el-button>
        </template>
        <el-switch v-model="isDark" class="theme-switch glow" inline-prompt active-text="暗色" inactive-text="浅色" />
      </div>
    </div>
  </nav>

  <transition name="fade">
    <div v-if="mobileMenuOpen" class="mobile-menu">
      <router-link to="/" class="mobile-link" @click="closeMobileMenu">首页</router-link>
      <router-link to="/category" class="mobile-link" @click="closeMobileMenu">分类</router-link>
      <router-link to="/community" class="mobile-link" @click="closeMobileMenu">社区</router-link>
    </div>
  </transition>
</template>
