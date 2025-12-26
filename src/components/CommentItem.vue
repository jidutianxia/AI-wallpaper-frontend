<template>
  <div class="comment-item" @click="goProfile(comment.author?.id)">
    <img :src="avatarSrc" class="avatar" @error="onError" />
    <div class="content">
      <div class="meta">
        <span class="name">{{ comment.author?.username || '匿名' }}</span>
        <span class="time">{{ formatDate(comment.createdAt) }}</span>
      </div>
      <div class="text">{{ comment.content || String(comment) }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const props = defineProps({ comment: { type: Object, required: true } })
const router = useRouter()
const userStore = useUserStore()
const avatarSrc = computed(() => props.comment?.author?.avatarUrl || placeholder)

const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjE0IiByPSI5IiBmaWxsPSIjZWRlZWRlIi8+PHBhdGggZD0iTTIwIDIyQzEzLjM2IDIyIDggMjcuMzYgOCAzNHYySDMyVjM0QzMyIDI3LjM2IDI2LjY0IDIyIDIwIDIyWiIgZmlsbD0iI2RlZWRlZSIvPjwvc3ZnPg=='

const onError = (e) => { e.target.src = placeholder }
const formatDate = (s) => { try { return s ? new Date(s).toLocaleString('zh-CN') : '' } catch { return '' } }
const goProfile = (uid) => {
  if (!uid) return
  const myId = userStore.info?.id
  if (myId && String(myId) === String(uid)) router.push('/user')
  else router.push(`/profile/${uid}`)
}
</script>

<style scoped>
.comment-item { display: flex; gap: 10px; padding: 8px 0; cursor: pointer; }
.avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.content { flex: 1; }
.meta { display: flex; gap: 8px; font-size: 12px; color: #909399; }
.name { font-weight: 600; color: #606266; }
.text { margin-top: 4px; line-height: 1.6; }
.dark .name { color: #e5e7eb; }
.dark .meta { color: #9ca3af; }
</style>
