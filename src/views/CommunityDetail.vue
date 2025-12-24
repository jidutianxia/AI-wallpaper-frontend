<template>
  <div class="post-detail">
    <div class="container" v-if="post">
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
        <el-button @click="toggleLike">👍 {{ post.likes || 0 }}</el-button>
      </div>

      <div class="comments">
        <h3>评论</h3>
        <div v-for="(c, i) in post.comments || []" :key="i" class="comment">{{ c }}</div>
        <div class="editor">
          <el-input v-model="newComment" placeholder="写下评论" />
          <el-button type="primary" size="small" @click="submitComment">发布</el-button>
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
import { getCommunityPost, getCommunityPostComments, likeCommunityPost, commentCommunityPost } from '@/api/wallpaper'

const route = useRoute()
const id = Number(route.params.id)
const post = ref(null)
const newComment = ref('')

onMounted(async () => {
  try { post.value = await getCommunityPost(id) } catch { ElMessage.error('加载失败') }
})

const toggleLike = async () => {
  if (!post.value) return
  try {
    await likeCommunityPost(id)
    post.value.liked = !post.value.liked
    post.value.likes = (post.value.likes || 0) + (post.value.liked ? 1 : -1)
  } catch { ElMessage.error('点赞失败') }
}

const submitComment = async () => {
  const v = newComment.value.trim()
  if (!v) return
  try {
    await commentCommunityPost(id, v)
    post.value.comments = post.value.comments || []
    post.value.comments.push(v)
    newComment.value = ''
  } catch { ElMessage.error('评论失败') }
}

const router = useRouter()
const goImage = (index) => { router.push(`/community/post/${id}/image/${index}`) }
const goProfile = (uid) => { if (uid) router.push(`/profile/${uid}`) }
const noop = () => {}

// 可在需要时加载评论分页
// getCommunityPostComments(id, { page: 1, size: 20 })
</script>

<style scoped>
.post-detail { padding: 2rem 0; }
.container { max-width: 1000px; margin: 0 auto; padding: 0 2rem; }
.header { display: grid; gap: 12px; }
.author { display: inline-flex; align-items: center; gap: 12px; cursor: pointer; }
.avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.title { font-size: 1.6rem; font-weight: 700; }
.tags { display: flex; gap: 8px; }
.content { margin-top: 8px; line-height: 1.8; }
.images { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px; }
.image { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; cursor: zoom-in; }
.actions { margin-top: 12px; }
.comments { margin-top: 16px; display: grid; gap: 8px; }
.editor { display: flex; gap: 8px; }
.empty { text-align: center; padding: 40px; opacity: 0.7; }
@media (max-width: 768px) { .images { grid-template-columns: repeat(2, 1fr); } }
.dark .post-detail :deep(.el-card) { background:#1f2937; border-color:#374151; color:#e5e7eb; }
.dark .post-detail { color:#e5e7eb; }
.dark .title { color:#e5e7eb; }
</style>
