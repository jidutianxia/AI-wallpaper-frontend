<template>
  <div class="post-detail">
    <div class="container" v-if="loadingPost">
      <el-skeleton animated :rows="4" />
    </div>
    <div class="container" v-else-if="post">
      <div class="topbar">
        <el-button aria-label="返回社区" title="返回社区" circle :icon="ArrowLeftBold" @click="goBack" class="back-btn"></el-button>
        <span class="page-title">帖子详情</span>
      </div>
      <div class="header">
        <div class="author" role="link" tabindex="0" @keydown.enter="goProfile(post.author?.id)" @click="goProfile(post.author?.id)">
          <img :src="getAvatarUrl(post.author?.avatarUrl)" alt="" class="avatar" />
          <div class="meta">
            <div class="name">{{ post.author?.username || '匿名' }}</div>
            <div class="time">{{ post.createdAt || '刚刚' }}</div>
          </div>
        </div>
        <h1 class="title">{{ post.title }}</h1>
        <div class="tags">
          <el-tag v-for="t in post.tags" :key="t" class="post-tag">{{ t }}</el-tag>
        </div>
      </div>

      <div class="content" @click="noop">
        <p>{{ post.content }}</p>
      </div>

      <div class="images">
        <MediaSurface v-for="(u, i) in post.images" :key="i" :src="getImageUrl(u)" :alt="`${post.title || '作品'} · ${i + 1}`" role="link" tabindex="0" @keydown.enter="goImage(i)" class="image" @click.stop="goImage(i)" />
      </div>

      <div class="actions">
        <ReactionButton :active="Boolean(post.liked)" :pending-action="post._interacting" :count="Number(post.likes || 0)" @click="toggleLike" />
        <ReactionButton kind="favorite" :active="Boolean(post.favorited)" :pending-action="post._interacting" :count="Number(post.favorites || 0)" @click="toggleFavorite" />
        <el-button link @click="shareDetail">
          <el-icon :size="22" class="action-icon"><Share /></el-icon>
          <span class="count">分享</span>
        </el-button>
        <el-button link @click="reportPost">
          <el-icon :size="22" class="action-icon"><Warning /></el-icon>
          <span class="count">举报</span>
        </el-button>
      </div>
      <div class="comments">
        <h3>评论</h3>
        <CommentItem v-for="(c, i) in post.comments || []" :key="i" :comment="c" />
        <div class="editor">
          <el-input v-model="newComment" placeholder="写下评论" aria-label="评论内容" @keyup.enter="submitComment" />
          <el-button class="pill-btn" type="primary" size="small" aria-label="发送评论" :loading="commenting" :disabled="!newComment.trim()" @click="submitComment">发送</el-button>
        </div>
      </div>
    </div>
    <div v-else class="empty">帖子不存在或已删除</div>
  </div>
</template>

<script setup>
import MediaSurface from '@/components/MediaSurface.vue'
import ReactionButton from '@/components/ReactionButton.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeftBold, Star, StarFilled, Share, Warning } from '@element-plus/icons-vue'
import { getCommunityPost, commentCommunityPost, getCommunityPostImageMeta, reportContent } from '@/api'
import CommentItem from '@/components/CommentItem.vue'
import { getImageUrl, getAvatarUrl } from '@/utils/imageHelper'
import { normalizePost } from '@/utils'
import { useInteraction } from '@/composables/useInteraction'
import { useShare } from '@/composables/useShare'
import { requestAuth } from '@/utils/authEvents'
import { getLocalStorageItem } from '@/utils/storage'

const route = useRoute()
const id = Number(route.params.id)
const post = ref(null)
const loadingPost = ref(true)
const newComment = ref('')
const commenting = ref(false)
const { toggleInteraction } = useInteraction()
const { share } = useShare()

const isMounted = ref(true)
onBeforeUnmount(() => {
  isMounted.value = false
})

onMounted(async () => {
  try {
    const res = await getCommunityPost(id)
    if (!isMounted.value) return
    post.value = normalizePost(res)
  } catch { 
    if (!isMounted.value) return
    ElMessage.error('加载失败') 
  } finally { 
    if (isMounted.value) loadingPost.value = false 
  }
})

const toggleLike = async () => {
  await toggleInteraction(post.value, 'like', 'post')
}

const submitComment = async () => {
  if (commenting.value) return
  if (!getLocalStorageItem('token')) { requestAuth({ reason: 'comment' }); return }
  const v = newComment.value.trim()
  if (!v) return
  commenting.value = true
  try {
    await commentCommunityPost(id, v)
    if (!isMounted.value) return
    post.value.comments = post.value.comments || []
    post.value.comments.push({ content: v, createdAt: new Date().toISOString(), author: { id: 0, username: '我', avatarUrl: '' } })
    newComment.value = ''
  } catch { 
    if (!isMounted.value) return
    ElMessage.error('评论失败') 
  } finally { commenting.value = false }
}

const router = useRouter()
const goImage = async (index) => {
  try {
    const meta = await getCommunityPostImageMeta(id, index)
    if (!isMounted.value) return
    if (meta && meta.wallpaperInfo && meta.wallpaperInfo.id) {
      router.push(`/detail/${meta.wallpaperInfo.id}`)
    } else {
      router.push(`/community/post/${id}/image/${index}`)
    }
  } catch (e) {
    if (!isMounted.value) return
    console.error('Check wallpaper info failed:', e)
    router.push(`/community/post/${id}/image/${index}`)
  }
}
const goProfile = (uid) => { if (uid) router.push(`/profile/${uid}`) }
const noop = () => {}
const goBack = () => { router.push('/community') }

// 可在需要时加载评论分页
// getCommunityPostComments(id, { page: 1, size: 20 })

const toggleFavorite = async () => {
  await toggleInteraction(post.value, 'favorite', 'post')
}

const shareDetail = async () => {
  await share({
    title: post.value?.title,
    text: (post.value?.content || '').slice(0, 80),
    url: `${location.origin}/community/post/${id}`
  })
}

const reportPost = async () => {
  if (!getLocalStorageItem('token')) {
    requestAuth({ reason: 'report' })
    return
  }
  try {
    const { value } = await ElMessageBox.prompt('请简要说明问题', '举报帖子', {
      confirmButtonText: '提交',
      cancelButtonText: '取消',
      inputPlaceholder: '例如侵权、垃圾内容或不当内容'
    })
    await reportContent({
      targetType: 'post',
      targetId: id,
      reason: 'user_report',
      description: value || ''
    })
    ElMessage.success('举报已提交')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error('提交失败，请稍后重试')
  }
}
</script>



<style scoped>
.post-detail { padding: 2rem 0; }
.container { max-width: 1000px; margin: 0 auto; padding: 0 2rem; }
.container { border: 1px solid transparent; border-radius: 12px; background: linear-gradient(var(--app-bg-card),var(--app-bg-card)) padding-box, linear-gradient(135deg, var(--brand-gradient-start), var(--brand-gradient-end)) border-box; }
/* .dark .container removed - handled by var(--app-bg-card) */
.header { display: grid; gap: 12px; }
.author { display: inline-flex; align-items: center; gap: 12px; cursor: pointer; }
.avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.title { font-size: 1.6rem; font-weight: 700; }
.tags { display: flex; gap: 8px; }
.post-tag { 
  border-radius: 999px; 
  padding: 0 12px; 
  background: var(--app-bg-hover); 
  border: 1px solid var(--app-border); 
  color: var(--app-text-main); 
}
:global(.dark) .post-tag { 
  background: rgba(255, 255, 255, 0.1) !important; 
  border-color: rgba(255, 255, 255, 0.2) !important; 
  color: #e5e7eb !important; 
}
.content { margin-top: 8px; line-height: 1.8; }
.images { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px; }
.image { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; cursor: zoom-in; }
.image:hover { transform: scale(1.02); transition: transform .2s ease; }
.actions { margin-top: 12px; display: flex; gap: 16px; }
.actions .el-button { color: var(--app-text-secondary); font-size: 15px; }
/* Removed dark override */
.actions .el-button:hover { color: var(--app-color-primary); }
.actions .el-button.liked { color: #f56c6c !important; }
.actions .el-button.favorited { color: #e6a23c !important; }
.action-icon { vertical-align: middle; }
.count { margin-left: 6px; font-weight: 500; }
.comments { margin-top: 16px; display: grid; gap: 8px; }
.editor { display: flex; gap: 12px; align-items: center; margin-top: 16px; }
.comment-input { flex: 1; }
.comment-input :deep(.el-input__wrapper) { 
  background: var(--app-bg-base); 
  box-shadow: 0 0 0 1px var(--app-border) inset; 
  border-radius: 999px;
  padding: 8px 16px;
}
.comment-input :deep(.el-input__inner) { color: var(--app-text-main); height: 24px; }
.send-btn { border-radius: 999px; padding: 8px 24px; height: 40px; }
.empty { text-align: center; padding: 40px; opacity: 0.7; color: var(--app-text-secondary); }
.topbar { display:flex; gap:8px; margin-bottom:12px; }
.topbar :deep(.el-button) { background: var(--app-bg-card); border-color: var(--app-border); color: var(--app-text-main); }

@media (max-width: 768px) { .images { grid-template-columns: repeat(2, 1fr); } }

/* Removed dark overrides at bottom */
</style>
