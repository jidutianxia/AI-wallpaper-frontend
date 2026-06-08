<script setup>
import { ref, watch } from 'vue'
import { getUserReceivedComments, getUserReceivedLikes } from '@/api'
import AppState from '@/components/AppState.vue'

const visible = defineModel({ type: Boolean, default: false })

const activeNotify = ref('comments')
const loading = ref(false)
const failed = ref(false)
const notifyGroups = [
  { key: 'comments', label: '评论/回复' },
  { key: 'likes', label: '点赞/收藏' },
  { key: 'followers', label: '新增粉丝' },
  { key: 'help', label: '收到帮助' },
  { key: 'system', label: '系统通知' }
]
const notifyData = ref({ comments: [], likes: [], followers: [], help: [], system: [] })

const loadNotifications = async () => {
  loading.value = true
  failed.value = false
  try {
    const [comments, likes] = await Promise.all([
      getUserReceivedComments({ page: 1, size: 10 }),
      getUserReceivedLikes({ page: 1, size: 10 })
    ])
    notifyData.value.comments = comments.items || []
    notifyData.value.likes = likes.items || []
  } catch (error) {
    failed.value = true
    console.error('Failed to load notifications:', error)
  } finally {
    loading.value = false
  }
}

watch(visible, (open) => {
  if (open) loadNotifications()
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
        <AppState v-if="loading" type="loading" :rows="3" />
        <AppState v-else-if="failed" type="error" description="通知加载失败" retryable @retry="loadNotifications" />
        <template v-else-if="notifyData[activeNotify].length">
          <el-card v-for="item in notifyData[activeNotify]" :key="item.id" shadow="never" class="notify-card">
            <div class="notify-title">{{ item.title || item.content || '通知' }}</div>
            <div class="notify-time">{{ item.createdAt || item.time }}</div>
          </el-card>
        </template>
        <AppState v-else description="暂无通知" />
      </div>
    </div>
  </el-dialog>
</template>
