<template>
  <div class="home">
    <!-- 精选作品 -->
    <section class="featured-section">
      <div class="container">
        <div class="wallpapers-grid">
          <WallpaperCard
            v-for="wallpaper in featuredWallpapers"
            :key="wallpaper.id"
            :data="mapCard(wallpaper)"
            @preview="() => goToDetail(wallpaper.id)"
          />
        </div>
        
        <div class="load-more">
          <el-button size="large">查看更多作品</el-button>
        </div>
      </div>
    </section>

    <!-- 页脚已移至全局 App.vue -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Star, Download, Picture, Camera, Brush, Monitor, Phone } from '@element-plus/icons-vue'
import WallpaperCard from '@/components/WallpaperCard.vue'

const router = useRouter()

// 响应式数据
const activeTab = ref('latest')
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

const featuredWallpapers = ref([
  {
    id: 1,
    title: '极简主义思维导图',
    author: '设计师A',
    thumbUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=400&fit=crop&crop=center',
    likes: 1245,
    downloads: 567
  },
  {
    id: 2,
    title: '未来科技UI界面',
    author: '创作者B',
    thumbUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=300&h=400&fit=crop&crop=center',
    likes: 2156,
    downloads: 1023
  },
  {
    id: 3,
    title: '自然风光摄影',
    author: '摄影师C',
    thumbUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop&crop=center',
    likes: 3421,
    downloads: 1876
  },
  {
    id: 4,
    title: '抽象艺术插画',
    author: '艺术家D',
    thumbUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=400&fit=crop&crop=center',
    likes: 987,
    downloads: 432
  },
  {
    id: 5,
    title: '环保包装设计',
    author: '设计团队',
    thumbUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=400&fit=crop&crop=center',
    likes: 1567,
    downloads: 789
  },
  {
    id: 6,
    title: '现代建筑摄影',
    author: '建筑师E',
    thumbUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&h=400&fit=crop&crop=center',
    likes: 2234,
    downloads: 1345
  },
  {
    id: 7,
    title: '时尚品牌视觉',
    author: '品牌设计师',
    thumbUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=400&fit=crop&crop=center',
    likes: 1876,
    downloads: 923
  },
  {
    id: 8,
    title: '游戏角色艺术',
    author: '游戏美术',
    thumbUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=400&fit=crop&crop=center',
    likes: 3456,
    downloads: 2134
  }
])

// 方法
const goToCategory = (categoryId) => {
  router.push(`/category/${categoryId}`)
}

const goToDetail = (wallpaperId) => {
  router.push(`/detail/${wallpaperId}`)
}

onMounted(() => {
  // 初始化数据加载
})

// 首页 Hero 背景
const mapCard = (w) => ({
  id: w.id,
  title: w.title,
  thumb: w.thumbUrl,
  url: w.url || w.thumbUrl,
  resolution: w.resolution
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
  color: #667eea;
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
  color: #2c3e50;
}
.dark .section-title { color: #e5e7eb; }

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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.load-more {
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 2rem;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-buttons {
    justify-content: center;
    gap: 12px;
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
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 12px;
    padding: 0 16px;
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
    grid-template-columns: 1fr;
    gap: 16px;
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
