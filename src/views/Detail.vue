<template>
  <div class="detail immersive-detail">
    <div v-if="wallpaper" class="detail-ambient" aria-hidden="true" :style="{ backgroundImage: `url(${JSON.stringify(mediaPoster(wallpaper))})` }" />
    <div class="topbar">
      <el-button size="small" :icon="ArrowLeft" @click="goBack">返回</el-button>
    </div>
    <AppState v-if="loading" type="loading" :rows="5" />
    <AppState
      v-else-if="loadError"
      type="error"
      description="壁纸详情加载失败"
      retryable
      @retry="fetchWallpaper(route.params.id)"
    />
    <div v-else-if="wallpaper" class="detail-content">
      <!-- 壁纸展示区 -->
      <div class="wallpaper-display">
        <WallpaperStage :image="wallpaper" />
      </div>

      <!-- 壁纸信息区 -->
      <div class="wallpaper-info">
        <div class="info-header">
          <h1 class="wallpaper-title">{{ wallpaper.title }}</h1>

          <!-- New Action Area (Moved from overlay) -->
          <div class="action-area">
              <div class="secondary-actions">
                <ReactionButton class="detail-favorite" kind="favorite" :active="Boolean(wallpaper.favorited)" :pending-action="wallpaper._interacting" @click="toggleFavorite" />
                <el-button
                  class="btn-gradient-orange"
                  size="large"
                  :icon="Download"
                  :loading="downloading"
                  @click="downloadWallpaper"
                >
                  下载
                </el-button>
                <ReactionButton class="detail-like" :active="Boolean(wallpaper.liked)" :count="Number(wallpaper.likes || 0)" :pending-action="wallpaper._interacting" @click="toggleLike" />
              </div>
              <div v-if="canManage" class="author-actions">
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
            <el-button class="report-action" circle text :icon="Warning" aria-label="举报" title="举报" @click="reportWallpaper" />
          </div>
        </div>

        <div class="info-content">
          <div class="info-section">

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
                <span class="detail-value">{{ wallpaper.format || '—' }}</span>
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

            <p class="description">{{ wallpaper.description }}</p>
          </div>

          <div class="info-section" v-if="uploaderInfo">

            <div class="uploader-info card-nested" role="link" tabindex="0" @keydown.enter="goProfile(uploaderInfo.id)" @click="goProfile(uploaderInfo.id)" style="cursor: pointer;">
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
    <div class="related-section" v-if="!loading && relatedWallpapers.length">
      <h2>相关推荐</h2>
      <div class="related-grid">
        <div
          v-for="item in relatedWallpapers"
          :key="item.id"
          class="related-item" role="link" tabindex="0" @keydown.enter="viewDetail(item.id)"
          @click="viewDetail(item.id)"
        >
          <MediaSurface :src="item" :alt="item.title" />
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

  </div>
</template>

<script setup>
import { mediaPoster } from '@/utils/media'
import MediaSurface from '@/components/MediaSurface.vue'
import { ref, reactive,nextTick, computed, watch, onBeforeUnmount } from 'vue'
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
  Delete,
  Warning
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getWallpaper, getWallpapers, downloadWallpaperApi, deleteWallpaper, updateWallpaper, getCategories, reportContent } from '@/api'
import { downloadFile, normalizeCategories, normalizePagedResult, normalizeWallpaper } from '@/utils'
import { useInteraction } from '@/composables/useInteraction'
import AppState from '@/components/AppState.vue'
import ReactionButton from '@/components/ReactionButton.vue'
import WallpaperStage from '@/components/WallpaperStage.vue'
import { getImageUrl } from '@/utils/imageHelper'
import { requestAuth } from '@/utils/authEvents'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { toggleInteraction } = useInteraction()

const isMounted = ref(true)
onBeforeUnmount(() => {
  isMounted.value = false
})

// 响应式数据
const loading = ref(true)
const loadError = ref(null)
const likeLoading = ref(false)
const favoriteLoading = ref(false)
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

const canManage = computed(() => {
  if (!userStore.isAuthenticated || !userStore.info) return false
  return userStore.info.roles?.includes('admin') ||
    (uploaderInfo.value != null && String(userStore.info.id) === String(uploaderInfo.value.id))
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
    categoryOptions.value = normalizeCategories(res || [])
  } catch (e) {
    console.error('Failed to fetch categories:', e)
  }
}

// 打开编辑对话框
const handleEdit = async () => {
  await fetchCategories()
  editForm.title = wallpaper.value.title || ''
  editForm.description = wallpaper.value.description || ''
  editForm.category = wallpaper.value.category || ''
  editForm.tagsList = [...processedTags.value]
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
let detailRequestId = 0
const fetchWallpaper = async (id) => {
  const requestId = ++detailRequestId
  loading.value = true
  loadError.value = null
  try {
    const response = await getWallpaper(id)
    if (!isMounted.value || requestId !== detailRequestId) return
    wallpaper.value = normalizeWallpaper(response)

    // 获取相关推荐
    fetchRelatedWallpapers(requestId)
  } catch (error) {
    if (!isMounted.value || requestId !== detailRequestId) return
    wallpaper.value = null
    relatedWallpapers.value = []
    loadError.value = error
    return
  } finally {
    if (isMounted.value && requestId === detailRequestId) loading.value = false
  }
}

// 获取相关推荐
const fetchRelatedWallpapers = async (requestId) => {
  try {
    const response = await getWallpapers({
      category: wallpaper.value?.category,
      size: 6,
      exclude: wallpaper.value?.id
    })
    if (!isMounted.value || requestId !== detailRequestId) return
    relatedWallpapers.value = normalizePagedResult(response, normalizeWallpaper).items.filter(item => String(item.id) !== String(wallpaper.value?.id))
  } catch (error) {
    if (!isMounted.value || requestId !== detailRequestId) return
    relatedWallpapers.value = []
    return
  }
}

// 切换点赞
const toggleLike = async () => {
  if (!wallpaper.value) return
  likeLoading.value = true
  try {
    await toggleInteraction(wallpaper.value, 'like', 'wallpaper', {
      successMessage: (item) => item.liked ? '点赞成功' : '取消点赞'
    })
  } finally {
    if (isMounted.value) likeLoading.value = false
  }
}

const reportWallpaper = async () => {
  if (!userStore.isAuthenticated) {
    requestAuth({ reason: 'report' })
    return
  }
  try {
    const { value } = await ElMessageBox.prompt('请简要说明问题', '举报壁纸', {
      confirmButtonText: '提交',
      cancelButtonText: '取消',
      inputPlaceholder: '例如侵权、垃圾内容或错误的作品信息'
    })
    await reportContent({
      targetType: 'wallpaper',
      targetId: wallpaper.value.id,
      reason: 'user_report',
      description: value || ''
    })
    ElMessage.success('举报已提交')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error('提交失败，请稍后重试')
  }
}

// 下载壁纸
const downloading = ref(false)
const downloadWallpaper = async () => {
  if (!wallpaper.value || downloading.value) return
  downloading.value = true
  try {
    const item = wallpaper.value
    const { downloadUrl } = await downloadWallpaperApi(item.id)
    if (!downloadFile(downloadUrl)) throw new Error('Invalid download URL')
    item.downloads++
    ElMessage.success('开始下载')

  } catch (error) {
    console.error('Download error:', error)
    ElMessage.error('下载请求失败')
  } finally {
    downloading.value = false
  }
}

// 预览图片
const toggleFavorite = async () => {
  if (!wallpaper.value) return
  favoriteLoading.value = true
  try { await toggleInteraction(wallpaper.value, 'favorite', 'wallpaper') }
  finally { favoriteLoading.value = false }
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
.detail { margin: 0 auto; width: 100%; }
.wallpaper-stats,.stat-item,.tags,.uploader-info,.related-stats,.dialog-footer-content,.dialog-actions { display: flex; align-items: center; }
.wallpaper-stats { flex-direction: row; }
.stat-item { gap: 6px; color: var(--app-text-secondary); }
.info-grid,.related-grid { display: grid; }
.tags { flex-wrap: wrap; }
.tag-item { cursor: pointer; }
.uploader-info { gap: 13px; }
.uploader-details { flex: 1; }
.uploader-name { font-size: 14px; font-weight: 500; }
.uploader-stats { font-size: 11px; color: var(--app-text-secondary); }
.author-actions { margin-top: 12px; }
.related-item { cursor: pointer; }
.related-item img { width: 100%; display: block; }
.related-info { padding: 16px; }
.related-info h4 { margin: 0 0 10px; font-weight: 500; }
.related-stats { gap: 18px; color: var(--app-text-secondary); font-size: 11px; }
.related-stats span { display: inline-flex; align-items: center; gap: 5px; }
.dialog-footer-content { justify-content: space-between; gap: 12px; }
.dialog-actions { gap: 10px; }
.description { color: var(--app-text-secondary); }
</style>
