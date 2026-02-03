<template>
  <div class="home">
    <!-- 精选作品 -->
    <section class="featured-section">
      <div class="container">
        <!-- <div class="section-header"> -->
          <!-- <h2 class="section-title">精选作品</h2>
          <div class="section-tabs">
             <el-button 
               v-for="tab in tabs" 
               :key="tab.key"
               :type="activeTab === tab.key ? 'primary' : 'default'"
               :text="activeTab !== tab.key"
               bg
               @click="handleTabChange(tab.key)"
             >
               {{ tab.label }}
             </el-button>
          </div> -->
        <!-- </div> -->

        <!-- Error State -->
        <div v-if="isError" class="error-state">
          <el-empty description="加载失败，请重试">
            <el-button type="primary" @click="fetchWallpapers">重试</el-button>
          </el-empty>
        </div>

        <!-- Skeleton Loading -->
        <div v-else-if="loading && page === 1" class="wallpapers-grid">
          <div v-for="n in size" :key="n" class="skeleton-card">
             <el-skeleton animated>
               <template #template>
                 <el-skeleton-item variant="image" style="width: 100%; height: 240px; border-radius: 12px;" />
                 <div style="padding: 14px 0;">
                   <el-skeleton-item variant="h3" style="width: 50%" />
                   <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                     <el-skeleton-item variant="text" style="width: 30%" />
                     <el-skeleton-item variant="text" style="width: 20%" />
                   </div>
                 </div>
               </template>
             </el-skeleton>
          </div>
        </div>

        <!-- Content -->
        <div v-else class="wallpapers-grid">
          <UnifiedCard
            v-for="wallpaper in featuredWallpapers"
            :key="wallpaper.id"
            :data="mapCard(wallpaper)"
          />
        </div>
        
        <div class="load-more" v-if="hasMore && !isError && !loading">
          <div ref="sentinel" class="scroll-sentinel">
            <span v-if="!loading">下滑加载更多</span>
          </div>
        </div>
        <div class="load-more" v-else-if="loading && page > 1">
          <el-button loading text>加载中...</el-button>
        </div>
        <div class="load-more" v-else-if="!hasMore && !isError && featuredWallpapers.length > 0">
          <span class="no-more">没有更多了</span>
        </div>
      </div>
    </section>

    <!-- 页脚已移至全局 App.vue -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Star, Download, Picture, Camera, Brush, Monitor, Phone } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import UnifiedCard from '@/components/UnifiedCard.vue'
import { getWallpapers } from '@/api/wallpaper'
import { formatAuthor } from '@/utils'

const router = useRouter()

// 响应式数据
const activeTab = ref('latest')
const loading = ref(false)
const isError = ref(false)
const hasMore = ref(true)
const page = ref(1)
const size = ref(9)
const sentinel = ref(null)
let observer = null

const categories = ref([
  { id: 1, name: '手绘设计', icon: Brush },
  { id: 2, name: 'UI/UX', icon: Monitor },
  { id: 3, name: '摄影', icon: Camera },
  { id: 4, name: '插画', icon: Picture },
  { id: 5, name: '移动端', icon: Phone },
  { id: 6, name: '配色', icon: Star }
])

const tabs = ref([
  { key: 'latest', label: '最新' },
  { key: 'popular', label: '热门' },
  { key: 'featured', label: '精选' }
])

const featuredWallpapers = ref([])

// 获取壁纸列表
const fetchWallpapers = async (append = false) => {
  if (loading.value) return
  loading.value = true
  isError.value = false
  
  try {
    const sortMap = {
      'latest': 'latest',
      'popular': 'hot',
      'featured': 'download'
    }
    const params = {
      page: page.value,
      size: size.value,
      sort: sortMap[activeTab.value] || 'latest'
    }
    
    const res = await getWallpapers(params)
    const items = res.items || []
    
    if (append) {
      featuredWallpapers.value.push(...items)
    } else {
      featuredWallpapers.value = items
    }
    
    // Check if we have more pages
    const total = res.total || 0
    hasMore.value = featuredWallpapers.value.length < total
  } catch (error) {
    console.error('Failed to fetch wallpapers:', error)
    if (!append) isError.value = true
    ElMessage.error('获取壁纸失败，请稍后重试')
  } finally {
    loading.value = false
    // Re-observe if needed
    if (hasMore.value && !isError.value && sentinel.value && observer) {
       // Small delay to ensure DOM updated
       setTimeout(() => {
         observer.unobserve(sentinel.value)
         observer.observe(sentinel.value)
       }, 100)
    }
  }
}

// 切换标签
const handleTabChange = (tab) => {
  activeTab.value = tab
  page.value = 1
  fetchWallpapers()
}

// 加载更多
const loadMore = () => {
  page.value++
  fetchWallpapers(true)
}

// 方法
const goToCategory = (categoryId) => {
  router.push(`/category/${categoryId}`)
}

const goToDetail = (wallpaperId) => {
  router.push(`/detail/${wallpaperId}`)
}

onMounted(() => {
  fetchWallpapers()
  
  // Setup Intersection Observer
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore.value && !loading.value && !isError.value) {
      loadMore()
    }
  }, { rootMargin: '200px' })
  
  // We need to wait for DOM update to observe sentinel
  setTimeout(() => {
    if (sentinel.value) observer.observe(sentinel.value)
  }, 500)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

// 首页 Hero 背景
const mapCard = (w) => ({
  id: w.id,
  title: w.title,
  thumb: w.thumbUrl || w.url,
  url: w.url,
  resolution: w.resolution,
  likes: w.likes,
  author: formatAuthor(w.uploader || w.author)
})

const heroUrl = ref('https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80&auto=format&fit=crop')
const heroStyle = computed(() => ({
  backgroundImage: `url(${heroUrl.value})`
}))
</script>

<style scoped>
.home {
  min-height: 100vh;
}

/* Hero 区域 */
.hero-section {
  position: relative;
  min-height: 32vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.hero-mask {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: saturate(140%) blur(2px);
}

.hero-center {
  position: relative;
  z-index: 1;
  max-width: 960px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 32vh;
  text-align: center;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.hero-title,
.hero-subtitle { color: #fff; }

.hero-title { font-size: 3rem; font-weight: 800; margin-bottom: 1rem; }

.hero-subtitle { font-size: 1.125rem; margin-bottom: 1.5rem; opacity: 0.9; }

.hero-search { width: 100%; max-width: 720px; }
.hero-search-input :deep(.el-input__wrapper) { padding: 14px 18px; border-radius: 999px; }
.hero-search-input :deep(.el-button) { border-radius: 999px; }

.hero-buttons {
  display: flex;
  gap: 1rem;
}

.hero-btn {
  padding: 12px 32px;
  font-size: 1rem;
  border-radius: 8px;
}

.hero-btn-outline {
  background: transparent;
  border: 2px solid white;
  color: white;
  padding: 10px 30px;
  font-size: 1rem;
  border-radius: 8px;
}

.hero-btn-outline:hover {
  background: white;
  color: var(--app-color-primary);
}

/* 移除旧占位动画样式 */

/* 通用容器 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* 分类区域 */
.categories-section { display: none; }
.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 3rem;
  color: var(--app-text-main);
}
/* Removed dark override */

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1.25rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.25rem;
}

/* 删除分类卡片样式 */

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}
.dark .category-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.category-icon {
  font-size: 2rem;
  color: #667eea;
  margin-bottom: 0.75rem;
}

.category-name {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
}
.dark .category-name {
  color: #e5e7eb;
}

/* 精选作品区域 */
.featured-section {
  padding: 4rem 0;
}
.dark .featured-section { background: transparent; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

.section-tabs {
  display: flex;
  gap: 0.5rem;
}

.wallpapers-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}
@media (max-width: 48em) {
  .wallpapers-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; padding: 0 0.5rem; }
}
@media (min-width: 48em) and (max-width: 64em) {
  .wallpapers-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 64em) {
  .wallpapers-grid { grid-template-columns: repeat(3, 1fr); }
}

.error-state {
  padding: 4rem 0;
  display: flex;
  justify-content: center;
}

.skeleton-card {
  height: 320px;
}


.load-more {
  text-align: center;
  margin-top: 3rem; /* 增加与卡片的间距 */
  margin-bottom: 2rem;
}

.no-more {
  color: var(--app-text-secondary);
  font-size: 0.9rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-center {
    padding: 0 1rem;
    min-height: 40vh; /* Increase height for better spacing on mobile */
  }

  .hero-content {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 2rem;
  }
  
  .hero-title {
    font-size: 2rem; /* Smaller title on mobile */
    margin-bottom: 0.75rem;
  }

  .hero-subtitle {
    font-size: 1rem;
    padding: 0 1rem; /* Prevent text touching edges */
  }

  .hero-search {
    width: 100%;
    padding: 0 0.5rem; /* Add side padding */
  }
  
  .hero-search-input :deep(.el-input__wrapper) {
    padding: 10px 16px; /* Slightly smaller input on mobile */
  }

  .hero-buttons {
    justify-content: center;
    gap: 12px;
    flex-direction: column; /* Stack buttons */
    width: 100%;
    max-width: 280px; /* Limit width */
    margin-top: 1rem;
  }

  .hero-btn, .hero-btn-outline {
    width: 100%;
    justify-content: center;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .categories-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 0 16px;
  }
  
  .category-card {
    padding: 20px 12px;
  }
  
  .category-icon {
    font-size: 28px;
    margin-bottom: 8px;
  }
  
  .category-name {
    font-size: 14px;
  }
  
  .wallpapers-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    padding: 0 0.75rem;
  }
  
  .wallpaper-item {
    border-radius: 8px;
  }
  
  .wallpaper-title {
    font-size: 14px;
  }
  
  .wallpaper-meta {
    font-size: 12px;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .footer-links {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .newsletter {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .hero-buttons .el-button {
    width: 100%;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .category-card {
    padding: 16px 12px;
  }
  
  .category-icon {
    font-size: 24px;
  }
  
  .wallpapers-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    padding: 0 0.5rem;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .newsletter {
    flex-direction: column;
    gap: 12px;
  }
  
  .newsletter .el-input {
    width: 100%;
  }
  
  .footer-links {
    text-align: center;
  }
}
</style>
