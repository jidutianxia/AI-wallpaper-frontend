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
      <WallpaperCard
        v-for="wallpaper in wallpapers"
        :key="wallpaper.id"
        :data="toCard(wallpaper)"
        @preview="() => viewDetail(wallpaper.id)"
      />
      <div ref="sentinel" class="h-1"></div>
    </div>
    
    <!-- 分页 -->
    <div class="pagination" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 48]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
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
import { getWallpapers, getCategories } from '@/api/wallpaper'
import WallpaperCard from '@/components/WallpaperCard.vue'

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
const sentinel = ref(null)
let io

// 筛选器
const filters = reactive({
  category: '',
  resolution: '',
  sortBy: 'created_at'
})

// 获取壁纸列表
const fetchWallpapers = async (append = false) => {
  loading.value = !append
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      ...filters
    }
    
    // 添加搜索关键词或标签
    if (route.query.q) {
      params.keyword = route.query.q
    }
    if (route.query.tag) {
      params.tag = route.query.tag
    }
    
    const response = await getWallpapers(params)
    const data = response.data || []
    if (append) {
      wallpapers.value.push(...data)
    } else {
      wallpapers.value = data
    }
    total.value = response.total || wallpapers.value.length
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
    if (append) wallpapers.value.push(...mock)
    else wallpapers.value = mock
    total.value = wallpapers.value.length
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
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchWallpapers()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchWallpapers(true)
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
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && wallpapers.value.length < total.value) {
          currentPage.value += 1
          fetchWallpapers(true)
        }
      })
    }, { rootMargin: '300px' })
    setTimeout(() => { if (sentinel.value) io.observe(sentinel.value) }, 0)
  }
})

const applyTag = (name) => {
  router.push({ path: '/search', query: { ...route.query, tag: name } })
}

const toCard = (w) => ({ id: w.id, title: w.title, thumb: w.thumbUrl, url: w.url || w.thumbUrl, resolution: w.resolution, previewVideoUrl: w.previewVideoUrl })
</script>

<style scoped>
.search {
  max-width: 1200px;
  margin: 0 auto;
}

.search-header {
  text-align: center;
  margin-bottom: 2rem;
}

.search-header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.search-header p {
  color: #606266;
  font-size: 1.1rem;
}

.filters {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.tag-cloud { text-align: center; margin: 1rem 0 2rem; }
.tag-cloud .tag { display: inline-block; margin: 6px 10px; color: #409eff; cursor: pointer; }
.tag-cloud .tag:hover { text-decoration: underline; }

.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
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
  
  .wallpaper-item img {
    height: 150px;
  }
  
  .wallpaper-info {
    padding: 12px;
  }
  
  .wallpaper-info h3 {
    font-size: 0.9rem;
  }
  
  .wallpaper-stats {
    font-size: 0.8rem;
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
  
  .wallpaper-item img {
    height: 200px;
  }
  
  .wallpaper-info h3 {
    font-size: 1rem;
  }
  
  .wallpaper-stats {
    font-size: 0.85rem;
  }
  
  .pagination .el-pagination {
    flex-wrap: wrap;
  }
  
  .no-results {
    padding: 2rem 1rem;
  }
}
.dark .filters { background: #1e293b; }
.dark .wallpaper-item { background: #1e293b; box-shadow: none; }
.dark .search-header h1 { color: #e5e7eb; }
.dark .search-header p { color: #cbd5e1; }
.dark .wallpaper-info h3 { color: #e5e7eb; }
.dark .wallpaper-stats { color: #cbd5e1; }
</style>
