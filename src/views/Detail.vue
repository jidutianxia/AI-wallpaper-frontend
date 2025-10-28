<template>
  <div class="detail" v-loading="loading">
    <div v-if="wallpaper" class="detail-content">
      <!-- 壁纸展示区 -->
      <div class="wallpaper-display">
        <div class="wallpaper-container">
          <img 
            :src="wallpaper.url || wallpaper.thumbUrl" 
            :alt="wallpaper.title"
            class="wallpaper-image"
            @click="previewImage"
          />
          <div class="wallpaper-overlay">
            <div class="overlay-actions">
              <el-button 
                type="primary" 
                size="large" 
                :icon="Download" 
                @click="downloadWallpaper"
              >
                下载壁纸
              </el-button>
              <el-button 
                :type="wallpaper.isLiked ? 'danger' : 'default'"
                size="large"
                :icon="Heart"
                @click="toggleLike"
                :loading="likeLoading"
              >
                {{ wallpaper.isLiked ? '已点赞' : '点赞' }} ({{ wallpaper.likes }})
              </el-button>
              <el-button 
                :type="wallpaper.isFavorited ? 'warning' : 'default'"
                size="large"
                :icon="Star"
                @click="toggleFavorite"
                :loading="favoriteLoading"
              >
                {{ wallpaper.isFavorited ? '已收藏' : '收藏' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 壁纸信息区 -->
      <div class="wallpaper-info">
        <div class="info-header">
          <h1 class="wallpaper-title">{{ wallpaper.title }}</h1>
          <div class="wallpaper-stats">
            <span class="stat-item">
              <el-icon><View /></el-icon>
              {{ wallpaper.views }} 浏览
            </span>
            <span class="stat-item">
              <el-icon><Download /></el-icon>
              {{ wallpaper.downloads }} 下载
            </span>
            <span class="stat-item">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(wallpaper.createdAt) }}
            </span>
          </div>
        </div>

        <div class="info-content">
          <div class="info-section">
            <h3>基本信息</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>分辨率:</label>
                <span>{{ wallpaper.width }} × {{ wallpaper.height }}</span>
              </div>
              <div class="info-item">
                <label>文件大小:</label>
                <span>{{ formatFileSize(wallpaper.fileSize) }}</span>
              </div>
              <div class="info-item">
                <label>格式:</label>
                <span>{{ wallpaper.format || 'JPG' }}</span>
              </div>
              <div class="info-item">
                <label>分类:</label>
                <el-tag type="primary">{{ wallpaper.category }}</el-tag>
              </div>
            </div>
          </div>

          <div class="info-section" v-if="wallpaper.tags && wallpaper.tags.length">
            <h3>标签</h3>
            <div class="tags">
              <el-tag 
                v-for="tag in wallpaper.tags" 
                :key="tag"
                class="tag-item"
                @click="searchByTag(tag)"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>

          <div class="info-section" v-if="wallpaper.description">
            <h3>描述</h3>
            <p class="description">{{ wallpaper.description }}</p>
          </div>

          <div class="info-section" v-if="wallpaper.uploader">
            <h3>上传者</h3>
            <div class="uploader-info">
              <el-avatar :src="wallpaper.uploader.avatar" :size="40">
                {{ wallpaper.uploader.username?.[0] }}
              </el-avatar>
              <div class="uploader-details">
                <div class="uploader-name">{{ wallpaper.uploader.username }}</div>
                <div class="uploader-stats">已上传 {{ wallpaper.uploader.uploadCount }} 张壁纸</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐 -->
    <div class="related-section" v-if="relatedWallpapers.length">
      <h2>相关推荐</h2>
      <div class="related-grid">
        <div 
          v-for="item in relatedWallpapers" 
          :key="item.id"
          class="related-item"
          @click="viewDetail(item.id)"
        >
          <img :src="item.thumbUrl" :alt="item.title" />
          <div class="related-info">
            <h4>{{ item.title }}</h4>
            <div class="related-stats">
              <span><el-icon><View /></el-icon> {{ item.views }}</span>
              <span><el-icon><Heart /></el-icon> {{ item.likes }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog 
      v-model="showPreview" 
      :show-close="false"
      :close-on-click-modal="true"
      class="preview-dialog"
      width="90%"
    >
      <img 
        :src="wallpaper?.url || wallpaper?.thumbUrl" 
        :alt="wallpaper?.title"
        class="preview-image"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Download, 
  Heart, 
  Star, 
  View, 
  Calendar 
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getWallpaper, likeWallpaper, favoriteWallpaper, getWallpapers } from '@/api/wallpaper'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const loading = ref(true)
const likeLoading = ref(false)
const favoriteLoading = ref(false)
const showPreview = ref(false)
const wallpaper = ref(null)
const relatedWallpapers = ref([])

// 获取壁纸详情
const fetchWallpaper = async (id) => {
  loading.value = true
  try {
    const response = await getWallpaper(id)
    wallpaper.value = response
    
    // 获取相关推荐
    fetchRelatedWallpapers()
  } catch (error) {
    // 模拟数据
    wallpaper.value = {
      id: parseInt(id),
      title: '美丽的风景壁纸',
      url: 'https://via.placeholder.com/1920x1080/4CAF50/white?text=Wallpaper',
      thumbUrl: 'https://via.placeholder.com/400x300/4CAF50/white?text=Wallpaper',
      width: 1920,
      height: 1080,
      fileSize: 2048000,
      format: 'JPG',
      category: '风景',
      tags: ['自然', '山水', '绿色', '清新'],
      description: '这是一张非常美丽的风景壁纸，展现了大自然的壮丽景色。',
      views: 1234,
      likes: 89,
      downloads: 456,
      isLiked: false,
      isFavorited: false,
      createdAt: '2024-01-15T10:30:00Z',
      uploader: {
        id: 1,
        username: '摄影师小王',
        avatar: 'https://via.placeholder.com/40x40/FF9800/white?text=U',
        uploadCount: 25
      }
    }
    
    fetchRelatedWallpapers()
  } finally {
    loading.value = false
  }
}

// 获取相关推荐
const fetchRelatedWallpapers = async () => {
  try {
    const response = await getWallpapers({
      category: wallpaper.value?.category,
      limit: 6,
      exclude: wallpaper.value?.id
    })
    relatedWallpapers.value = response.data || []
  } catch (error) {
    // 模拟数据
    relatedWallpapers.value = [
      {
        id: 2,
        title: '相关壁纸1',
        thumbUrl: 'https://via.placeholder.com/300x200/2196F3/white?text=Related1',
        views: 567,
        likes: 34
      },
      {
        id: 3,
        title: '相关壁纸2',
        thumbUrl: 'https://via.placeholder.com/300x200/FF9800/white?text=Related2',
        views: 890,
        likes: 67
      },
      {
        id: 4,
        title: '相关壁纸3',
        thumbUrl: 'https://via.placeholder.com/300x200/9C27B0/white?text=Related3',
        views: 234,
        likes: 12
      }
    ]
  }
}

// 切换点赞
const toggleLike = async () => {
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    return
  }
  
  likeLoading.value = true
  try {
    await likeWallpaper(wallpaper.value.id)
    wallpaper.value.isLiked = !wallpaper.value.isLiked
    wallpaper.value.likes += wallpaper.value.isLiked ? 1 : -1
    ElMessage.success(wallpaper.value.isLiked ? '点赞成功' : '取消点赞')
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    likeLoading.value = false
  }
}

// 切换收藏
const toggleFavorite = async () => {
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    return
  }
  
  favoriteLoading.value = true
  try {
    await favoriteWallpaper(wallpaper.value.id)
    wallpaper.value.isFavorited = !wallpaper.value.isFavorited
    ElMessage.success(wallpaper.value.isFavorited ? '收藏成功' : '取消收藏')
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    favoriteLoading.value = false
  }
}

// 下载壁纸
const downloadWallpaper = () => {
  const link = document.createElement('a')
  link.href = wallpaper.value.url || wallpaper.value.thumbUrl
  link.download = `${wallpaper.value.title}.jpg`
  link.click()
  
  // 更新下载数
  wallpaper.value.downloads++
  ElMessage.success('开始下载')
}

// 预览图片
const previewImage = () => {
  showPreview.value = true
}

// 按标签搜索
const searchByTag = (tag) => {
  router.push({
    path: '/search',
    query: { q: tag }
  })
}

// 查看详情
const viewDetail = (id) => {
  router.push(`/detail/${id}`)
}

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '未知'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// 监听路由变化
watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchWallpaper(newId)
  }
}, { immediate: true })

// 组件挂载
onMounted(() => {
  const id = route.params.id
  if (id) {
    fetchWallpaper(id)
  }
})
</script>

<style scoped>
.detail {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.detail-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 40px;
  margin-bottom: 40px;
}

.wallpaper-display {
  position: relative;
}

.wallpaper-container {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #f8f9fa;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.wallpaper-image {
  width: 100%;
  height: auto;
  display: block;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.wallpaper-image:hover {
  transform: scale(1.02);
}

.wallpaper-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
  padding: 30px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.wallpaper-container:hover .wallpaper-overlay {
  opacity: 1;
}

.overlay-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.wallpaper-info {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.info-header {
  margin-bottom: 30px;
}

.wallpaper-title {
  margin: 0 0 15px 0;
  font-size: 28px;
  font-weight: 700;
  color: #333;
  line-height: 1.3;
}

.wallpaper-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.info-section {
  margin-bottom: 30px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.info-grid {
  display: grid;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-weight: 500;
  color: #666;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  cursor: pointer;
  transition: all 0.3s ease;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.description {
  margin: 0;
  line-height: 1.6;
  color: #666;
}

.uploader-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.uploader-details {
  flex: 1;
}

.uploader-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.uploader-stats {
  font-size: 14px;
  color: #666;
}

.related-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.related-section h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.related-item {
  border-radius: 8px;
  overflow: hidden;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
}

.related-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.related-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.related-info {
  padding: 15px;
}

.related-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.related-stats {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #666;
}

.related-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.preview-dialog {
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .detail-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  
  .wallpaper-info {
    order: -1;
  }
}

@media (max-width: 768px) {
  .detail {
    padding: 15px;
  }
  
  .wallpaper-info {
    padding: 20px;
  }
  
  .wallpaper-title {
    font-size: 24px;
  }
  
  .overlay-actions {
    flex-direction: column;
  }
  
  .related-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .wallpaper-stats {
    gap: 6px;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .related-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>