<template>
  <div class="image-detail">
    <div class="container" v-if="loading">
      <el-skeleton animated :rows="5" />
    </div>
    <div class="container" v-else-if="imageUrl">
      <div class="topbar">
        <el-button size="small" :icon="ArrowLeftBold" @click="goPost">返回帖子</el-button>
      </div>
      <div class="image-content">
        <div class="image-display">
          <div class="image-container">
            <img :src="imageUrl" class="image" @click="preview = true" @load="onImageLoad" />
          </div>
        </div>
        <div class="side-info" v-if="post">
            <div class="info-header">
              <h1 class="info-title">{{ post.title }}</h1>
              <div class="info-stats">
                <span class="stat-item"><el-icon><Star /></el-icon> {{ imageMeta.likes ?? post.likes ?? 0 }} 点赞</span>
                <span class="stat-item"><el-icon><Calendar /></el-icon> {{ formatDate(post.createdAt) }}</span>
              </div>
              <div class="info-actions">
                <el-button type="primary" size="large" :icon="Download" @click="download">下载原图</el-button>
                <el-button :type="imageMeta.liked ? 'danger' : 'default'" size="large" :icon="Star" @click="toggleImageLike">{{ imageMeta.liked ? '已点赞' : '点赞' }} ({{ imageMeta.likes }})</el-button>
                <el-button :type="imageMeta.favorited ? 'warning' : 'default'" size="large" @click="toggleImageFavorite">{{ imageMeta.favorited ? '已收藏' : '收藏' }}</el-button>
                <el-button size="large" @click="shareImage"><svg viewBox="0 0 24 24" class="btn-icon plane-svg" aria-hidden="true"><path d="M2 12l20-8-8 9 8 9-20-8 7-2 0 0z" fill="currentColor"/></svg> 分享</el-button>
              </div>
            </div>
            <div class="info-section">
              <h3>图片信息</h3>
              <div class="info-grid">
                <div class="info-item"><label>分辨率:</label><span>{{ imageMeta.width }} × {{ imageMeta.height }}</span></div>
                <div class="info-item"><label>文件大小:</label><span>{{ formatFileSize(imageMeta.fileSize) }}</span></div>
                <div class="info-item"><label>格式:</label><span>{{ imageMeta.format || 'JPG' }}</span></div>
                <div class="info-item"><label>浏览:</label><span>{{ imageMeta.views ?? 0 }}</span></div>
                <div class="info-item"><label>下载:</label><span>{{ imageMeta.downloads ?? 0 }}</span></div>
              </div>
            </div>
            <div class="info-section" v-if="post.tags && post.tags.length">
              <h3>标签</h3>
              <div class="tags">
                <el-tag v-for="t in post.tags" :key="t" class="tag-item">{{ t }}</el-tag>
              </div>
            </div>
            <div class="info-section" v-if="post.author">
              <h3>发布者</h3>
              <div class="uploader-info" @click="goProfile(post.author.id)" style="cursor:pointer">
                <el-avatar :src="post.author.avatarUrl" :size="40">{{ post.author.username?.[0] }}</el-avatar>
                <div class="uploader-details">
                  <div class="uploader-name">{{ post.author.username }}</div>
                  <div class="uploader-desc">查看TA的主页</div>
                </div>
              </div>
            </div>
          <div class="info-section">
            <h3>评论</h3>
            <div class="comments" v-if="loadingComments"><el-skeleton animated :rows="3" /></div>
            <div class="comments" v-else>
              <CommentItem v-for="(c,i) in comments" :key="i" :comment="c" />
              <div class="comment-editor">
                <el-input v-model="newComment" placeholder="写下评论" />
                <el-button size="small" type="primary" @click="submitComment">发布</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <el-dialog v-model="preview" :show-close="false" :close-on-click-modal="true" class="preview-dialog" width="90%">
        <img :src="imageUrl" class="preview-image" @load="onImageLoad" />
      </el-dialog>
    </div>
    <div v-else class="empty">图片不存在</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Download, ArrowLeftBold, Star, Calendar } from '@element-plus/icons-vue'
import { getCommunityPost, getCommunityPostImageMeta, likeCommunityPostImage, favoriteCommunityPostImage, downloadCommunityPostImage, getCommunityPostComments, commentCommunityPost } from '@/api/wallpaper'
import CommentItem from '@/components/CommentItem.vue'
import { useUserStore } from '@/store/user'

const route = useRoute()
const postId = Number(route.params.id)
const index = Number(route.params.index)
const imageUrl = ref('')
const post = ref(null)
const loading = ref(true)
const preview = ref(false)
const imageMeta = ref({ width: 0, height: 0, fileSize: null, format: '', views: 0, downloads: 0, liked: false, likes: 0, favorited: false })
const comments = ref([])
const loadingComments = ref(true)
const newComment = ref('')

onMounted(async () => {
  try {
    const p = await getCommunityPost(postId)
    post.value = p
    imageUrl.value = p?.images?.[index] || ''
    try {
      const meta = await getCommunityPostImageMeta(postId, index)
      imageMeta.value = {
        width: meta.width ?? 0,
        height: meta.height ?? 0,
        fileSize: meta.fileSize ?? null,
        format: meta.format ?? guessFormat(imageUrl.value),
        views: meta.views ?? 0,
        downloads: meta.downloads ?? 0,
        liked: !!meta.liked,
        likes: meta.likes ?? 0,
        favorited: !!meta.favorited
      }
    } catch {}
  } catch {
    ElMessage.error('图片加载失败')
  } finally {
    loading.value = false
  }

  try {
    const res = await getCommunityPostComments(postId, { page: 1, size: 20 })
    comments.value = res.items || []
  } catch {}
  finally { loadingComments.value = false }
})

const router = useRouter()
const userStore = useUserStore()
const goPost = () => router.push(`/community/post/${postId}`)
const download = () => { if (imageUrl.value) window.open(imageUrl.value, '_blank') }

const formatDate = (s) => { try { return s ? new Date(s).toLocaleDateString('zh-CN') : '刚刚' } catch { return '刚刚' } }

const onImageLoad = (e) => {
  const img = e.target
  if (!imageMeta.value.width || !imageMeta.value.height) {
    imageMeta.value.width = img.naturalWidth || 0
    imageMeta.value.height = img.naturalHeight || 0
  }
  if (!imageMeta.value.format) imageMeta.value.format = guessFormat(imageUrl.value)
}

const guessFormat = (url) => {
  try {
    const m = (url || '').toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/)
    return (m && m[1] || 'JPG').toUpperCase()
  } catch { return 'JPG' }
}

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '未知'
  const sizes = ['B','KB','MB','GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const toggleImageLike = async () => {
  const prev = { liked: imageMeta.value.liked, likes: imageMeta.value.likes }
  imageMeta.value.liked = !prev.liked
  imageMeta.value.likes = prev.likes + (imageMeta.value.liked ? 1 : -1)
  try { await likeCommunityPostImage(postId, index) } catch { imageMeta.value.liked = prev.liked; imageMeta.value.likes = prev.likes; ElMessage.error('图片点赞失败') }
}

const toggleImageFavorite = async () => {
  const prev = imageMeta.value.favorited
  imageMeta.value.favorited = !prev
  try { await favoriteCommunityPostImage(postId, index) } catch { imageMeta.value.favorited = prev; ElMessage.error('图片收藏失败') }
}

const recordDownload = async () => { try { await downloadCommunityPostImage(postId, index) } catch {} }

const shareImage = async () => {
  const url = `${location.origin}/community/post/${postId}/image/${index}`
  try {
    if (navigator.share) {
      await navigator.share({ title: post.value?.title, text: '查看帖子图片', url })
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url)
      ElMessage.success('链接已复制到剪贴板')
    } else {
      const inp = document.createElement('input'); inp.value = url; document.body.appendChild(inp); inp.select(); document.execCommand('copy'); document.body.removeChild(inp); ElMessage.success('链接已复制到剪贴板')
    }
  } catch (e) { ElMessage.error('分享失败：' + (e.message || '未知错误')) }
}
</script>

<style scoped>
.image-detail { padding: 2rem 0; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 2rem; }
.image-content { display: grid; grid-template-columns: 1fr 400px; gap: 40px; margin-bottom: 40px; }
.image-display { position: relative; }
.image-container { position: relative; border-radius: 12px; overflow: hidden; background: #f8f9fa; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
.image { width: 100%; height: auto; display: block; cursor: pointer; transition: transform .3s ease; }
.image:hover { transform: scale(1.02); }
.topbar { display:flex; gap:8px; margin-bottom:12px; }
.side-info { background: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); height: fit-content; }
.info-header { margin-bottom: 20px; }
.info-title { margin: 0 0 12px; font-size: 24px; font-weight: 700; color: #333; }
.info-stats { display: flex; flex-direction: column; gap: 8px; }
.stat-item { display: flex; align-items: center; gap: 8px; color: #666; font-size: 14px; }
.info-actions { margin-top: 12px; display: flex; gap: 12px; }
.info-grid { display: grid; gap: 12px; }
.info-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
.info-item:last-child { border-bottom: none; }
.info-section { margin-top: 20px; }
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.tag-item { cursor: default; }
.uploader-info { display: flex; align-items: center; gap: 12px; }
.uploader-name { font-weight: 600; color: #333; }
.empty { text-align: center; padding: 40px; opacity: 0.7; }
.dark .container { background: linear-gradient(#1f2937,#1f2937) padding-box, linear-gradient(135deg, var(--brand-gradient-start), var(--brand-gradient-end)) border-box; border-radius: 12px; border: 1px solid transparent; }

@media (max-width: 768px) {
  .image-content { grid-template-columns: 1fr; gap: 20px; }
  .info-actions { flex-direction: column; }
}

.preview-dialog { text-align: center; }
.preview-image { max-width: 100%; max-height: 80vh; object-fit: contain; }
.comments { display: grid; gap: 8px; }
.comment-editor { display: flex; gap: 8px; }
</style>
