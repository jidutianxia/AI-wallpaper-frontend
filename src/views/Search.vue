<template>
  <div class="search-page">
    <div class="ambient-background"></div>

    <!-- 核心交互区域 -->
    <div class="hero-section" :class="{ 'is-active': isInteractionActive }">
      <div class="hero-search-card" @click="handleFocus" v-click-outside="handleClickOutside">
        <!-- 搜索输入框 -->
        <div class="search-input-wrapper">
          <el-icon class="search-icon"><Search /></el-icon>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索你喜欢的壁纸..."
            class="hero-search-input"
            @focus="handleFocus"
            @keyup.enter="handleSearch"
          />
          <transition name="fade">
            <div class="search-actions" v-if="isInteractionActive">
              <el-dropdown trigger="click" @command="handleResolutionSelect">
                <span class="action-btn">
                  {{ filters.resolution || '分辨率' }} <el-icon><ArrowDown /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="">全部</el-dropdown-item>
                    <el-dropdown-item command="1920x1080">1080P</el-dropdown-item>
                    <el-dropdown-item command="2560x1440">2K</el-dropdown-item>
                    <el-dropdown-item command="3840x2160">4K</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <button class="primary-search-btn" @click="handleSearch">
                <el-icon><Right /></el-icon>
              </button>
            </div>
          </transition>
        </div>

        <!-- 快速分类导航 (动画显示) -->
        <transition name="expand">
          <div class="quick-nav" v-show="isInteractionActive">
            <div class="nav-tabs">
              <span class="nav-tab" :class="{ active: activeTab === 'hot' }" @click="switchTab('hot')">热门推荐</span>
              <span class="nav-tab" :class="{ active: activeTab === 'category' }" @click="switchTab('category')">壁纸分类</span>
              <span class="nav-tab" :class="{ active: activeTab === 'color' }" @click="switchTab('color')">颜色分类</span>
            </div>

            <div class="tab-content">
              <div v-if="activeTab === 'hot'" class="tags-cloud">
                 <span 
                  v-for="tag in hotTags" 
                  :key="tag" 
                  class="tag-chip" 
                  :class="{ active: activeSub === tag }"
                  @click="selectSub('hot', tag)"
                 >{{ tag }}</span>
              </div>
              <div v-if="activeTab === 'category'" class="tags-cloud">
                <span 
                  v-for="cat in categories" 
                  :key="cat.id" 
                  class="tag-chip"
                  :class="{ active: activeSub === String(cat.id) }"
                  @click="selectSub('category', String(cat.id))"
                >{{ cat.name }}</span>
              </div>
              <div v-if="activeTab === 'color'" class="tags-cloud">
                <span 
                  v-for="color in colors" 
                  :key="color.value"
                  class="tag-chip"
                  :class="{ active: activeSub === color.key }"
                  @click="selectSub('color', color.key)"
                >{{ color.name }}</span>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- 结果展示区域 - 默认一直显示 -->
    <div class="preview-section">
      <div class="section-header">
        <h2 class="section-title">{{ sectionTitle }}</h2>
      </div>
      
      <div class="wallpaper-grid-preview" v-loading="loading">
        <UnifiedCard
          v-for="wallpaper in wallpapers"
          :key="wallpaper.id"
          :data="toCard(wallpaper)"
          class="preview-card"
        />
      </div>

      <!-- 无结果提示 -->
      <div v-if="!loading && wallpapers.length === 0" class="no-results">
        <el-empty description="没有找到相关壁纸" />
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="handleCurrentChange"
          hide-on-single-page
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, ArrowDown, Right, ArrowRight } from '@element-plus/icons-vue'
import { ClickOutside as vClickOutside } from 'element-plus'
import UnifiedCard from '@/components/UnifiedCard.vue'
import { getWallpapers, getCategories } from '@/api'
import { formatAuthor } from '@/utils'

const router = useRouter()
const route = useRoute()

// 状态管理
const isInteractionActive = ref(false)
const searchQuery = ref('')
const activeTab = ref('hot')
const activeSub = ref('')
const loading = ref(false)
const wallpapers = ref([])
const categories = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(12) // Show more for the grid

// 筛选器
const filters = reactive({
  resolution: '',
  sortBy: 'created_at'
})

// 数据源
const hotTags = ['自然', '城市', '动漫', '二次元', '赛博朋克', '极简', '4K', '暗黑']
const colors = [
  { name: '红色', value: '#f56c6c', key: 'red' },
  { name: '橙色', value: '#e6a23c', key: 'orange' },
  { name: '黄色', value: '#f1c40f', key: 'yellow' },
  { name: '绿色', value: '#67c23a', key: 'green' },
  { name: '青色', value: '#1abc9c', key: 'cyan' },
  { name: '蓝色', value: '#409eff', key: 'blue' },
  { name: '紫色', value: '#9b59b6', key: 'purple' },
  { name: '黑色', value: '#303133', key: 'black' },
  { name: '白色', value: '#ffffff', key: 'white' },
]

// 计算属性
const sectionTitle = computed(() => {
  if (route.query.q) return `搜索结果: "${route.query.q}"`
  if (activeTab.value === 'category' && activeSub.value) {
    const cat = categories.value.find(c => String(c.id) === activeSub.value)
    return cat ? `${cat.name}` : '分类壁纸'
  }
  if (activeTab.value === 'color' && activeSub.value) {
    const col = colors.find(c => c.key === activeSub.value)
    return col ? `${col.name}系` : '颜色壁纸'
  }
  if (activeSub.value) return `推荐: ${activeSub.value}`
  if (activeTab.value === 'hot') return '热门推荐'
  return '精选壁纸'
})

// 核心逻辑
const handleFocus = () => {
  if (!isInteractionActive.value) {
    isInteractionActive.value = true
  }
}

const handleClickOutside = () => {
  if (isInteractionActive.value) {
    isInteractionActive.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  updateURL()
}

const switchTab = (tab) => {
  activeTab.value = tab
  activeSub.value = ''
  if (tab === 'hot') {
    filters.sortBy = 'likes'
  } else {
    filters.sortBy = 'created_at'
  }
  currentPage.value = 1
  updateURL()
}

const selectSub = (tab, sub) => {
  activeTab.value = tab
  activeSub.value = sub
  currentPage.value = 1
  updateURL()
}

const handleResolutionSelect = (res) => {
  filters.resolution = res
  currentPage.value = 1
  updateURL()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchWallpapers()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// API请求
const fetchCategoriesData = async () => {
  try {
    const res = await getCategories()
    categories.value = res || []
  } catch (error) {
    console.error('Failed to fetch categories', error)
  }
}

const fetchWallpapers = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      resolution: filters.resolution,
      sortBy: filters.sortBy
    }

    if (searchQuery.value) params.q = searchQuery.value
    
    if (activeTab.value === 'category' && activeSub.value) {
      params.category = activeSub.value
    } else if (activeTab.value === 'color' && activeSub.value) {
      params.color = activeSub.value
    } else if (activeTab.value === 'hot' && activeSub.value) {
      params.tag = activeSub.value
    }

    const res = await getWallpapers(params)
    wallpapers.value = res.items || []
    total.value = res.total || 0
  } catch (error) {
    console.error(error)
    wallpapers.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const toCard = (w) => ({
  id: w.id,
  title: w.title,
  thumb: w.thumbUrl || w.url,
  url: w.url || w.thumbUrl,
  resolution: w.resolution,
  previewVideoUrl: w.previewVideoUrl,
  likes: w.likes,
  author: formatAuthor(w.uploader || w.author)
})

// 更新URL参数
const updateURL = () => {
  const query = {}
  
  if (searchQuery.value) query.q = searchQuery.value
  if (activeTab.value !== 'hot') query.cat = activeTab.value
  if (activeSub.value) query.sub = activeSub.value
  if (filters.resolution) query.res = filters.resolution
  
  router.push({ path: '/search', query })
}

// 监听路由变化
watch(() => route.query, () => {
  searchQuery.value = route.query.q || ''
  activeTab.value = route.query.cat || 'hot'
  activeSub.value = route.query.sub || ''
  filters.resolution = route.query.res || ''
  
  fetchWallpapers()
}, { immediate: true })

onMounted(() => {
  fetchCategoriesData()
})
</script>

<style scoped>
.search-page {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 0 20px;
  padding-top: 15vh;
  transition: padding-top 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.search-page.is-active {
  padding-top: 40px; /* Search page specific adjustment if needed, handled by child margin typically */
}

.ambient-background {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: -1;
  pointer-events: none;
}

/* 核心搜索区域动画 */
.hero-section {
  width: 100%;
  max-width: 600px;
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 10;
}

.hero-section.is-active {
  max-width: 800px;
  transform: translateY(-5vh);
}

.hero-search-card {
  width: 100%;
  background-color: var(--app-bg-card);
  border-radius: 24px;
  padding: 16px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--app-border);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: all 0.4s ease;
  cursor: text;
}

.hero-section.is-active .hero-search-card {
  padding: 24px 32px;
  cursor: default;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background-color: transparent;
  transition: padding-bottom 0.3s ease;
}

.hero-section.is-active .search-input-wrapper {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--app-border);
  margin-bottom: 16px;
}

.search-icon {
  font-size: 20px;
  color: var(--app-text-secondary);
  margin-right: 12px;
}

.hero-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--app-text-main);
  font-size: 16px;
  letter-spacing: 0.02em;
}

.hero-search-input::placeholder {
  color: var(--app-text-secondary);
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-btn {
  color: var(--app-text-secondary);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.3s ease;
}

.action-btn:hover {
  color: var(--app-text-main);
}

.primary-search-btn {
  background-color: var(--app-color-primary);
  color: #fff;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.primary-search-btn:hover {
  opacity: 0.9;
}

/* 导航和标签 */
.quick-nav {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.nav-tabs {
  display: flex;
  gap: 24px;
}

.nav-tab {
  font-size: 14px;
  color: var(--app-text-secondary);
  cursor: pointer;
  padding-bottom: 4px;
  position: relative;
  transition: color 0.3s ease;
}

.nav-tab.active {
  color: var(--app-color-primary);
  font-weight: 500;
}

.nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--app-color-primary);
  border-radius: 2px;
}

.tab-content {
  min-height: 32px;
}

.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.tag-chip {
  font-size: 13px;
  color: var(--app-text-secondary);
  cursor: pointer;
  transition: color 0.3s ease;
}

.tag-chip:hover {
  color: var(--app-text-main);
}

.tag-chip.active {
  color: var(--app-text-main);
  font-weight: 500;
}

/* 预览区 */
.preview-section {
  width: 100%;
  max-width: 1200px;
  margin-top: 20px; /* 改为正边距 */
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--app-text-main);
  margin: 0;
  letter-spacing: 0.02em;
}

/* 三列网格 */
.wallpaper-grid-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

@media (max-width: 992px) {
  .wallpaper-grid-preview {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .wallpaper-grid-preview {
    grid-template-columns: 1fr;
  }
}

.pagination-wrapper {
  margin-top: 40px;
  display: flex;
  justify-content: center;
}

/* 动画类 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.expand-enter-active, .expand-leave-active {
  transition: all 0.4s ease;
  max-height: 200px;
  opacity: 1;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.fade-up-enter-active, .fade-up-leave-active {
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform: translateY(0);
  opacity: 1;
}
.fade-up-enter-from, .fade-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
