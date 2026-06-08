<template>
  <div class="app-state" :class="`app-state--${type}`">
    <el-skeleton v-if="type === 'loading'" animated :rows="rows" />
    <el-empty v-else :description="description">
      <p class="app-state__description">{{ description }}</p>
      <el-button v-if="retryable" type="primary" @click="$emit('retry')">
        重试
      </el-button>
    </el-empty>
  </div>
</template>

<script setup>
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
</style>
