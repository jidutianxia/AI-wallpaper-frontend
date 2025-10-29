<template>
  <div class="category">
    <div class="category-header">
      <h1>壁纸分类</h1>
      <p v-if="currentCategory">当前分类：{{ currentCategory.name }}</p>
    </div>
    
    <!-- 分类导航 -->
    <div class="category-nav">
      <el-button
        v-for="category in categories"
        :key="category.id"
        :type="currentCategoryId === category.id ? 'primary' : 'default'"
        @click="selectCategory(category.id)"
        class="category-btn"
      >
        {{ category.name }}
      </el-button>
    </div>
    
    <!-- 筛选和排序 -->
    <div class="filters">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-select v-model="filters.resolution" placeholder="分辨率" clearable @change="handleFilterChange">
            <el-option label="1920x1080" value="1920x1080" />
            <el-option label="2560x1440" value="2560x1440" />
            <el-option label="3840x2160" value="3840x2160" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-select v-model="filters.sortBy" placeholder="排序方式" @change="handleFilterChange">
            <el-option label="最新" value="created_at" />
            <el-option label="最热" value="likes" />
            <el-option label="下载量" value="downloads" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-checkbox-group v-model="filters.tags" @change="handleFilterChange">
            <el-checkbox v-for="tag in popularTags" :key="tag" :label="tag">{{ tag }}</el-checkbox>
          </el-checkbox-group>
        </el-col>
      </el-row>
    </div>
    
    <!-- 壁纸网格 -->
    <div class="wallpaper-grid" v-loading="loading">
      <div 
        v-for="wallpaper in wallpapers" 
        :key="wallpaper.id" 
        class="wallpaper-item"
        @click="viewDetail(wallpaper.id)"
      >
        <img :src="wallpaper.thumbUrl" :alt="wallpaper.title" />
        <div class="wallpaper-overlay">
          <div class="wallpaper-actions">
            <el-button 
              :icon="View" 
              circle 
              size="small" 
              @click.stop="previewWallpaper(wallpaper)"
            />
            <el-button 
              :icon="Star" 
              circle 
              size="small" 
              :type="wallpaper.isLiked ? 'danger' : 'default'"
              @click.stop="toggleLike(wallpaper)"
            />
            <el-button 
              :icon="Download" 
              circle 
              size="small" 
              @click.stop="downloadWallpaper(wallpaper)"
            />
          </div>
          <div class="wallpaper-info">
            <h3>{{ wallpaper.title }}</h3>
            <div class="wallpaper-stats">
              <span><i class="el-icon-view"></i> {{ wallpaper.views }}</span>
              <span><i class="el-icon-heart"></i> {{ wallpaper.likes }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 无限滚动加载更多 -->
    <div v-if="hasMore && !loading" class="load-more">
      <el-button @click="loadMore" :loading="loadingMore">加载更多</el-button>
    </div>
    
    <!-- 无结果提示 -->
    <div v-if="!loading && wallpapers.length === 0" class="no-results">
      <el-empty description="该分类下暂无壁纸" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { View, Star, Download } from '@element-plus/icons-vue'
import { getWallpapers, getCategories, likeWallpaper } from '@/api/wallpaper'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const loadingMore = ref(false)
const wallpapers = ref([])
const categories = ref([])
const currentCategoryId = ref(null)
const currentPage = ref(1)
const hasMore = ref(true)

// 热门标签
const popularTags = ref(['自然', '城市', '抽象', '动漫', '游戏', '科技'])

// 筛选器
const filters = reactive({
  resolution: '',
  sortBy: 'created_at',
  tags: []
})

// 计算当前分类
const currentCategory = computed(() => {
  return categories.value.find(cat => cat.id === currentCategoryId.value)
})

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await getCategories()
    categories.value = response || []
    
    // 设置默认分类
    if (route.params.id) {
      currentCategoryId.value = parseInt(route.params.id)
    } else if (route.query.tag) {
      // 如果是标签搜索，找到对应分类
      const category = categories.value.find(cat => cat.tags?.includes(route.query.tag))
      if (category) currentCategoryId.value = category.id
    } else if (categories.value.length > 0) {
      currentCategoryId.value = categories.value[0].id
    }
  } catch (error) {
    // 模拟分类数据
    categories.value = [
      { id: 1, name: '风景', tags: ['自然', '山水'] },
      { id: 2, name: '抽象', tags: ['抽象', '艺术'] },
      { id: 3, name: '动漫', tags: ['动漫', '二次元'] },
      { id: 4, name: '游戏', tags: ['游戏', '电竞'] },
      { id: 5, name: '科技', tags: ['科技', '未来'] }
    ]
    currentCategoryId.value = categories.value[0].id
  }
}

// 获取壁纸列表
const fetchWallpapers = async (append = false) => {
  if (!append) {
    loading.value = true
    wallpapers.value = []
    currentPage.value = 1
  } else {
    loadingMore.value = true
  }
  
  try {
    const params = {
      page: currentPage.value,
      size: 12,
      category: currentCategoryId.value,
      ...filters
    }
    
    // 添加标签筛选
    if (route.query.tag) {
      params.tag = route.query.tag
    }
    
    const response = await getWallpapers(params)
    const newWallpapers = response.data || []
    
    if (append) {
      wallpapers.value.push(...newWallpapers)
    } else {
      wallpapers.value = newWallpapers
    }
    
    hasMore.value = newWallpapers.length === 12
  } catch (error) {
    ElMessage.error('获取壁纸列表失败：' + (error.response?.data?.message || error.message))
    
    // 模拟数据
    const mockWallpapers = [
      {
        id: 1,
        title: '美丽山景',
        thumbUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop&crop=center',
        views: 1234,
        likes: 56,
        isLiked: false
      },
      {
        id: 2,
        title: '城市夜景',
        thumbUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=300&h=200&fit=crop&crop=center',
        views: 2345,
        likes: 78,
        isLiked: false
      },
      {
        id: 3,
        title: '抽象艺术',
        thumbUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=200&fit=crop&crop=center',
        views: 3456,
        likes: 90,
        isLiked: true
      }
    ]
    
    if (append) {
      wallpapers.value.push(...mockWallpapers)
    } else {
      wallpapers.value = mockWallpapers
    }
    hasMore.value = false
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 选择分类
const selectCategory = (categoryId) => {
  currentCategoryId.value = categoryId
  router.push({ path: `/category/${categoryId}`, query: route.query })
  fetchWallpapers()
}

// 筛选变化处理
const handleFilterChange = () => {
  fetchWallpapers()
}

// 加载更多
const loadMore = () => {
  currentPage.value++
  fetchWallpapers(true)
}

// 查看详情
const viewDetail = (id) => {
  router.push(`/detail/${id}`)
}

// 预览壁纸
const previewWallpaper = (wallpaper) => {
  // 这里可以实现图片预览功能
  ElMessage.info('预览功能开发中...')
}

// 切换点赞
const toggleLike = async (wallpaper) => {
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    return
  }
  
  try {
    await likeWallpaper(wallpaper.id)
    wallpaper.isLiked = !wallpaper.isLiked
    wallpaper.likes += wallpaper.isLiked ? 1 : -1
    ElMessage.success(wallpaper.isLiked ? '点赞成功' : '取消点赞')
  } catch (error) {
    ElMessage.error('操作失败：' + (error.response?.data?.message || error.message))
  }
}

// 下载壁纸
const downloadWallpaper = (wallpaper) => {
  // 这里实现下载功能
  const link = document.createElement('a')
  link.href = wallpaper.url || wallpaper.thumbUrl
  link.download = `${wallpaper.title}.jpg`
  link.click()
  ElMessage.success('开始下载')
}

// 监听路由参数变化
watch(() => route.params.id, (newId) => {
  if (newId) {
    currentCategoryId.value = parseInt(newId)
    fetchWallpapers()
  }
})

// 组件挂载
onMounted(() => {
  fetchCategories().then(() => {
    fetchWallpapers()
  })
})
</script>

<style scoped>
.category {
  max-width: 1200px;
  margin: 0 auto;
}

.category-header {
  text-align: center;
  margin-bottom: 2rem;
}

.category-header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.category-header p {
  color: #606266;
  font-size: 1.1rem;
}

.category-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.category-btn {
  min-width: 80px;
}

.filters {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.wallpaper-item {
  position: relative;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  cursor: pointer;
}

.wallpaper-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.wallpaper-item:hover .wallpaper-overlay {
  opacity: 1;
}

.wallpaper-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.wallpaper-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%);
  opacity: 0;
  transition: opacity 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem;
}

.wallpaper-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.wallpaper-info {
  color: white;
}

.wallpaper-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.wallpaper-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  opacity: 0.9;
}

.wallpaper-stats span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.load-more {
  text-align: center;
  margin: 2rem 0;
}

.no-results {
  text-align: center;
  padding: 3rem;
}

@media (max-width: 768px) {
  .category {
    padding: 0 16px;
  }
  
  .category-header {
    margin-bottom: 1.5rem;
  }
  
  .category-header h1 {
    font-size: 1.8rem;
  }
  
  .category-nav {
    padding: 1rem;
    gap: 0.5rem;
  }
  
  .category-btn {
    min-width: 60px;
    font-size: 14px;
    padding: 8px 12px;
  }
  
  .filters {
    padding: 1rem;
  }
  
  .filters .el-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .filters .el-col {
    width: 100%;
    margin-bottom: 0;
  }
  
  .filters .el-select,
  .filters .el-checkbox-group {
    width: 100%;
  }
  
  .wallpaper-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .wallpaper-item img {
    height: 150px;
  }
  
  .wallpaper-overlay {
    opacity: 1;
    background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%);
  }
  
  .wallpaper-actions {
    gap: 0.25rem;
  }
  
  .wallpaper-actions .el-button {
    width: 28px;
    height: 28px;
  }
  
  .wallpaper-info h3 {
    font-size: 0.9rem;
  }
  
  .wallpaper-stats {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .category {
    padding: 0 12px;
  }
  
  .category-header h1 {
    font-size: 1.5rem;
  }
  
  .category-nav {
    padding: 0.75rem;
    gap: 0.25rem;
  }
  
  .category-btn {
    min-width: 50px;
    font-size: 12px;
    padding: 6px 8px;
  }
  
  .filters {
    padding: 0.75rem;
  }
  
  .wallpaper-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .wallpaper-item img {
    height: 200px;
  }
  
  .wallpaper-info h3 {
    font-size: 1rem;
  }
  
  .wallpaper-stats {
    font-size: 0.85rem;
  }
  
  .load-more {
    margin: 1.5rem 0;
  }
}
</style>