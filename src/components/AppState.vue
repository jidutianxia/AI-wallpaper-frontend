<template>
  <div role="status" class="app-state" :class="`app-state--${type}`">
    <el-skeleton v-if="type === 'loading'" animated :rows="rows" />
    <div v-else class="state-content">
      <svg viewBox="0 0 64 56" class="state-icon" aria-hidden="true"><rect x="6" y="6" width="52" height="40" rx="4" /><circle cx="43" cy="19" r="4" /><path d="m7 36 15-16 15 18 9-9 11 12" /></svg>
      <p class="app-state__description">{{ description }}</p>
      <el-button v-if="retryable" type="primary" @click="$emit('retry')">
        重试
      </el-button>
    </div>
  </div>
</template>

<script setup>
// retryable=true 时父组件必须监听 retry，用于错误态重新拉取数据。
defineEmits(['retry'])

defineProps({
  type: {
    type: String,
    default: 'empty',
    validator: (value) => ['empty', 'error', 'loading'].includes(value)
  },
  description: {
    type: String,
    default: '暂无数据'
  },
  retryable: {
    type: Boolean,
    default: false
  },
  rows: {
    type: Number,
    default: 4
  }
})
</script>

<style scoped>
.app-state {
  width: 100%;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: var(--app-text-secondary);
}

.app-state--loading {
  display: block;
}

.app-state__description {
  margin: 0 0 12px;
  color: var(--app-text-secondary);
  font-size: 14px;
}
.state-content { display:flex;flex-direction:column;align-items:center;gap:18px;text-align:center; }
.state-icon { width:64px;height:56px;fill:none;stroke:var(--app-text-secondary);stroke-width:1; }
</style>
