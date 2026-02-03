<template>
  <div class="search">
    <div class="search-header">
      <h1>搜索结果</h1>
      <p v-if="route.query.q">关键词："{{ route.query.q }}"</p>
      <p v-if="route.query.tag">标签："{{ route.query.tag }}"</p>
    </div>
    <div class="tag-cloud" v-if="tagCloud.length">
      <span
        v-for="tag in tagCloud"
        :key="tag.name"
        class="tag"
        :style="{ fontSize: `${tag.weight}px` }"
        @click="applyTag(tag.name)"
      >#{{ tag.name }}</span>
    </div>
    
    <!-- 筛选器 -->
    <div class="filters">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select v-model="filters.category" placeholder="选择分类" clearable @change="handleFilterChange">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filters.resolution" placeholder="分辨率" clearable @change="handleFilterChange">
            <el-option label="1920x1080" value="1920x1080" />
            <el-option label="2560x1440" value="2560x1440" />
            <el-option label="3840x2160" value="3840x2160" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filters.sortBy" placeholder="排序方式" @change="handleFilterChange">
            <el-option label="最新" value="created_at" />
            <el-option label="最热" value="likes" />
            <el-option label="下载量" value="downloads" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button @click="resetFilters">重置筛选</el-button>
        </el-col>
      </el-row>
    </div>
    
    <!-- 壁纸列表 -->
    <div class="wallpaper-grid" v-loading="loading">
      <UnifiedCard
        v-for="wallpaper in wallpapers"
        :key="wallpaper.id"
        :data="toCard(wallpaper)"
      />
    </div>
    
    <!-- 分页 -->
    <div class="pagination" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="handleCurrentChange"
        hide-on-single-page
      />
    </div>
    
    <!-- 无结果提示 -->
    <div v-if="!loading && wallpapers.length === 0" class="no-results">
      <el-empty description="没有找到相关壁纸" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getWallpapers, getCategories } from '@/api'
import UnifiedCard from '@/components/UnifiedCard.vue'
import { formatAuthor } from '@/utils'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const wallpapers = ref([])
const categories = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)
const tagCloud = ref([])

// 筛选器
const filters = reactive({
  category: '',
  resolution: '',
  sortBy: 'created_at'
})

// 获取壁纸列表
const fetchWallpapers = async () => {
  loading.value = true
  wallpapers.value = []
  
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      ...filters
    }
    
    // 添加搜索关键词或标签
    if (route.query.q) {
      params.q = route.query.q
    }
    if (route.query.tag) {
      params.tag = route.query.tag
    }
    
    const response = await getWallpapers(params)
    const data = response.items || []
    wallpapers.value = data
    total.value = response.total || 0
  } catch (error) {
    ElMessage.error('获取壁纸列表失败：' + (error.response?.data?.message || error.message))
    // 模拟数据
    const mock = [
      {
        id: 1,
        title: '美丽风景',
        thumbUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop&crop=center',
        views: 1234,
        likes: 56
      },
      {
        id: 2,
        title: '抽象艺术',
        thumbUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=200&fit=crop&crop=center',
        views: 2345,
        likes: 78
      }
    ]
    wallpapers.value = mock
    total.value = mock.length
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await getCategories()
    categories.value = response || []
    const tags = categories.value.flatMap(c => c.tags || [])
    const freq = tags.reduce((m, t) => (m[t] = (m[t]||0)+1, m), {})
    const counts = Object.values(freq)
    const max = counts.length ? Math.max(...counts) : 1
    const min = counts.length ? Math.min(...counts) : 1
    tagCloud.value = Object.entries(freq).map(([name, count]) => ({ name, weight: 12 + Math.round(8 * (count/max)) }))
  } catch (error) {
    // 模拟分类数据
    categories.value = [
      { id: 1, name: '风景' },
      { id: 2, name: '抽象' },
      { id: 3, name: '动漫' },
      { id: 4, name: '游戏' }
    ]
    tagCloud.value = [
      { name: '自然', weight: 18 },
      { name: '城市', weight: 16 },
      { name: '抽象', weight: 20 },
      { name: '游戏', weight: 14 }
    ]
  }
}

// 筛选变化处理
const handleFilterChange = () => {
  currentPage.value = 1
  updateURL()
  fetchWallpapers()
}

// 重置筛选
const resetFilters = () => {
  filters.category = ''
  filters.resolution = ''
  filters.sortBy = 'created_at'
  currentPage.value = 1
  updateURL()
  fetchWallpapers()
}

// 分页处理
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchWallpapers()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 查看详情
const viewDetail = (id) => {
  router.push(`/detail/${id}`)
}

// 更新URL参数
const updateURL = () => {
  const query = { ...route.query }
  
  if (filters.category) query.category = filters.category
  else delete query.category
  
  if (filters.resolution) query.resolution = filters.resolution
  else delete query.resolution
  
  if (filters.sortBy !== 'created_at') query.sortBy = filters.sortBy
  else delete query.sortBy
  
  router.replace({ query })
}

// 监听路由变化
watch(() => route.query, () => {
  // 从URL恢复筛选状态
  filters.category = route.query.category || ''
  filters.resolution = route.query.resolution || ''
  filters.sortBy = route.query.sortBy || 'created_at'
  currentPage.value = 1
  fetchWallpapers()
}, { immediate: true })

// 组件挂载
onMounted(() => {
  fetchCategories()
})

const applyTag = (name) => {
  router.push({ path: '/search', query: { ...route.query, tag: name } })
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
</script>

<style scoped>
.search {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.search-header {
  text-align: center;
  margin-bottom: 2rem;
}

.search-header h1 {
  color: var(--app-text-main);
  margin-bottom: 0.5rem;
}

.search-header p {
  color: var(--app-text-secondary);
  font-size: 1.1rem;
}

.filters {
  background: var(--app-bg-card);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow-card);
}

.tag-cloud { text-align: center; margin: 1rem 0 2rem; }
.tag-cloud .tag { display: inline-block; margin: 6px 10px; color: var(--app-color-primary); cursor: pointer; transition: color 0.2s; }
.tag-cloud .tag:hover { text-decoration: underline; color: var(--app-text-main); }

.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.no-results {
  text-align: center;
  padding: 3rem;
  color: var(--app-text-secondary);
}

@media (max-width: 768px) {
  .search {
    padding: 0 16px;
  }
  
  .search-header {
    margin-bottom: 1.5rem;
  }
  
  .search-header h1 {
    font-size: 1.8rem;
  }
  
  .search-header p {
    font-size: 1rem;
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
  .filters .el-button {
    width: 100%;
  }
  
  .wallpaper-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .pagination {
    margin-top: 1.5rem;
  }
  
  .pagination .el-pagination {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .search {
    padding: 0 12px;
  }
  
  .search-header h1 {
    font-size: 1.5rem;
  }
  
  .filters {
    padding: 0.75rem;
  }
  
  .wallpaper-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .pagination .el-pagination {
    flex-wrap: wrap;
  }
  
  .no-results {
    padding: 2rem 1rem;
  }
}
</style>
