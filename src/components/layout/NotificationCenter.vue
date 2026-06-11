<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getNotifications, getUserReceivedComments, getUserReceivedLikes } from '@/api'
import AppState from '@/components/AppState.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { normalizePagedResult } from '@/utils'

const visible = defineModel({ type: Boolean, default: false })
const router = useRouter()

const activeNotify = ref('comments')
const notifyGroups = [
  { key: 'comments', label: '评论/回复' },
  { key: 'likes', label: '点赞/收藏' },
  { key: 'followers', label: '新增粉丝' },
  { key: 'help', label: '收到帮助' },
  { key: 'system', label: '系统通知' }
]
const emptyNotifyData = { comments: [], likes: [], followers: [], help: [], system: [] }

const notificationsState = useAsyncState(async () => {
  const [comments, likes, followers] = await Promise.all([
    getUserReceivedComments({ page: 1, size: 10 }),
    getUserReceivedLikes({ page: 1, size: 10 }),
    getNotifications({ type: 'followers', page: 1, size: 10 })
  ])

  return {
    ...emptyNotifyData,
    comments: normalizePagedResult(comments).items,
    likes: normalizePagedResult(likes).items,
    followers: normalizePagedResult(followers).items
  }
}, { initialData: emptyNotifyData })

const notifyData = notificationsState.data
const loading = notificationsState.loading
const failed = computed(() => Boolean(notificationsState.error.value))

const loadNotifications = async () => {
  try {
    await notificationsState.run()
  } catch {}
}

watch(visible, (open) => {
  if (open) loadNotifications()
})

const notificationTitle = (item) => {
  if (item.title) return item.title
  if (item.type === 'FOLLOW' && item.actor?.username) return `${item.actor.username} 关注了你`
  return item.content || '通知'
}

const openNotification = (item) => {
  if (item.type === 'FOLLOW' && item.actor?.id) {
    visible.value = false
    router.push(`/profile/${item.actor.id}`)
  }
}
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
          <el-card v-for="item in notifyData[activeNotify]" :key="item.id" shadow="never" class="notify-card" @click="openNotification(item)">
            <div class="notify-title">{{ notificationTitle(item) }}</div>
            <div class="notify-time">{{ item.createdAt || item.time }}</div>
          </el-card>
        </template>
        <AppState v-else description="暂无通知" />
      </div>
    </div>
  </el-dialog>
</template>
