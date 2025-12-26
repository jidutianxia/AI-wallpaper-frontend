<template>
  <div class="post-detail">
    <div class="container" v-if="loadingPost">
      <el-skeleton animated :rows="4" />
    </div>
    <div class="container" v-else-if="post">
      <div class="topbar">
        <el-button size="small" :icon="ArrowLeftBold" @click="goBack">返回</el-button>
      </div>
      <div class="header">
        <div class="author" @click="goProfile(post.author?.id)">
          <img :src="post.author?.avatarUrl" class="avatar" />
          <div class="meta">
            <div class="name">{{ post.author?.username || '匿名' }}</div>
            <div class="time">{{ post.createdAt || '刚刚' }}</div>
          </div>
        </div>
        <h1 class="title">{{ post.title }}</h1>
        <div class="tags">
          <el-tag v-for="t in post.tags" :key="t" type="info">{{ t }}</el-tag>
        </div>
      </div>

      <div class="content" @click="noop">
        <p>{{ post.content }}</p>
      </div>

      <div class="images">
        <img v-for="(u, i) in post.images" :key="u" :src="u" class="image" @click="goImage(i)" />
      </div>

      <div class="actions">
        <el-button class="pill-btn" :type="post?.liked ? 'primary' : undefined" @click="toggleLike"><svg viewBox="0 0 24 24" class="btn-icon" aria-hidden="true"><path d="M2 21h4a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H2v11zM22 9h-6.31l.95-4.57A2 2 0 0 0 14.69 2L9 8v11h9a2 2 0 0 0 2-2l1-7a2 2 0 0 0-2-2z" fill="currentColor"/></svg> 点赞 {{ post.likes ?? 0 }}</el-button>
        <el-button class="pill-btn" :type="post?.favorited ? 'warning' : undefined" @click="toggleFavorite">{{ post?.favorited ? '★' : '☆' }} 收藏</el-button>
        <el-button class="pill-btn" @click="shareDetail"><svg viewBox="0 0 24 24" class="btn-icon" aria-hidden="true"><path d="M2 12l20-8-8 9 8 9-20-8 7-2 0 0z" fill="currentColor"/></svg> 分享</el-button>
      </div>

      <div class="comments">
        <h3>评论</h3>
        <CommentItem v-for="(c, i) in post.comments || []" :key="i" :comment="c" />
        <div class="editor">
          <el-input v-model="newComment" placeholder="写下评论" />
          <el-button class="pill-btn" type="primary" size="small" aria-label="发布评论" @click="submitComment">发布</el-button>
        </div>
      </div>
    </div>
    <div v-else class="empty">帖子不存在或已删除</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeftBold } from '@element-plus/icons-vue'
import { getCommunityPost, getCommunityPostComments, likeCommunityPost, commentCommunityPost, favoriteCommunityPost } from '@/api/wallpaper'
import { useUserStore } from '@/store/user'
import CommentItem from '@/components/CommentItem.vue'

const route = useRoute()
const id = Number(route.params.id)
const post = ref(null)
const loadingPost = ref(true)
const newComment = ref('')
const userStore = useUserStore()

onMounted(async () => {
  try {
    post.value = await getCommunityPost(id)
    if (typeof post.value.likes !== 'number') post.value.likes = 0
    post.value.liked = !!post.value.liked
    post.value.favorited = !!post.value.favorited
  } catch { ElMessage.error('加载失败') }
  finally { loadingPost.value = false }
})

const toggleLike = async () => {
  if (!post.value) return
  const prevLiked = post.value.liked
  const prevLikes = post.value.likes || 0
  post.value.liked = !prevLiked
  post.value.likes = prevLikes + (post.value.liked ? 1 : -1)
  try {
    const r = await likeCommunityPost(id)
    if (r && typeof r === 'object') {
      if (typeof r.liked !== 'undefined') post.value.liked = !!r.liked
      if (typeof r.likes !== 'undefined') post.value.likes = r.likes
    }
    try {
      const key = `community_interactions_${userStore.info?.id || 'anon'}`
      const map = JSON.parse(localStorage.getItem(key) || '{}')
      map[id] = { liked: post.value.liked, favorited: post.value.favorited }
      localStorage.setItem(key, JSON.stringify(map))
    } catch {}
    ElMessage.success(post.value.liked ? '点赞成功' : '已取消点赞')
  } catch { post.value.liked = prevLiked; post.value.likes = prevLikes; ElMessage.error('点赞失败') }
}

const submitComment = async () => {
  const v = newComment.value.trim()
  if (!v) return
  try {
    await commentCommunityPost(id, v)
    post.value.comments = post.value.comments || []
    post.value.comments.push({ content: v, createdAt: new Date().toISOString(), author: { id: 0, username: '我', avatarUrl: '' } })
    newComment.value = ''
  } catch { ElMessage.error('评论失败') }
}

const router = useRouter()
const goImage = (index) => { router.push(`/community/post/${id}/image/${index}`) }
const goProfile = (uid) => { if (uid) router.push(`/profile/${uid}`) }
const noop = () => {}
const goBack = () => { router.push('/community') }

// 可在需要时加载评论分页
// getCommunityPostComments(id, { page: 1, size: 20 })

const toggleFavorite = async () => {
  if (!post.value) return
  const prev = post.value.favorited
  post.value.favorited = !prev
  try {
    const r = await favoriteCommunityPost(id)
    if (r && typeof r === 'object' && typeof r.favorited !== 'undefined') post.value.favorited = !!r.favorited
    try {
      const key = `community_interactions_${userStore.info?.id || 'anon'}`
      const map = JSON.parse(localStorage.getItem(key) || '{}')
      map[id] = { liked: post.value.liked, favorited: post.value.favorited }
      localStorage.setItem(key, JSON.stringify(map))
    } catch {}
    ElMessage.success(post.value.favorited ? '已收藏' : '已取消收藏')
  } catch { post.value.favorited = prev; ElMessage.error('收藏失败') }
}

const shareDetail = async () => {
  const url = `${location.origin}/community/post/${id}`
  try {
    if (navigator.share) { await navigator.share({ title: post.value?.title, text: (post.value?.content || '').slice(0,80), url }) }
    else if (navigator.clipboard) { await navigator.clipboard.writeText(url); ElMessage.success('链接已复制到剪贴板') }
    else {
      const inp = document.createElement('input'); inp.value = url; document.body.appendChild(inp); inp.select(); document.execCommand('copy'); document.body.removeChild(inp); ElMessage.success('链接已复制到剪贴板')
    }
  } catch (e) { ElMessage.error('分享失败：' + (e.message || '未知错误')) }
}
</script>

<style scoped>
.post-detail { padding: 2rem 0; }
.container { max-width: 1000px; margin: 0 auto; padding: 0 2rem; }
.container { border: 1px solid transparent; border-radius: 12px; background: linear-gradient(#ffffff,#ffffff) padding-box, linear-gradient(135deg, var(--brand-gradient-start), var(--brand-gradient-end)) border-box; }
.dark .container { background: linear-gradient(#1f2937,#1f2937) padding-box, linear-gradient(135deg, var(--brand-gradient-start), var(--brand-gradient-end)) border-box; }
.header { display: grid; gap: 12px; }
.author { display: inline-flex; align-items: center; gap: 12px; cursor: pointer; }
.avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.title { font-size: 1.6rem; font-weight: 700; }
.tags { display: flex; gap: 8px; }
:deep(.el-tag) { border-radius: 999px; padding: 0 10px; background: rgba(147,197,253,.18); border: 1px solid rgba(147,197,253,.35); color: #1f2937; }
.dark :deep(.el-tag) { background: rgba(30,64,175,.28); border-color: rgba(59,130,246,.4); color: #e5e7eb; }
.content { margin-top: 8px; line-height: 1.8; }
.images { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px; }
.image { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; cursor: zoom-in; }
.image:hover { transform: scale(1.02); transition: transform .2s ease; }
.actions { margin-top: 12px; }
.comments { margin-top: 16px; display: grid; gap: 8px; }
.editor { display: flex; gap: 8px; }
.empty { text-align: center; padding: 40px; opacity: 0.7; }
.topbar { display:flex; gap:8px; margin-bottom:12px; }
@media (max-width: 768px) { .images { grid-template-columns: repeat(2, 1fr); } }
.dark .post-detail :deep(.el-card) { background:#1f2937; border-color:#374151; color:#e5e7eb; }
.dark .post-detail { color:#e5e7eb; }
.dark .title { color:#e5e7eb; }
</style>
