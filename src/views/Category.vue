<template>
  <div class="category-page">

    <!-- 核心交互区域 -->
    <div class="hero-section" :class="{ 'is-active': isInteractionActive }">
      <div class="hero-search-card" @click="handleFocus" v-click-outside="handleClickOutside">
        <!-- 搜索输入框 -->
        <div class="search-input-wrapper">
          <el-icon class="search-icon"><Search /></el-icon>
          <input
            v-model="searchQuery"
            type="text"
            aria-label="搜索壁纸" placeholder="搜索壁纸"
            class="hero-search-input"
            @focus="handleFocus"
            @keyup.enter="handleSearch" @keydown.esc="handleClickOutside"
          />
          <transition name="fade">
            <div class="search-actions">
              <button class="filter-toggle" type="button" aria-label="筛选" title="筛选" :aria-expanded="isInteractionActive" @click.stop="isInteractionActive = !isInteractionActive"><el-icon><Operation /></el-icon></button>
              <el-dropdown trigger="click" @command="handleResolutionSelect">
                <button type="button" class="action-btn" aria-label="选择分辨率">
                  {{ filters.resolution || '分辨率' }} <el-icon><ArrowDown /></el-icon>
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="">全部</el-dropdown-item>
                    <el-dropdown-item command="1920x1080">1080P</el-dropdown-item>
                    <el-dropdown-item command="2560x1440">2K</el-dropdown-item>
                    <el-dropdown-item command="3840x2160">4K</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <button aria-label="搜索" class="primary-search-btn" @click="handleSearch">
                <el-icon><Right /></el-icon>
              </button>
            </div>
          </transition>
        </div>

        <!-- 快速分类导航 (动画显示) -->
        <transition name="expand">
          <div v-show="isInteractionActive" class="quick-nav">
            <div class="nav-tabs">
              <button type="button" class="nav-tab" :aria-pressed="activeTab === 'hot'" :class="{ active: activeTab === 'hot' }" @click="switchTab('hot')">主题</button>
              <button type="button" class="nav-tab" :aria-pressed="activeTab === 'category'" :class="{ active: activeTab === 'category' }" @click="switchTab('category')">分类</button>
              <button type="button" class="nav-tab" :aria-pressed="activeTab === 'color'" :class="{ active: activeTab === 'color' }" @click="switchTab('color')" title="按作品的颜色标签筛选">颜色</button>
            </div>

            <transition name="search-options" mode="out-in"><div :key="activeTab" class="tab-content">
              <div v-if="activeTab === 'hot'" class="tags-cloud">
                 <button type="button"
                  v-for="tag in hotTags" 
                  :key="tag" 
                  class="tag-chip" 
                  :class="{ active: activeSub === tag }"
                  @click="selectSub('hot', tag)"
                 >{{ tag }}</button>
              </div>
              <div v-if="activeTab === 'category'" class="tags-cloud">
                <button type="button"
                  v-for="cat in categories" 
                  :key="cat.id" 
                  class="tag-chip"
                  :class="{ active: activeSub === cat.name || activeSub === String(cat.id) }"
                  @click="selectSub('category', cat.name)"
                >{{ cat.name }}</button>
              </div>
              <div v-if="activeTab === 'color'" class="tags-cloud">
                <button type="button"
                  v-for="color in colors" 
                  :key="color.value"
                  class="tag-chip"
                  :class="{ active: activeSub === color.key }"
                  @click="selectSub('color', color.key)"
                ><i class="filter-color" :style="{ background: color.value }"/>{{ color.name }}</button>
              </div>
            </div></transition>
          </div>
        </transition>
      </div>
    </div>

    <div v-if="searchQuery || activeSub || filters.resolution" class="active-filters"><span v-if="searchQuery">{{ searchQuery }}</span><span v-if="activeSub">{{ activeFilterLabel }}</span><span v-if="filters.resolution">{{ filters.resolution }}</span><button type="button" aria-label="清除筛选" title="清除筛选" @click="clearFilters"><el-icon><Close /></el-icon></button></div>
    <!-- 预览展示区域 (网格) - 默认一直显示 -->
    <div class="preview-section">
      <div class="section-header">
        <h2 class="section-title">{{ previewTitle }}</h2>
        <div class="view-more" role="link" tabindex="0" @keydown.enter="viewMore" @click="viewMore">
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
import { normalizeCategories } from '@/utils/normalizers'
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ArrowDown, Right, ArrowRight, Operation, Close } from '@element-plus/icons-vue'
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
const previewParams = ref({ sort: 'hot' })

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
    const cat = categories.value.find(c => (c.name === activeSub.value || String(c.id) === activeSub.value))
    return cat ? `${cat.name}` : '分类推荐'
  }
  if (activeTab.value === 'color' && activeSub.value) {
    const col = colors.find(c => c.key === activeSub.value)
    return col ? `${col.name}系` : '颜色推荐'
  }
  if (activeSub.value) return `推荐: ${activeSub.value}`
  return '热门推荐'
})

const activeFilterLabel = computed(() => activeTab.value === 'color' ? colors.find(c => c.key === activeSub.value)?.name : activeTab.value === 'category' ? categories.value.find(c => (c.name === activeSub.value || String(c.id) === activeSub.value))?.name || activeSub.value : activeSub.value)
const clearFilters = () => {
  searchQuery.value = ''; activeSub.value = ''; activeTab.value = 'hot'; filters.resolution = ''
  fetchPreview({ sort: 'hot' })
}

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
      cat: activeTab.value,
      sub: activeSub.value,
      res: filters.resolution
    } 
  })
}

const switchTab = (tab) => {
  activeTab.value = tab
  activeSub.value = ''
  fetchPreview({ resolution: filters.resolution, sort: tab === 'hot' ? 'hot' : 'latest' })
}

const selectSub = (tab, sub) => {
  activeTab.value = tab
  activeSub.value = sub
  
  const params = { resolution: filters.resolution, sort: tab === 'hot' ? 'hot' : 'latest' }
  if (tab === 'category') params.category = categories.value.find(c => String(c.id) === sub)?.name || sub
  else if (tab === 'color') params.tag = colors.find(c => c.key === sub)?.name
  else if (tab === 'hot') params.tag = sub

  fetchPreview(params)
}

const handleResolutionSelect = (res) => {
  filters.resolution = res
  const params = { resolution: res, sort: activeTab.value === 'hot' ? 'hot' : 'latest' }
  if (activeTab.value === 'category' && activeSub.value) params.category = categories.value.find(c => (c.name === activeSub.value || String(c.id) === activeSub.value))?.name || activeSub.value
  else if (activeTab.value === 'color' && activeSub.value) params.tag = colors.find(c => c.key === activeSub.value)?.name
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
    categories.value = normalizeCategories(res || [])
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
  target: w,
  title: w.title,
  thumb: w.thumbUrl || w.url,
  url: w.url || w.thumbUrl,
  resolution: w.resolution,
  previewVideoUrl: w.previewVideoUrl,
  likes: w.likes,
  liked: w.liked,
  favorited: w.favorited,
  author: formatAuthor(w.uploader || w.author)
})

onMounted(() => {
  fetchCategoriesData()
  // 默认加载热门推荐，无论是否聚焦搜索框
  fetchPreview({ sort: 'hot' })
})
</script>

<style scoped src="../styles/browse.css"></style>
