<template>
  <div class="search">
    <div class="search-header">
      <h1>搜索结果</h1>
      <p v-if="route.query.q">关键词："{{ route.query.q }}"</p>
      <p v-if="route.query.tag">标签："{{ route.query.tag }}"</p>
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
      <div 
        v-for="wallpaper in wallpapers" 
        :key="wallpaper.id" 
        class="wallpaper-item"
        @click="viewDetail(wallpaper.id)"
      >
        <img :src="wallpaper.thumbUrl" :alt="wallpaper.title" />
        <div class="wallpaper-info">
          <h3>{{ wallpaper.title }}</h3>
          <div class="wallpaper-stats">
            <span><i class="el-icon-view"></i> {{ wallpaper.views }}</span>
            <span><i class="el-icon-heart"></i> {{ wallpaper.likes }}</span>
          </div>
        </div>
      </div>
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

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const wallpapers = ref([])
const categories = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)

// 筛选器
const filters = reactive({
  category: '',
  resolution: '',
  sortBy: 'created_at'
})

// 获取壁纸列表
const fetchWallpapers = async () => {
  loading.value = true
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
    wallpapers.value = response.data || []
    total.value = response.total || 0
  } catch (error) {
    ElMessage.error('获取壁纸列表失败：' + (error.response?.data?.message || error.message))
    // 模拟数据
    wallpapers.value = [
      {
        id: 1,
        title: '美丽风景',
        thumbUrl: 'https://via.placeholder.com/300x200',
        views: 1234,
        likes: 56
      },
      {
        id: 2,
        title: '抽象艺术',
        thumbUrl: 'https://via.placeholder.com/300x200',
        views: 2345,
        likes: 78
      }
    ]
    total.value = 2
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await getCategories()
    categories.value = response || []
  } catch (error) {
    // 模拟分类数据
    categories.value = [
      { id: 1, name: '风景' },
      { id: 2, name: '抽象' },
      { id: 3, name: '动漫' },
      { id: 4, name: '游戏' }
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
  fetchWallpapers()
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

.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.wallpaper-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  cursor: pointer;
}

.wallpaper-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.wallpaper-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.wallpaper-info {
  padding: 1rem;
}

.wallpaper-info h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
}

.wallpaper-stats {
  display: flex;
  justify-content: space-between;
  color: #909399;
  font-size: 0.9rem;
}

.wallpaper-stats span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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
  .wallpaper-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }
  
  .filters {
    padding: 1rem;
  }
  
  .filters .el-row {
    flex-direction: column;
  }
  
  .filters .el-col {
    margin-bottom: 1rem;
  }
}
</style>