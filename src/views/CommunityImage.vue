<template>
  <div class="image-detail">
    <div class="container" v-if="loading">
      <el-skeleton animated :rows="5" />
    </div>
    <div class="container" v-else-if="loadError">
      <AppState type="error" description="图片详情加载失败" retryable @retry="loadImageDetail" />
    </div>
    <div class="container" v-else-if="imageUrl">
      <div class="topbar">
        <el-button size="small" :icon="ArrowLeftBold" @click="goPost">返回帖子</el-button>
      </div>
      <div class="image-content">
        <div class="image-display">
          <div class="image-container">
            <el-image 
              :src="imageUrl" 
              class="image" 
              :preview-src-list="[imageUrl]" 
              :initial-index="0"
              fit="contain"
              hide-on-click-modal
              lazy
            >
              <template #placeholder>
                <div class="image-slot placeholder-slot">
                  <el-skeleton-item variant="image" style="width: 100%; height: 100%; min-height: 300px" />
                </div>
              </template>
              <template #error>
                <div class="image-slot error-slot">
                  <el-icon><IconPicture /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>
          </div>
        </div>
        <div class="side-info" v-if="post">
            <div class="info-header">
              <h1 class="info-title">{{ post.title }}</h1>
              <div class="info-stats">
                <span class="stat-item"><el-icon><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"><path fill="currentColor" d="M923 283.6a260.04 260.04 0 0 0-56.9-82.8 264.4 264.4 0 0 0-84-55.5A260 260 0 0 0 679.7 125c-49.3 0-97.4 13.5-139.2 39-10 6.1-19.5 12.8-28.5 20.1-9-7.3-18.5-14-28.5-20.1-41.8-25.5-89.9-39-139.2-39-35.5 0-69.9 6.8-102.4 20.3-31.4 13-59.7 31.7-84 55.5a258.44 258.44 0 0 0-56.9 82.8c-13.9 32.3-21 66.6-21 101.9 0 33.3 6.8 68 20.3 103.3 11.3 29.5 27.5 60.1 48.2 91 32.8 48.9 77.9 99.9 133.9 151.6 92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3 56-51.7 101.1-102.7 133.9-151.6 20.7-30.9 37-61.5 48.2-91 13.5-35.3 20.3-70 20.3-103.3.1-35.3-7-69.6-20.9-101.9z"/></svg></el-icon> {{ imageMeta.likes ?? post.likes ?? 0 }} 获赞</span>
                <span class="stat-item"><el-icon><Calendar /></el-icon> {{ formatDate(post.createdAt) }}</span>
              </div>
              <div class="info-actions">
                <el-button 
                  v-if="imageMeta.wallpaperInfo"
                  type="success" 
                  size="large" 
                  @click="goWallpaper" 
                  round
                >
                  <el-icon :size="18" class="action-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="currentColor" d="M160 832h704a32 32 0 1 1 0 64H160a32 32 0 1 1 0-64m384-253.696 236.288-236.352 45.248 45.248L508.8 704 192 387.2l45.248-45.248L480 584.704V128h64z"></path></svg>
                  </el-icon>
                  已上架壁纸
                </el-button>
                <el-button 
                  v-else-if="userStore.info?.id === post.author?.id"
                  type="warning" 
                  size="large" 
                  @click="openSubmitDialog" 
                  round
                >
                  <el-icon :size="18" class="action-icon"><Upload /></el-icon>
                  收录为壁纸
                </el-button>
                <el-button type="primary" size="large" :icon="Download" @click="download" round>下载原图</el-button>
                <el-button 
                  :class="{ 'liked': imageMeta.liked }"
                  size="large" 
                  round
                  @click="toggleImageLike"
                >
                  <el-icon :size="18" class="action-icon">
                     <svg v-if="imageMeta.liked" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path fill="currentColor" d="M923 283.6a260.04 260.04 0 0 0-56.9-82.8 264.4 264.4 0 0 0-84-55.5A260 260 0 0 0 679.7 125c-49.3 0-97.4 13.5-139.2 39-10 6.1-19.5 12.8-28.5 20.1-9-7.3-18.5-14-28.5-20.1-41.8-25.5-89.9-39-139.2-39-35.5 0-69.9 6.8-102.4 20.3-31.4 13-59.7 31.7-84 55.5a258.44 258.44 0 0 0-56.9 82.8c-13.9 32.3-21 66.6-21 101.9 0 33.3 6.8 68 20.3 103.3 11.3 29.5 27.5 60.1 48.2 91 32.8 48.9 77.9 99.9 133.9 151.6 92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3 56-51.7 101.1-102.7 133.9-151.6 20.7-30.9 37-61.5 48.2-91 13.5-35.3 20.3-70 20.3-103.3.1-35.3-7-69.6-20.9-101.9z"/></svg>
                     <svg v-else viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path fill="currentColor" d="M699.6 148.8c-76.8 0-146.4 40.8-187.6 102.4C470.4 189.6 401.2 148.8 324 148.8 194.8 148.8 90 253.6 90 382.8c0 178 184.4 330 384.4 468.4 12.8 8.8 29.2 8.8 42 0C739.2 702.4 934 544.4 934 382.8c-0.4-129.2-105.2-234-234.4-234z m0-64c164.4 0 298.4 133.6 298.4 298 0 205.6-224.4 394-472.4 559.6-9.2 6-21.2 6-30.4 0C247.2 776.8 26 588.4 26 382.8 26 218.4 160 84.8 324.4 84.8c92 0 174.4 42 228.4 107.2 54-65.2 136.4-107.2 228.4-107.2z" transform="scale(0.9) translate(50,50)"/></svg>
                   </el-icon>
                  {{ imageMeta.liked ? '已喜欢' : '喜欢' }}
                </el-button>
                <el-button size="large" round :icon="Warning" @click="reportImage">Report</el-button>
              </div>
            </div>
            <div class="info-section">
              <h3>图片信息</h3>
              <div class="info-grid">
                <div class="info-item"><label>分辨率:</label><span>{{ formatResolution(imageMeta.width, imageMeta.height) }}</span></div>
                <div class="info-item"><label>文件大小:</label><span>{{ formatFileSize(imageMeta.fileSize) }}</span></div>
                <div class="info-item"><label>格式:</label><span>{{ formatImageFormat(imageMeta.format) }}</span></div>
                <div class="info-item"><label>浏览:</label><span>{{ imageMeta.views ?? 0 }}</span></div>
                <div class="info-item"><label>下载:</label><span>{{ imageMeta.downloads ?? 0 }}</span></div>
              </div>
            </div>
            <div class="info-section" v-if="post.tags && post.tags.length">
              <h3>标签</h3>
              <div class="tags">
                <el-tag v-for="t in post.tags" :key="t" class="tag-item post-tag" round>{{ t }}</el-tag>
              </div>
            </div>
            <div class="info-section" v-if="post.author">
              <h3>发布者</h3>
              <div class="uploader-info" @click="goProfile(post.author.id)" style="cursor:pointer">
                <el-avatar :src="getAvatarUrl(post.author.avatarUrl)" :size="48">{{ post.author.username?.[0] }}</el-avatar>
                <div class="uploader-details">
                  <div class="uploader-name">{{ post.author.username }}</div>
                  <div class="uploader-desc">查看TA的主页</div>
                </div>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
        </div>
      </div>

      <el-dialog v-model="previewVisible" :show-close="false" :close-on-click-modal="true" class="preview-dialog" width="90%">
        <img :src="imageUrl" class="preview-image" @load="onImageLoad" />
      </el-dialog>
      
      <!-- Wallpaper Submission Dialog -->
      <el-dialog v-model="submitDialogVisible" title="收录为壁纸" width="500px">
        <el-form :model="submitForm" label-position="top">
          <el-form-item label="壁纸分类 (必填)">
            <el-select v-model="submitForm.category" placeholder="请选择分类" style="width: 100%">
              <el-option v-for="c in wallpaperCategories" :key="c.value" :label="c.label" :value="c.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="标签">
            <el-select v-model="submitForm.tags" multiple allow-create filterable default-first-option placeholder="添加标签" style="width: 100%">
              <el-option v-for="t in tagOptions" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="submitForm.description" type="textarea" :rows="3" placeholder="壁纸描述" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="submitDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="submitting" @click="submitToWallpaper">确认收录</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
    <div v-else class="empty">图片不存在</div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, ArrowLeftBold, Calendar, ArrowRight, Picture as IconPicture, Upload, Warning } from '@element-plus/icons-vue'
import { getCommunityPost, getCommunityPostImageMeta, downloadCommunityPostImage, submitWallpaperFromPost, getCategories, reportContent } from '@/api'
import { useUserStore } from '@/store/user'
import { getImageUrl, getAvatarUrl } from '@/utils/imageHelper'
import { normalizePost, openSecureWindow } from '@/utils'
import { useShare } from '@/composables/useShare'
import AppState from '@/components/AppState.vue'
import { requestAuth } from '@/utils/authEvents'

const route = useRoute()
const postId = Number(route.params.id)
const index = Number(route.params.index)
const rawImage = ref('') // Store raw image data (string or object)
const imageUrl = computed(() => getImageUrl(rawImage.value)) // Computed safe URL
const post = ref(null)
const { share } = useShare()
const loading = ref(true)
const loadError = ref(null)
const imageMeta = ref({ id: null, width: 0, height: 0, fileSize: null, format: '', views: 0, downloads: 0, liked: false, likes: 0, favorited: false, favorites: 0, wallpaperInfo: null })
const previewVisible = ref(false)
const onImageLoad = () => {}

// Submission modal state
const submitDialogVisible = ref(false)
const submitForm = ref({ category: '', tags: [], description: '' })
const wallpaperCategories = ref([])
const tagOptions = ['插画', '风景', '极简', '赛博', '像素', '摄影']
const submitting = ref(false)

const loadCategories = async () => {
  try {
    const cats = await getCategories()
    wallpaperCategories.value = (cats || []).map(c => ({ label: c.name, value: c.id }))
  } catch {}
}
loadCategories()

const loadImageDetail = async () => {
  loading.value = true
  loadError.value = null
  try {
    const p = await getCommunityPost(postId)
    post.value = normalizePost(p)
    rawImage.value = post.value?.images?.[index] || ''
    try {
      const meta = await getCommunityPostImageMeta(postId, index)
      imageMeta.value = {
        id: meta.id ?? null,
        width: meta.width ?? 0,
        height: meta.height ?? 0,
        fileSize: meta.fileSize ?? null,
        format: meta.format ?? guessFormat(imageUrl.value),
        views: meta.views ?? 0,
        downloads: meta.downloads ?? 0,
        liked: !!meta.liked,
        likes: meta.likes ?? 0,
        favorited: !!meta.favorited,
        favorites: meta.favorites ?? 0,
        wallpaperInfo: meta.wallpaperInfo || null
      }
    } catch {}
  } catch (error) {
    loadError.value = error
    ElMessage.error('图片加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadImageDetail)

const router = useRouter()
const userStore = useUserStore()
const goPost = () => router.push(`/community/post/${postId}`)
const goProfile = (id) => { if (id) router.push(`/profile/${id}`) }
const goWallpaper = () => {
  if (imageMeta.value.wallpaperInfo?.id) {
    // Navigate to wallpaper detail (assuming such route exists, or use external link)
    // For now, maybe just show a message or download
    ElMessage.success('该图片已收录为壁纸')
  }
}

const getDownloadUrl = (response) => {
  if (typeof response === 'string') return response
  return response?.downloadUrl || response?.url || response?.href || response?.data?.downloadUrl || response?.data?.url || ''
}

const download = async () => { 
  if (imageUrl.value) {
    // Check if it is a wallpaper
    if (imageMeta.value.wallpaperInfo) {
      // If it is a wallpaper, guide user to the wallpaper detail page to download
      router.push(`/detail/${imageMeta.value.wallpaperInfo.id}`)
      return
    }

    try {
      const response = await downloadCommunityPostImage(postId, index)
      const downloadUrl = getDownloadUrl(response)
      if (!downloadUrl || !openSecureWindow(downloadUrl)) {
        ElMessage.warning('下载地址不可用')
        return
      }
      imageMeta.value.downloads = Number(imageMeta.value.downloads || 0) + 1
      ElMessage.success('开始下载')
    } catch {
      ElMessage.warning('该图片暂未收录为壁纸，可提醒作者上架')
    }
  }
}

const openSubmitDialog = () => {
  submitForm.value = { category: '', tags: [...(post.value.tags || [])], description: post.value.content?.slice(0, 100) || '' }
  submitDialogVisible.value = true
}

const submitToWallpaper = async () => {
  if (!submitForm.value.category) { ElMessage.warning('请选择分类'); return }
  submitting.value = true
  try {
    await submitWallpaperFromPost({
      postId,
      imageIndex: index,
      category: submitForm.value.category,
      tags: submitForm.value.tags,
      description: submitForm.value.description
    })
    ElMessage.success('已成功收录为壁纸')
    submitDialogVisible.value = false
    // Refresh meta to show "Approved" status
    const meta = await getCommunityPostImageMeta(postId, index)
    if (meta.wallpaperInfo) imageMeta.value.wallpaperInfo = meta.wallpaperInfo
  } catch { ElMessage.error('收录失败') }
  finally { submitting.value = false }
}

const formatDate = (s) => { try { return s ? new Date(s).toLocaleDateString('zh-CN') : '刚刚' } catch { return '刚刚' } }

const guessFormat = (url) => {
  try {
    const m = (url || '').toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/)
    return (m && m[1] || '').toUpperCase()
  } catch { return '' }
}

const formatResolution = (width, height) => {
  const w = Number(width)
  const h = Number(height)
  return w > 0 && h > 0 ? `${w} × ${h}` : '未知'
}

const formatImageFormat = (format) => {
  return format ? String(format).toUpperCase() : '未知'
}

const formatFileSize = (bytes) => {
  const value = Number(bytes)
  if (!Number.isFinite(value) || value <= 0) return '未知'
  const sizes = ['B','KB','MB','GB']
  const i = Math.min(Math.floor(Math.log(value) / Math.log(1024)), sizes.length - 1)
  return Math.round(value / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

import { useInteraction } from '@/composables/useInteraction'

const { toggleInteraction } = useInteraction()
const toggleImageLike = async () => {
  if (!imageMeta.value.wallpaperInfo) {
    ElMessage.warning('可提醒作者上架壁纸，方便收藏壁纸')
    return
  }
  await toggleInteraction(imageMeta.value, 'like', 'image', { postId, imageIndex: index })
}
const toggleImageFavorite = async () => {
  await toggleInteraction(imageMeta.value, 'favorite', 'image', { postId, imageIndex: index })
}

const shareImage = async () => {
  await share({
    title: post.value?.title,
    text: '查看帖子图片',
    url: `${location.origin}/community/post/${postId}/image/${index}`
  })
}

const reportImage = async () => {
  if (!userStore.isAuthenticated) {
    requestAuth({ reason: 'report' })
    return
  }
  if (!imageMeta.value.id) {
    ElMessage.warning('Image metadata is not ready')
    return
  }
  try {
    const { value } = await ElMessageBox.prompt('Describe the issue briefly', 'Report image', {
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      inputPlaceholder: 'Spam, infringement, unsafe content, or broken metadata'
    })
    await reportContent({
      targetType: 'post_image',
      targetId: imageMeta.value.id,
      reason: 'user_report',
      description: value || ''
    })
    ElMessage.success('Report submitted')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error('Report failed')
  }
}
</script>



<style scoped>
.image-detail { padding: 2rem 0; min-height: 80vh; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
.image-content { display: grid; grid-template-columns: 1fr 380px; gap: 40px; margin-bottom: 40px; }
.image-display { position: relative; display: flex; align-items: flex-start; justify-content: center; }
.image-container { 
  position: relative; 
  border-radius: 16px; 
  overflow: hidden; 
  background: #f8f9fa; 
  box-shadow: 0 8px 30px rgba(0,0,0,0.08); 
  width: 100%;
}
.dark .image-container { background: #111827; box-shadow: 0 8px 30px rgba(0,0,0,0.3); }

.image { width: 100%; height: auto; min-height: 300px; display: block; cursor: zoom-in; }

.topbar { display:flex; gap:8px; margin-bottom:20px; }

.side-info { 
  background: #fff; 
  border-radius: 16px; 
  padding: 32px; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.06); 
  height: fit-content; 
  position: sticky;
  top: 20px;
}
.dark .side-info { background: #06162c; box-shadow: 0 4px 20px rgba(0,0,0,0.2); border: 1px solid #374151; }

.info-header { margin-bottom: 24px; border-bottom: 1px solid #f0f0f0; padding-bottom: 20px; }
.dark .info-header { border-bottom-color: #374151; }

.info-title { margin: 0 0 16px; font-size: 26px; font-weight: 700; color: #1a1a1a; line-height: 1.3; }
.dark .info-title { color: #f3f4f6; }

.info-stats { display: flex; gap: 16px; margin-bottom: 20px; }
.stat-item { display: flex; align-items: center; gap: 6px; color: #666; font-size: 14px; }
.dark .stat-item { color: #9ca3af; }

.info-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.info-actions .el-button { flex: 1; }

.info-section { margin-top: 24px; }
.info-section h3 { margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1a1a1a; }
.dark .info-section h3 { color: #f3f4f6; }

.info-grid { display: grid; gap: 12px; }
.info-item { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
.info-item label { color: #666; }
.dark .info-item label { color: #9ca3af; }
.info-item span { color: #333; font-weight: 500; }
.dark .info-item span { color: #e5e7eb; }

.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.post-tag { 
  cursor: pointer; 
  transition: all 0.2s; 
  border: 1px solid var(--app-border); 
  background: var(--app-bg-hover); 
  color: var(--app-text-main); 
  --el-tag-text-color: var(--app-text-main);
  border-radius: 999px;
  padding: 0 12px;
}
:global(.dark) .post-tag { 
  background: rgba(255, 255, 255, 0.1) !important; 
  border-color: rgba(255, 255, 255, 0.2) !important; 
  color: #e5e7eb !important; 
}
.post-tag:hover { 
  transform: translateY(-1px); 
  background: var(--app-color-primary) !important;
  color: white !important;
  border-color: var(--app-color-primary) !important;
}
.dark .post-tag:hover { background: var(--app-color-primary) !important; }

.like-btn { color: #606266; }
.dark .like-btn { color: #9ca3af; }
.like-btn:hover { color: #409eff; }
.like-btn.liked { color: #f56c6c !important; border-color: #f56c6c; background-color: rgba(245,108,108,0.1); }
.action-icon { margin-right: 4px; }

.uploader-info { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  padding: 12px; 
  border-radius: 12px; 
  background: var(--app-bg-base); 
  transition: all 0.2s;
  border: 1px solid var(--app-border);
}
/* Removed dark override */
.uploader-info:hover { background: var(--app-bg-card); box-shadow: var(--app-shadow-card); }
/* Removed dark override */

.uploader-details { flex: 1; }
.uploader-name { font-weight: 600; color: var(--app-text-main); font-size: 15px; }
/* Removed dark override */
.uploader-desc { font-size: 12px; color: var(--app-text-secondary); margin-top: 2px; }
/* Removed dark override */

.comments { display: grid; gap: 12px; }
.comment-editor { display: flex; gap: 8px; margin-top: 12px; }
.empty { text-align: center; padding: 60px; opacity: 0.6; color: var(--app-text-secondary); }
/* Removed dark override */
.plane-svg { width: 1.2em; height: 1.2em; margin-right: 4px; }

@media (max-width: 900px) {
  .image-content { grid-template-columns: 1fr; }
  .side-info { position: static; margin-top: 0; }
  .image-container { border-radius: 12px; }
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: 300px;
  background: var(--app-bg-hover);
  color: var(--app-text-secondary);
}
.error-slot {
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
}
.error-slot .el-icon {
  font-size: 48px;
}
</style>

