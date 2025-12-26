<template>
  <div class="group card-wrap" @mouseenter="hovering=true" @mouseleave="hovering=false">
    <div class="relative">
      <div class="media-box">
      <template v-if="showVideo">
        <video :src="data.previewVideoUrl" class="media" muted loop playsinline :autoplay="true"></video>
      </template>
      <template v-else>
        <img v-lazy="data.thumb" loading="lazy" @click="onPreview" class="media cursor-pointer" />
      </template>
      </div>
      <div class="absolute bottom-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
        <span class="badge">👍 {{ props.data?.likes ?? 0 }}</span>
        <span class="badge">★ {{ props.data?.favorites ?? 0 }}</span>
      </div>
      <div class="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-black/50 text-white backdrop-blur">
        {{ resolutionLabel }}
      </div>
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 to-black/60 opacity-0 group-hover:opacity-100 transition"></div>
      <div class="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
        <el-button aria-label="收藏" size="small" class="pill-btn !pointer-events-auto" @click.stop="toggleLike">{{ liked ? '★' : '☆' }}</el-button>
        <el-button aria-label="分享" size="small" class="pill-btn !pointer-events-auto" @click.stop="share"><svg viewBox="0 0 24 24" class="btn-icon" aria-hidden="true"><path d="M2 12l20-8-8 9 8 9-20-8 7-2 0 0z" fill="currentColor"/></svg></el-button>
        <el-button aria-label="下载" size="small" class="pill-btn !pointer-events-auto" @click.stop="download">下载</el-button>
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
function share(){ const url = props.data?.url || props.data?.thumb; if (!url) return; if (navigator.share) navigator.share({ title: props.data?.title, url }); else if (navigator.clipboard) { navigator.clipboard.writeText(url) } }

const resolutionLabel = computed(() => {
  if (props.data?.resolution) return props.data.resolution
  if (props.data?.width && props.data?.height) return `${props.data.width}x${props.data.height}`
  return 'HD'
})

const showVideo = computed(() => Boolean(hovering.value && props.data?.previewVideoUrl))
</script>

<style scoped>
.card-wrap { border: 1px solid transparent; border-radius: var(--radius-md); background: linear-gradient(var(--card-bg), var(--card-bg)) padding-box, linear-gradient(135deg, var(--brand-gradient-start), var(--brand-gradient-end)) border-box; box-shadow: var(--shadow-1); overflow: hidden; transition: transform .2s ease, box-shadow .2s ease; }
.card-wrap:hover { transform: translateY(-2px); box-shadow: var(--shadow-2); }
.media-box { width: 100%; aspect-ratio: 16 / 10; background: #0b0f17; }
.media { width: 100%; height: 100%; display: block; object-fit: cover; }
.media { width: 100%; height: auto; display: block; }
.group { transition: box-shadow .25s ease, transform .2s ease; }
.badge { font-size: 12px; padding: 2px 8px; border-radius: 999px; background: rgba(147,197,253,.18); border: 1px solid rgba(147,197,253,.35); color:#1f2937; }
.dark .badge { background: rgba(30,64,175,.28); border-color: rgba(59,130,246,.4); color:#e5e7eb; }
@media (max-width: 48em) {
  .group { border-radius: 0.75rem; }
  .media-box { aspect-ratio: 4 / 3; }
}
</style>
