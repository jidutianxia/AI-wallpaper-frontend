<template>
  <div class="detail" v-loading="loading">
    <div class="topbar">
      <el-button size="small" :icon="ArrowLeft" @click="goBack">返回</el-button>
    </div>
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
        </div>
      </div>

      <!-- 壁纸信息区 -->
      <div class="wallpaper-info">
        <div class="info-header">
          <h1 class="wallpaper-title">{{ wallpaper.title }}</h1>
          
          <!-- New Action Area (Moved from overlay) -->
          <div class="action-area">
              <div class="secondary-actions">
                <el-button 
                  class="btn-gradient-orange" 
                  size="large" 
                  :icon="Download" 
                  @click="downloadWallpaper"
                >
                  下载原图
                </el-button>
                <el-button 
                  :class="wallpaper.liked ? 'btn-red-soft' : 'btn-ghost-grey'"
                  size="large"
                  :icon="View"
                  @click="toggleLike"
                  :loading="likeLoading"
                >
                  {{ wallpaper.liked ? '已点赞' : '点赞' }} ({{ wallpaper.likes }})
                </el-button>
              </div>
             <!-- Author Actions (Only visible to author) -->
              <div v-if="isAuthor" class="author-actions">
                <el-button class="btn-manage" round size="large" :icon="Edit" @click="handleEdit">
                  管理壁纸
                </el-button>
              </div>
          </div>

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
                <span class="detail-value">{{ (Number(wallpaper.width) > 0 && Number(wallpaper.height) > 0) ? `${wallpaper.width} × ${wallpaper.height}` : '未知' }}</span>
              </div>
              <div class="info-item">
                <label>文件大小:</label>
                <span class="detail-value">{{ formatFileSize(wallpaper.fileSize) }}</span>
              </div>
              <div class="info-item">
                <label>格式:</label>
                <span class="detail-value">{{ wallpaper.format || 'JPG' }}</span>
              </div>
              <div class="info-item">
                <label>分类:</label>
                <el-tag type="primary">{{ wallpaper.category }}</el-tag>
              </div>
            </div>
          </div>

          <div class="info-section" v-if="processedTags.length">
            <h3>标签</h3>
            <div class="tags">
              <el-tag v-for="tag in processedTags" :key="tag" class="tag-item" effect="plain" round
                @click="searchByTag(tag)">
                {{ tag }}
              </el-tag>
            </div>
          </div>

          <div class="info-section" v-if="wallpaper.description">
            <h3>描述</h3>
            <p class="description">{{ wallpaper.description }}</p>
          </div>

          <div class="info-section" v-if="uploaderInfo">
            <h3>发布者</h3>
            <div class="uploader-info card-nested" @click="goProfile(uploaderInfo.id)" style="cursor: pointer;">
              <el-avatar :src="uploaderInfo.avatar" :size="40">
                {{ (uploaderInfo.nickname || uploaderInfo.username)?.[0]?.toUpperCase() }}
              </el-avatar>
              <div class="uploader-details">
                <div class="uploader-name">{{ uploaderInfo.nickname || uploaderInfo.username }}</div>
                <div class="uploader-stats" v-if="uploaderInfo.uploadCount">已上传 {{ uploaderInfo.uploadCount }} 张壁纸</div>
              </div>
              <el-icon><ArrowRight /></el-icon>
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
              <span><el-icon><Star /></el-icon> {{ item.likes }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑壁纸对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑壁纸"
      width="500px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" label-width="60px">
        <el-form-item label="标题" required>
          <el-input v-model="editForm.title" placeholder="请输入标题" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="editForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入描述" 
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="editForm.category" placeholder="请选择分类" style="width: 100%">
             <el-option
                v-for="item in categoryOptions"
                :key="item.id"
                :label="item.name"
                :value="item.name"
             />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-select
            v-model="editForm.tagsList"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入或选择标签"
            style="width: 100%"
            @change="handleTagChange"
          >
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer-content">
          <el-button type="danger" link @click="handleDelete" :icon="Delete">删除此壁纸</el-button>
          <div class="dialog-actions">
            <el-button @click="editDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitEdit" :loading="submitting">保存</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 图片预览对话框 -->
   <el-dialog v-model="showPreview" :show-close="false" :align-center="true" class="cinema-preview-dialog" width="100%"
      :transition-drop-down="false" transition="cinema-fade">
      <div class="cinema-wrapper" @click="showPreview = false">
        <img :src="wallpaper?.url || wallpaper?.thumbUrl" :alt="wallpaper?.title" class="cinema-image" />
        <!-- <div class="cinema-caption">
          <h3>{{ wallpaper?.title }}</h3>
          <p>{{ wallpaper?.width }} × {{ wallpaper?.height }}</p>
        </div> -->
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive,nextTick, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Star,
  Download, 
  View, 
  Calendar,
  ArrowLeft,
  ArrowRight,
  Edit,
  Delete
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getWallpaper, likeWallpaper, getWallpapers, downloadWallpaperApi, deleteWallpaper, updateWallpaper, getCategories } from '@/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isMounted = ref(true)
onBeforeUnmount(() => {
  isMounted.value = false
})

// 响应式数据
const loading = ref(true)
const likeLoading = ref(false)
const showPreview = ref(false)
const wallpaper = ref(null)
const relatedWallpapers = ref([])

const uploaderInfo = computed(() => {
  if (!wallpaper.value) return null
  
  // 1. If uploader is already an object
  if (wallpaper.value.uploader && typeof wallpaper.value.uploader === 'object') {
    return wallpaper.value.uploader
  }

  // 2. Handle author field (could be string, JSON string, or object)
  if (wallpaper.value.author) {
    let authorData = wallpaper.value.author
    
    // Try parsing if it's a string that looks like JSON
    if (typeof authorData === 'string' && authorData.trim().startsWith('{')) {
      try {
        authorData = JSON.parse(authorData)
      } catch (e) {
        console.warn('Failed to parse author JSON:', e)
        // Keep as string if parsing fails
      }
    }

    // If we have an object (either originally or parsed)
    if (typeof authorData === 'object' && authorData !== null) {
      return {
        id: authorData.id,
        username: authorData.username,
        nickname: authorData.nickname,
        avatar: authorData.avatar,
        uploadCount: authorData.uploadCount || 0
      }
    }
    
    // Fallback: author is a simple string (username)
    return {
      id: wallpaper.value.authorId, // Try to get ID from separate field if available
      username: authorData,
      avatar: '', 
      uploadCount: 0
    }
  }
  return null
})

const isAuthor = computed(() => {
  if (!userStore.isAuthenticated || !userStore.info || !uploaderInfo.value) return false
  return String(userStore.info.id) === String(uploaderInfo.value.id)
})



const goBack = () => {
  router.back()
}

const goProfile = (id) => {
  if (id) {
    router.push(`/profile/${id}`)
  }
}

// 编辑状态
const editDialogVisible = ref(false)
const submitting = ref(false)
const categoryOptions = ref([])
const editForm = reactive({
  title: '',
  description: '',
  category: '',
  tagsList: []
})

// 假设你的响应数据存储在 wallpaper.value 中
const processedTags = computed(() => {
  const rawTags = wallpaper.value?.tags
  if (!rawTags) return []
  
  // 如果已经是数组则直接返回，如果是字符串则按逗号分割
  if (Array.isArray(rawTags)) return rawTags
  
  return rawTags
    .split(',')           // 按逗号分割成数组
    .map(tag => tag.trim()) // 去除每个标签前后的空格
    .filter(tag => tag !== '') // 过滤掉空字符串
})

// 获取分类
const fetchCategories = async () => {
  if (categoryOptions.value.length > 0) return
  try {
    const res = await getCategories()
    categoryOptions.value = res || []
  } catch (e) {
    console.error('Failed to fetch categories:', e)
  }
}

// 打开编辑对话框
const handleEdit = async () => {
  await fetchCategories()
  editForm.title = wallpaper.value.title || ''
  editForm.description = wallpaper.value.description || ''
  editForm.category = wallpaper.value.category || '' // Assuming category name is stored
  // Ensure tags is an array
  editForm.tagsList = Array.isArray(wallpaper.value.tags) ? [...wallpaper.value.tags] : []
  editDialogVisible.value = true
}

// 提交编辑
const submitEdit = async () => {
  if (!editForm.title) {
    ElMessage.warning('标题不能为空')
    return
  }
  
  submitting.value = true
  try {
    await updateWallpaper(wallpaper.value.id, {
      title: editForm.title,
      description: editForm.description,
      category: editForm.category,
      tagsList: editForm.tagsList
    })
    ElMessage.success('更新成功')
    editDialogVisible.value = false
    // Refresh details
    await fetchWallpaper(wallpaper.value.id)
  } catch (error) {
    ElMessage.error('更新失败: ' + (error.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

// 删除壁纸
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这张壁纸吗？此操作不可恢复。',
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await deleteWallpaper(wallpaper.value.id)
    ElMessage.success('壁纸已删除')
    router.push('/user') // 返回用户中心或首页
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败，请稍后重试')
    }
  }
}

// 获取壁纸详情
const fetchWallpaper = async (id) => {
  loading.value = true
  try {
    const response = await getWallpaper(id)
    if (!isMounted.value) return
    wallpaper.value = response
    
    // 获取相关推荐
    fetchRelatedWallpapers()
  } catch (error) {
    if (!isMounted.value) return
    // 模拟数据
    wallpaper.value = {
      id: parseInt(id),
      title: '美丽的风景壁纸',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center',
      thumbUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center',
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
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
        uploadCount: 25
      }
    }
    
    fetchRelatedWallpapers()
  } finally {
    if (isMounted.value) loading.value = false
  }
}

// 获取相关推荐
const fetchRelatedWallpapers = async () => {
  try {
    const response = await getWallpapers({
      category: wallpaper.value?.category,
      size: 6,
      exclude: wallpaper.value?.id
    })
    if (!isMounted.value) return
    relatedWallpapers.value = response.data || []
  } catch (error) {
    if (!isMounted.value) return
    // 模拟数据
    relatedWallpapers.value = [
      {
        id: 2,
        title: '相关壁纸1',
        thumbUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=300&h=200&fit=crop&crop=center',
        views: 567,
        likes: 34
      },
      {
        id: 3,
        title: '相关壁纸2',
        thumbUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=200&fit=crop&crop=center',
        views: 890,
        likes: 67
      },
      {
        id: 4,
        title: '相关壁纸3',
        thumbUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&h=200&fit=crop&crop=center',
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
  
  const prevLiked = wallpaper.value.liked
  const prevLikes = wallpaper.value.likes

  // Optimistic update
  wallpaper.value.liked = !prevLiked
  wallpaper.value.likes += wallpaper.value.liked ? 1 : -1
  
  likeLoading.value = true
  try {
    await likeWallpaper(wallpaper.value.id)
    if (!isMounted.value) return
    ElMessage.success(wallpaper.value.liked ? '点赞成功' : '取消点赞')
  } catch (error) {
    if (!isMounted.value) return
    // Rollback
    wallpaper.value.liked = prevLiked
    wallpaper.value.likes = prevLikes
    ElMessage.error('操作失败')
  } finally {
    if (isMounted.value) likeLoading.value = false
  }
}

// 下载壁纸
const downloadWallpaper = async () => {
  try {
    const res = await downloadWallpaperApi(wallpaper.value.id)
    const url = res?.url || res
    
    if (url && typeof url === 'string') {
      const link = document.createElement('a')
      link.href = url
      link.download = `${wallpaper.value.title}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 更新下载数
      wallpaper.value.downloads++
      ElMessage.success('开始下载')
    }
  } catch (error) {
    if (error.response?.status === 403) {
      ElMessage.warning('下载次数已达上限，请登录后继续')
      window.dispatchEvent(new Event('auth-required'))
    }
    
  }
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
  if (!dateString) return '未知'
  // Check for "0" string or 0 number which often means invalid/epoch
  if (dateString === '0' || dateString === 0) return '未知'
  
  const date = new Date(dateString)
  // Check for invalid date or Unix epoch (1970)
  if (isNaN(date.getTime()) || date.getFullYear() <= 1970) return '未知'
  
  return date.toLocaleDateString('zh-CN')
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

// 处理标签变化
const handleTagChange = (newTags) => {
   nextTick(() => {
    // 找到当前正在输入的 input 元素
    const activeInput = document.activeElement;
    if (activeInput && activeInput.tagName === 'INPUT') {
      // 1. 清空原生 DOM 的值
      activeInput.value = '';
      
      // 2. 触发 input 事件让 Vue/Element 监测到内容已变为空（可选，视版本而定）
      activeInput.dispatchEvent(new Event('input'));
    }
  });
}

</script>

<style scoped>
.detail {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.topbar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
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
  background: var(--app-bg-hover);
  box-shadow: var(--app-shadow-card);
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

/* Action Area Styles */
.action-area {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.author-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-start;
  padding-top: 12px;
  border-top: 1px solid var(--app-border);
}

.author-actions .el-button {
  flex: 1;
}

.btn-manage {
  width: 100%;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Semantic Variables from theme.css */
  border: 1px solid var(--app-btn-manage-border) !important;
  color: var(--app-btn-manage-text) !important;
  background: var(--app-btn-manage-bg) !important;
  box-shadow: var(--app-btn-manage-shadow);
}

.btn-manage:hover {
  border-color: var(--app-btn-manage-hover-border) !important;
  color: var(--app-btn-manage-hover-text) !important;
  background: var(--app-btn-manage-hover-bg) !important;
  box-shadow: var(--app-btn-manage-hover-shadow);
  transform: translateY(-1px);
}

.btn-manage:active {
  background: var(--app-btn-manage-active-bg) !important;
  transform: translateY(1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.btn-gradient-orange {
  width: 100%;
  height: 48px !important;
  font-size: 16px !important;
}

.secondary-actions {
  display: flex;
  gap: 12px;
}

.secondary-actions .el-button {
  flex: 1;
}

/* Dialog Styles */
.dialog-footer-content {
  display: flex;
  justify-content: space-between; /* 拉开左侧删除和右侧保存的距离 */
  align-items: center;           /* 垂直方向居中对齐 */
  width: 100%;
  padding-top: 10px;             /* 增加一点顶距更美观 */
}

/* 按钮内部图标与文字水平垂直居中 */
:deep(.el-button.is-link) {
  display: inline-flex;
  align-items: center;   /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  height: auto;
  padding: 4px 8px;
}
:deep(.el-button--danger.is-link) {
  color: #ff4d4f !important; /* 你想要的颜色，比如更鲜艳的红色 */
}
/* 强制图标和文字之间的间距平衡 */
:deep(.el-button .el-icon) {
  margin-right: 6px;     /* 图标与文字的间距 */
  vertical-align: middle;
  font-size: 16px;       /* 调整图标大小使其与文字视觉统一 */
}

.dialog-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* Typography Overrides */
.wallpaper-title {
  color: var(--app-text-header);
}

.detail-value {
  color: var(--app-text-sub);
  font-family: monospace; /* For numbers/data */
}

/* Nested Card for Publisher */
.card-nested {
  background-color: var(--app-bg-nested-card);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--app-border);
}

.uploader-info.card-nested {
  /* Ensure overrides are applied */
  background-color: var(--app-bg-nested-card);
}

.wallpaper-info {
  background: var(--app-bg-card);
  border-radius: 12px;
  padding: 30px;
  box-shadow: var(--app-shadow-card);
  height: fit-content;
  border: 1px solid var(--app-border);
  position: sticky;
  top: 20px;
  z-index: 10;
}

.info-header {
  margin-bottom: 30px;
}

.wallpaper-title {
  margin: 0 0 15px 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--app-text-main);
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
  color: var(--app-text-secondary);
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
  color: var(--app-text-main);
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
  border-bottom: 1px solid var(--app-border);
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-weight: 500;
  color: var(--app-text-secondary);
}
.info-item span {
  color: var(--app-text-main);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--app-accent-bg-soft);
  border-color: var(--app-accent-border);
  color: var(--app-text-secondary);
  --el-tag-bg-color: var(--app-accent-bg-soft);
  --el-tag-border-color: var(--app-accent-border);
  --el-tag-text-color: var(--app-text-secondary);
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--app-shadow-sm);
  color: var(--app-color-primary);
  border-color: var(--app-color-primary);
}

.description {
  margin: 0;
  line-height: 1.6;
  color: var(--app-text-secondary);
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
  color: var(--app-text-main);
  margin-bottom: 4px;
}

.uploader-stats {
  font-size: 14px;
  color: var(--app-text-secondary);
}

.related-section {
  background: var(--app-bg-card);
  border-radius: 12px;
  padding: 30px;
  box-shadow: var(--app-shadow-card);
  border: 1px solid var(--app-border);
}

.related-section h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--app-text-main);
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.related-item {
  border-radius: 8px;
  overflow: hidden;
  background: var(--app-bg-hover);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.related-item:hover {
  transform: translateY(-5px);
  box-shadow: var(--app-shadow-hover);
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
  color: var(--app-text-main);
  line-height: 1.4;
}

.related-stats {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: var(--app-text-secondary);
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
@media (max-width: 900px) {
  .detail-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .wallpaper-info {
    order: -1;
    position: static;
  }
  
  .wallpaper-display {
    max-height: 60vh;
  }
}

@media (max-width: 768px) {
  .detail {
    padding: 12px;
  }
  
  .wallpaper-container {
    border-radius: 8px;
  }
  
  .wallpaper-overlay {
    padding: 20px;
    opacity: 1;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 60%);
  }
  
  .overlay-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .overlay-actions .el-button {
    width: 100%;
    font-size: 14px;
  }
  
  .wallpaper-info {
    padding: 16px;
  }
  
  .wallpaper-title {
    font-size: 20px;
    line-height: 1.4;
  }
  
  .wallpaper-stats {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .stat-item {
    font-size: 13px;
  }
  
  .info-section {
    margin-bottom: 20px;
  }
  
  .info-section h3 {
    font-size: 16px;
    margin-bottom: 12px;
  }
  
  .info-item {
    padding: 6px 0;
  }
  
  .uploader-info {
    gap: 12px;
  }
  
  .related-section {
    padding: 16px;
  }
  
  .related-section h2 {
    font-size: 18px;
    margin-bottom: 16px;
  }
  
  .related-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .related-item img {
    height: 100px;
  }
  
  .related-info {
    padding: 12px;
  }
  
  .related-info h4 {
    font-size: 13px;
  }
  
  .related-stats {
    font-size: 11px;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .detail {
    padding: 8px;
  }
  
  .wallpaper-title {
    font-size: 18px;
  }
  
  .wallpaper-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .stat-item {
    font-size: 12px;
  }
  
  .overlay-actions {
    gap: 6px;
  }
  
  .overlay-actions .el-button {
    font-size: 12px;
    padding: 8px 12px;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 8px 0;
  }
  
  .info-item label {
    font-size: 13px;
  }
  
  .info-item span {
    font-size: 14px;
  }
  
  .tags {
    gap: 6px;
  }
  
  .tag-item {
    font-size: 12px;
  }
  
  .uploader-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .related-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .related-item img {
    height: 120px;
  }
  
  .related-info h4 {
    font-size: 14px;
  }
  
  .related-stats {
    font-size: 12px;
  }
}


/* 1. 消除 Dialog 默认白盒样式 */
:deep(.cinema-preview-dialog) {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  margin: 0 !important;
  --el-dialog-bg-color: transparent;
}

/* 2. 移除 Header 和 Body 的内边距 */
:deep(.cinema-preview-dialog .el-dialog__header) {
  display: none; 
}
:deep(.cinema-preview-dialog .el-dialog__body) {
  padding: 0 !important;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 3. 沉浸式背景：深度模糊 */
:deep(.el-overlay) {
  background-color: rgba(0, 0, 0, 0.85) !important;
  backdrop-filter: blur(15px); /* 毛玻璃效果 */
  transition: all 0.4s ease;
}

/* 4. 图片容器与动画 */
.cinema-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: zoom-out; /* 提示点击缩小 */
}

.cinema-image {
  max-width: 95vw;
  max-height: 85vh;
  object-fit: contain;
  box-shadow: 0 0 80px rgba(0, 0, 0, 0.9);
  /* 入场动画：轻微放大弹出 */
  animation: cinemaZoom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  user-select: none;
  -webkit-user-drag: none;
  /* 占位背景：跟随主题变化，避免加载时白屏 */
  background: var(--app-bg-card);
}

/* 5. 电影字幕式文案 */
.cinema-caption {
  position: absolute;
  bottom: 5vh;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
  pointer-events: none; /* 点击事件穿透到父容器 */
}

.cinema-caption h3 {
  font-weight: 300;
  letter-spacing: 2px;
  margin-bottom: 4px;
}

/* 放大入场动画 */
@keyframes cinemaZoom {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

</style>