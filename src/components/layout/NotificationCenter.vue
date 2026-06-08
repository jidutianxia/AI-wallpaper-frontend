<script setup>
import { ref, watch } from 'vue'
import { getUserReceivedComments, getUserReceivedLikes } from '@/api'

const visible = defineModel({ type: Boolean, default: false })

const activeNotify = ref('comments')
const notifyGroups = [
  { key: 'comments', label: '评论/回复' },
  { key: 'likes', label: '点赞/收藏' },
  { key: 'followers', label: '新增粉丝' },
  { key: 'help', label: '收到帮助' },
  { key: 'system', label: '系统通知' }
]
const notifyData = ref({ comments: [], likes: [], followers: [], help: [], system: [] })

watch(visible, async (open) => {
  if (!open) return
  try {
    const [comments, likes] = await Promise.all([
      getUserReceivedComments({ page: 1, size: 10 }),
      getUserReceivedLikes({ page: 1, size: 10 })
    ])
    notifyData.value.comments = comments.items || []
    notifyData.value.likes = likes.items || []
  } catch {}
})
</script>

<template>
  <el-dialog v-model="visible" title="通知中心" width="800px" class="notify-dialog">
    <div class="notify-container">
      <div class="notify-nav">
        <button
          v-for="group in notifyGroups"
          :key="group.key"
          class="notify-item"
          :class="{ active: activeNotify === group.key }"
          @click="activeNotify = group.key"
        >
          {{ group.label }}
        </button>
      </div>
      <div class="notify-content">
        <el-card v-for="item in notifyData[activeNotify]" :key="item.id" shadow="never" class="notify-card">
          <div class="notify-title">{{ item.title || item.content || '通知' }}</div>
          <div class="notify-time">{{ item.createdAt || item.time }}</div>
        </el-card>
      </div>
    </div>
  </el-dialog>
</template>
