<template>
  <div class="profile">
    <div class="container" v-if="userId">
      <div class="header">
        <img :src="avatarUrl" class="avatar" />
        <div class="meta">
          <div class="name">{{ username }}</div>
          <div class="desc">公开分享</div>
        </div>
      </div>

      <div class="posts">
        <el-card v-for="p in userPosts" :key="p.id" class="post">
          <div class="post-head">
            <h4 class="title" @click="goPost(p.id)">{{ p.title }}</h4>
            <div class="tags">
              <el-tag v-for="t in p.tags" :key="t" size="small">{{ t }}</el-tag>
            </div>
          </div>
          <p class="content">{{ p.content }}</p>
          <div class="images">
            <img v-for="(u,i) in p.images" :key="u" :src="u" class="image" @click="goImage(p.id,i)" />
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserCommunityPosts } from '@/api/wallpaper'

const route = useRoute()
const router = useRouter()
const userId = route.params.id // 支持字符串ID或用户名
const userPosts = ref([])
const username = ref('用户')
const avatarUrl = ref('')

onMounted(async () => {
  try {
    const res = await getUserCommunityPosts(userId, { page: 1, size: 20 })
    userPosts.value = res.items || []
    const a = userPosts.value[0]?.author
    if (a) {
      username.value = a.nickname || a.username || '用户'
      avatarUrl.value = a.avatarUrl || ''
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载用户公开帖子失败')
  }
})

const goPost = (id) => router.push(`/community/post/${id}`)
const goImage = (id, index) => router.push(`/community/post/${id}/image/${index}`)
</script>

<style scoped>
.profile { padding: 2rem 0; }
.container { max-width: 1000px; margin: 0 auto; padding: 0 2rem; }
.header { display: inline-flex; gap: 16px; align-items: center; margin-bottom: 16px; }
.avatar { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; }
.name { font-size: 1.25rem; font-weight: 700; }
.posts { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.post-head { display: flex; justify-content: space-between; align-items: baseline; }
.images { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
.image { width: 100%; height: 160px; object-fit: cover; border-radius: 8px; cursor: zoom-in; }
@media (max-width: 768px) { .images { grid-template-columns: repeat(2, 1fr); } }
.dark .profile :deep(.el-card.post) { background:#1f2937; border-color:#374151; color:#e5e7eb; }
.dark .name { color:#e5e7eb; }
</style>
