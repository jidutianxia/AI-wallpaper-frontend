<template>
  <div>
    <Waterfall :list="items" :gutter="gutter" :columnWidth="columnWidth">
      <template #default="{ item }">
        <slot :item="item"></slot>
      </template>
    </Waterfall>
    <div v-if="loading" class="text-center p-4">加载中...</div>
    <div ref="sentinel" class="h-1"></div>
  </div>
</template>

<script setup>
import { Waterfall } from 'vue-waterfall2'
import { defineProps, ref, onMounted, onBeforeUnmount, watch } from 'vue'
const props = defineProps({ items: Array, loading: Boolean, gutter: { type: Number, default: 12 }, columnWidth: { type: Number, default: 250 } })
const emit = defineEmits(['reachBottom'])
const sentinel = ref(null)
let io

onMounted(() => {
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) emit('reachBottom')
      })
    }, { rootMargin: '200px' })
    if (sentinel.value) io.observe(sentinel.value)
  }
})

onBeforeUnmount(() => { io && io.disconnect() })
</script>
