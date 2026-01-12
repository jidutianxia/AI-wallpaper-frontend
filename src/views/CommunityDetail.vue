<template>
  <div class="post-detail">
    <div class="container" v-if="loadingPost">
      <el-skeleton animated :rows="4" />
    </div>
    <div class="container" v-else-if="post">
      <div class="topbar">
        <el-button circle :icon="ArrowLeftBold" @click="goBack" class="back-btn"></el-button>
        <span class="page-title">帖子详情</span>
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
          <el-tag v-for="t in post.tags" :key="t" class="post-tag">{{ t }}</el-tag>
        </div>
      </div>

      <div class="content" @click="noop">
        <p>{{ post.content }}</p>
      </div>

      <div class="images">
        <img v-for="(u, i) in post.images" :key="u" :src="u" class="image" @click="goImage(i)" />
      </div>

      <div class="actions">
        <el-button link :class="{ 'liked': post?.liked }" @click="toggleLike">
          <el-icon :size="24" class="action-icon">
            <svg v-if="post?.liked" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path fill="currentColor" d="M923 283.6a260.04 260.04 0 0 0-56.9-82.8 264.4 264.4 0 0 0-84-55.5A260 260 0 0 0 679.7 125c-49.3 0-97.4 13.5-139.2 39-10 6.1-19.5 12.8-28.5 20.1-9-7.3-18.5-14-28.5-20.1-41.8-25.5-89.9-39-139.2-39-35.5 0-69.9 6.8-102.4 20.3-31.4 13-59.7 31.7-84 55.5a258.44 258.44 0 0 0-56.9 82.8c-13.9 32.3-21 66.6-21 101.9 0 33.3 6.8 68 20.3 103.3 11.3 29.5 27.5 60.1 48.2 91 32.8 48.9 77.9 99.9 133.9 151.6 92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3 56-51.7 101.1-102.7 133.9-151.6 20.7-30.9 37-61.5 48.2-91 13.5-35.3 20.3-70 20.3-103.3.1-35.3-7-69.6-20.9-101.9z"/></svg>
            <svg v-else viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path fill="currentColor" d="M699.6 148.8c-76.8 0-146.4 40.8-187.6 102.4C470.4 189.6 401.2 148.8 324 148.8 194.8 148.8 90 253.6 90 382.8c0 178 184.4 330 384.4 468.4 12.8 8.8 29.2 8.8 42 0C739.2 702.4 934 544.4 934 382.8c-0.4-129.2-105.2-234-234.4-234z m0-64c164.4 0 298.4 133.6 298.4 298 0 205.6-224.4 394-472.4 559.6-9.2 6-21.2 6-30.4 0C247.2 776.8 26 588.4 26 382.8 26 218.4 160 84.8 324.4 84.8c92 0 174.4 42 228.4 107.2 54-65.2 136.4-107.2 228.4-107.2z" transform="scale(0.9) translate(50,50)"/></svg>
          </el-icon>
          <span class="count">{{ post.likes ?? 0 }}</span>
        </el-button>
        <el-button link :class="{ 'favorited': post?.favorited }" @click="toggleFavorite">
          <el-icon :size="24" class="action-icon">
            <StarFilled v-if="post?.favorited" />
            <Star v-else />
          </el-icon>
          <span class="count">{{ post?.favorites ?? 0 }}</span>
        </el-button>
        <el-button link @click="shareDetail">
          <el-icon :size="22" class="action-icon"><Share /></el-icon>
          <span class="count">分享</span>
        </el-button>
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
import { ArrowLeftBold, Star, StarFilled, Share, ChatLineSquare } from '@element-plus/icons-vue'
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
    if (typeof post.value.favorites !== 'number') post.value.favorites = 0
    post.value.liked = !!post.value.liked
    post.value.favorited = !!post.value.favorited
  } catch { ElMessage.error('加载失败') }
  finally { loadingPost.value = false }
})

import { useInteraction } from '@/composables/useInteraction'

const { toggleInteraction } = useInteraction()
const toggleLike = async () => {
  await toggleInteraction(post.value, 'like', 'post')
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
  await toggleInteraction(post.value, 'favorite', 'post')
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
.editor { display: flex; gap: 8px; }
.editor :deep(.el-input__wrapper) { background: var(--app-bg-base); box-shadow: 0 0 0 1px var(--app-border) inset; }
.editor :deep(.el-input__inner) { color: var(--app-text-main); }
.empty { text-align: center; padding: 40px; opacity: 0.7; color: var(--app-text-secondary); }
.topbar { display:flex; gap:8px; margin-bottom:12px; }
.topbar :deep(.el-button) { background: var(--app-bg-card); border-color: var(--app-border); color: var(--app-text-main); }

@media (max-width: 768px) { .images { grid-template-columns: repeat(2, 1fr); } }

/* Removed dark overrides at bottom */
</style>
