<template>
  <div class="category-page">
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

    <!-- 预览展示区域 (网格) - 默认一直显示 -->
    <div class="preview-section">
      <div class="section-header">
        <h2 class="section-title">{{ previewTitle }}</h2>
        <div class="view-more" @click="viewMore">
          查看更多 <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
      
      <AppState v-if="loading" type="loading" :rows="3" />
      <AppState
        v-else-if="previewError"
        type="error"
        description="推荐加载失败，请重试"
        retryable
        @retry="fetchPreview(previewParams)"
      />

      <div v-else-if="previewWallpapers.length > 0" class="wallpaper-grid-preview">
        <UnifiedCard
          v-for="wallpaper in previewWallpapers"
          :key="wallpaper.id"
          :data="toCard(wallpaper)"
          class="preview-card"
        />
      </div>
      
      <div v-else class="no-results">
        <AppState description="暂无相关推荐" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ArrowDown, Right, ArrowRight } from '@element-plus/icons-vue'
import { ClickOutside as vClickOutside } from 'element-plus'
import UnifiedCard from '@/components/UnifiedCard.vue'
import AppState from '@/components/AppState.vue'
import { getWallpapers, getCategories } from '@/api'
import { formatAuthor, normalizeWallpaper } from '@/utils'
import { isStaleRequestError, usePagedList } from '@/composables/usePagedList'

const router = useRouter()

// 状态管理
const isInteractionActive = ref(false)
const searchQuery = ref('')
const activeTab = ref('hot')
const activeSub = ref('')
const categories = ref([])
const previewParams = ref({ sortBy: 'likes' })

// 筛选器
const filters = reactive({
  resolution: ''
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

const {
  items: previewWallpapers,
  loading,
  error: previewError,
  load: loadPreview
} = usePagedList({
  fetcher: getWallpapers,
  getParams: () => ({
    resolution: filters.resolution,
    ...previewParams.value
  }),
  normalizeItem: normalizeWallpaper,
  initialPageSize: 9
})

// 计算属性
const previewTitle = computed(() => {
  if (activeTab.value === 'category' && activeSub.value) {
    const cat = categories.value.find(c => String(c.id) === activeSub.value)
    return cat ? `${cat.name}` : '分类推荐'
  }
  if (activeTab.value === 'color' && activeSub.value) {
    const col = colors.find(c => c.key === activeSub.value)
    return col ? `${col.name}系` : '颜色推荐'
  }
  if (activeSub.value) return `推荐: ${activeSub.value}`
  return '热门推荐'
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
  router.push({ 
    path: '/search', 
    query: { 
      q: searchQuery.value,
      res: filters.resolution
    } 
  })
}

const switchTab = (tab) => {
  activeTab.value = tab
  activeSub.value = ''
  fetchPreview({ sortBy: tab === 'hot' ? 'likes' : 'created_at' })
}

const selectSub = (tab, sub) => {
  activeTab.value = tab
  activeSub.value = sub
  
  const params = { sortBy: tab === 'hot' ? 'likes' : 'created_at' }
  if (tab === 'category') params.category = sub
  else if (tab === 'color') params.color = sub
  else if (tab === 'hot') params.tag = sub

  fetchPreview(params)
}

const handleResolutionSelect = (res) => {
  filters.resolution = res
  const params = { resolution: res, sortBy: activeTab.value === 'hot' ? 'likes' : 'created_at' }
  if (activeTab.value === 'category' && activeSub.value) params.category = activeSub.value
  else if (activeTab.value === 'color' && activeSub.value) params.color = activeSub.value
  else if (activeTab.value === 'hot' && activeSub.value) params.tag = activeSub.value
  fetchPreview(params)
}

const viewMore = () => {
  const query = {}
  if (activeTab.value !== 'hot') query.cat = activeTab.value
  if (activeSub.value) query.sub = activeSub.value
  if (filters.resolution) query.res = filters.resolution
  
  router.push({ path: '/search', query })
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

const fetchPreview = async (params = {}) => {
  previewParams.value = params
  try {
    await loadPreview({ page: 1 })
  } catch (error) {
    if (isStaleRequestError(error)) return
    console.error(error)
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

onMounted(() => {
  fetchCategoriesData()
  // 默认加载热门推荐，无论是否聚焦搜索框
  fetchPreview({ sortBy: 'likes' })
})
</script>

<style scoped>
.category-page {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 0 20px;
  padding-top: 15vh;
  transition: padding-top 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
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
  margin-top: 20px; /* 改为正边距，因为卡片不再一开始就把预览区挤下去 */
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

.view-more {
  font-size: 14px;
  color: var(--app-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.3s ease;
}

.view-more:hover {
  color: var(--app-text-main);
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
