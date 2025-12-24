<template>
  <div class="image-detail">
    <div class="container" v-if="imageUrl">
      <div class="toolbar">
        <el-button @click="goPost" size="small">返回帖子</el-button>
        <el-button @click="download" size="small" type="primary">下载图片</el-button>
      </div>
      <div class="viewer">
        <img :src="imageUrl" class="image" />
      </div>
    </div>
    <div v-else class="empty">图片不存在</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const postId = Number(route.params.id)
const index = Number(route.params.index)
const imageUrl = ref('')

try {
  const s = localStorage.getItem('community_posts')
  const list = s ? JSON.parse(s) : []
  const post = list.find(p => p.id === postId)
  imageUrl.value = post?.images?.[index] || ''
} catch {}

const router = useRouter()
const goPost = () => router.push(`/community/post/${postId}`)
const download = () => { if (imageUrl.value) window.open(imageUrl.value, '_blank') }
</script>

<style scoped>
.image-detail { padding: 2rem 0; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 2rem; }
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
.viewer { display: flex; justify-content: center; }
.image { max-width: 100%; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
.empty { text-align: center; padding: 40px; opacity: 0.7; }
</style>
