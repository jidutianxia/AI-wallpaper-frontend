<template>
  <div class="search-page">

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
    <!-- 结果展示区域 - 默认一直显示 -->
    <div class="preview-section">
      <div class="section-header">
        <h2 class="section-title">{{ sectionTitle }}</h2>
      </div>
      
      <AppState v-if="loading" type="loading" :rows="3" />
      <AppState
        v-else-if="listError"
        type="error"
        description="搜索加载失败，请重试"
        retryable
        @retry="fetchWallpapers"
      />

      <div v-else-if="wallpapers.length > 0" class="wallpaper-grid-preview">
        <UnifiedCard
          v-for="wallpaper in wallpapers"
          :key="wallpaper.id"
          :data="toCard(wallpaper)"
          class="preview-card"
        />
      </div>

      <!-- 无结果提示 -->
      <div v-else class="no-results">
        <AppState description="无匹配作品" />
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
import { normalizeCategories } from '@/utils/normalizers'
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, ArrowDown, Right, ArrowRight, Operation, Close } from '@element-plus/icons-vue'
import { ClickOutside as vClickOutside } from 'element-plus'
import UnifiedCard from '@/components/UnifiedCard.vue'
import AppState from '@/components/AppState.vue'
import { getWallpapers, getCategories } from '@/api'
import { formatAuthor, normalizeWallpaper } from '@/utils'
import { isStaleRequestError, usePagedList } from '@/composables/usePagedList'

const router = useRouter()
const route = useRoute()

// 状态管理
const isInteractionActive = ref(false)
const searchQuery = ref('')
const activeTab = ref('hot')
const activeSub = ref('')
const categories = ref([])

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

const {
  items: wallpapers,
  total,
  page: currentPage,
  pageSize,
  loading,
  error: listError,
  load: loadWallpapers
} = usePagedList({
  fetcher: getWallpapers,
  getParams: () => {
    const params = {
      resolution: filters.resolution,
      sort: filters.sortBy === 'likes' ? 'hot' : filters.sortBy === 'download' ? 'download' : 'latest'
    }

    if (searchQuery.value) params.q = searchQuery.value

    if (activeTab.value === 'category' && activeSub.value) {
      params.category = categories.value.find(c => (c.name === activeSub.value || String(c.id) === activeSub.value))?.name || activeSub.value
    } else if (activeTab.value === 'color' && activeSub.value) {
      params.tag = colors.find(c => c.key === activeSub.value)?.name
    } else if (activeTab.value === 'hot' && activeSub.value) {
      params.tag = activeSub.value
    }

    return params
  },
  normalizeItem: normalizeWallpaper,
  initialPageSize: 12
})

// 标题由路由查询和筛选状态推导，保持搜索结果区与 URL 同步。
const sectionTitle = computed(() => {
  if (route.query.q) return `搜索结果: "${route.query.q}"`
  if (activeTab.value === 'category' && activeSub.value) {
    const cat = categories.value.find(c => (c.name === activeSub.value || String(c.id) === activeSub.value))
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

const activeFilterLabel = computed(() => activeTab.value === 'color' ? colors.find(c => c.key === activeSub.value)?.name : activeTab.value === 'category' ? categories.value.find(c => (c.name === activeSub.value || String(c.id) === activeSub.value))?.name || activeSub.value : activeSub.value)
const clearFilters = () => {
  searchQuery.value = ''; activeSub.value = ''; activeTab.value = 'hot'; filters.resolution = ''
  currentPage.value = 1; router.push({ path: '/search', query: {} })
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
  updateURL()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 分类数据仅用于快速导航，失败时不影响搜索主流程。
const fetchCategoriesData = async () => {
  try {
    const res = await getCategories()
    categories.value = normalizeCategories(res || [])
  } catch (error) {
    console.error('Failed to fetch categories', error)
  }
}

// 搜索接口只从当前 URL/筛选状态组装参数，避免输入框状态和结果列表脱节。
const fetchWallpapers = async () => {
  try {
    await loadWallpapers({ page: currentPage.value })
  } catch (error) {
    if (isStaleRequestError(error)) return
    console.error(error)
  }
}

// 与首页复用同一张卡片字段契约，兼容后端 thumbUrl/url 差异。
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

// 更新URL参数
const updateURL = () => {
  const query = {}
  
  if (searchQuery.value.trim()) query.q = searchQuery.value.trim()
  if (activeTab.value !== 'hot') query.cat = activeTab.value
  if (activeSub.value) query.sub = activeSub.value
  if (filters.resolution) query.res = filters.resolution
  if (currentPage.value > 1) query.page = String(currentPage.value)
  
  if (route.query.sort) query.sort = route.query.sort
  if (JSON.stringify(query) === JSON.stringify(route.query)) fetchWallpapers()
  else router.push({ path: '/search', query })
}

// URL 是搜索页的单一入口，前进后退和直接打开链接都会触发列表刷新。
watch(() => route.query, () => {
  searchQuery.value = route.query.q || ''
  activeTab.value = route.query.cat || 'hot'
  activeSub.value = route.query.sub || ''
  filters.resolution = route.query.res || ''
  filters.sortBy = route.query.sort === 'download' ? 'download' : route.query.sort === 'latest' ? 'created_at' : activeTab.value === 'hot' ? 'likes' : 'created_at'
  currentPage.value = Math.max(1, Number(route.query.page) || 1)
  
  fetchWallpapers()
}, { immediate: true })

onMounted(() => {
  fetchCategoriesData()
})
</script>

<style scoped src="../styles/browse.css"></style>
