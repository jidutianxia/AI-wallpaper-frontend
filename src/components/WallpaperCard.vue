<template>
  <div class="group relative rounded overflow-hidden shadow hover:shadow-2xl transition" @mouseenter="hovering=true" @mouseleave="hovering=false">
    <div class="relative">
      <div class="media-box">
      <template v-if="showVideo">
        <video :src="data.previewVideoUrl" class="media" muted loop playsinline :autoplay="true"></video>
      </template>
      <template v-else>
        <img v-lazy="data.thumb" loading="lazy" @click="onPreview" class="media cursor-pointer" />
      </template>
      </div>
      <div class="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-black/50 text-white backdrop-blur">
        {{ resolutionLabel }}
      </div>
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 to-black/60 opacity-0 group-hover:opacity-100 transition"></div>
      <div class="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
        <el-button size="small" @click.stop="toggleLike" class="!pointer-events-auto">{{ liked ? '♥' : '♡' }}</el-button>
        <el-button size="small" @click.stop="download" class="!pointer-events-auto">下载</el-button>
      </div>
    </div>
    <div class="p-2 flex justify-between items-center bg-white dark:bg-surface">
      <div class="text-sm text-gray-700 dark:text-gray-200 truncate">{{ data.title }}</div>
      <div class="flex gap-2"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
const props = defineProps({ data: Object })
const emit = defineEmits(['preview', 'like'])
const liked = ref(false)
const hovering = ref(false)
function onPreview(){ emit('preview', props.data) }
function toggleLike(){ liked.value = !liked.value; emit('like', props.data) }
function download(){ window.open(props.data.url, '_blank') }

const resolutionLabel = computed(() => {
  if (props.data?.resolution) return props.data.resolution
  if (props.data?.width && props.data?.height) return `${props.data.width}x${props.data.height}`
  return 'HD'
})

const showVideo = computed(() => Boolean(hovering.value && props.data?.previewVideoUrl))
</script>

<style scoped>
.media-box { width: 100%; aspect-ratio: 16 / 10; background: #0b0f17; }
.media { width: 100%; height: 100%; display: block; object-fit: cover; }
.media { width: 100%; height: auto; display: block; }
.group { transition: box-shadow .25s ease, transform .2s ease; }
@media (max-width: 48em) {
  .group { border-radius: 0.75rem; }
  .media-box { aspect-ratio: 4 / 3; }
}
</style>
