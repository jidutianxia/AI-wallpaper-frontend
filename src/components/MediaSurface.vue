<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { VideoPlay, RefreshRight } from '@element-plus/icons-vue'
import { isVideo, mediaPoster } from '@/utils/media'
import { getImageUrl } from '@/utils/imageHelper'
const props = defineProps({ src: [String, Object], alt: String, eager: Boolean, autoplay: Boolean, paused: Boolean, play: Boolean, fit: { type: String, default: 'cover' }, video: Boolean, poster: String })
const emit = defineEmits(['load', 'error'])
const root = ref(null), player = ref(null), entered = ref(props.eager), visible = ref(false), loaded = ref(false), failed = ref(false), hovered = ref(false), revision = ref(0), wantsPlay = ref(false)
const requested = ref(false)
const reduced = ref(false), pageVisible = ref(!document.hidden)
const source = computed(() => getImageUrl(props.src))
const motion = computed(() => props.video || isVideo(source.value))
const poster = computed(() => props.poster || mediaPoster(props.src))
const localVideo = computed(() => motion.value && source.value.startsWith('blob:'))
const playing = computed(() => visible.value && pageVisible.value && !props.paused && (props.play || wantsPlay.value || (!reduced.value && (props.autoplay || hovered.value))))
let observer, preference
function syncVisibility() { pageVisible.value = !document.hidden }
function syncPreference() { reduced.value = preference.matches }
function ready(event) { loaded.value = true; failed.value = false; emit('load', event) }
function error() { failed.value = true; emit('error') }
function retry() { failed.value = false; loaded.value = false; revision.value++ }
watch(source, () => { loaded.value = false; failed.value = false; wantsPlay.value = false; requested.value = false })
watch(playing, value => { if (value) requested.value = true }, { immediate: true })
watch([playing, player], async () => {
  await nextTick()
  if (!player.value) return
  if (playing.value) { try { await player.value.play() } catch { /* Keep the poster and explicit play control. */ } }
  else player.value.pause()
})
onMounted(() => {
  preference = window.matchMedia('(prefers-reduced-motion: reduce)'); syncPreference()
  preference.addEventListener?.('change', syncPreference)
  document.addEventListener('visibilitychange', syncVisibility)
  if (!window.IntersectionObserver) { entered.value = true; visible.value = true; return }
  observer = new IntersectionObserver(entries => {
    visible.value = entries[0].isIntersecting
    if (visible.value) entered.value = true
  }, { rootMargin: '80px' })
  observer.observe(root.value)
})
onBeforeUnmount(() => { observer?.disconnect(); player.value?.pause(); preference?.removeEventListener?.('change', syncPreference); document.removeEventListener('visibilitychange', syncVisibility) })
defineExpose({ retry, loaded, entered })
</script>
<template>
  <span ref="root" class="media-surface" :class="{ 'is-ready': loaded, 'is-failed': failed, 'is-video': motion }" :aria-busy="!loaded && !failed" :style="{ '--media-fit': fit }" @mouseenter="hovered = true" @mouseleave="hovered = false">
    <span v-if="!loaded && !failed" class="media-frost" aria-hidden="true"><i /></span>
    <img v-if="entered && !localVideo" :key="`${source}-${revision}`" :src="poster" :alt="alt || ''" decoding="async" :fetchpriority="eager ? 'high' : 'auto'" @load="ready" @error="error" />
    <video v-if="motion && entered && (requested || localVideo)" :key="`${source}-video-${revision}`" ref="player" :src="source" :poster="localVideo ? undefined : poster" muted loop playsinline :preload="localVideo ? 'metadata' : 'none'" :aria-label="alt" @loadeddata="ready" @error="error" />
    <span v-if="motion && !failed" class="media-motion-mark" aria-label="动态壁纸"><el-icon><VideoPlay /></el-icon></span>
    <button v-if="failed" class="media-retry" type="button" aria-label="重新加载媒体" title="重新加载" @click.stop="retry" @keydown.enter.stop><el-icon><RefreshRight /></el-icon></button>
  </span>
</template>
<style>
.media-surface { position: relative; display: block; width: 100%; height: 100%; overflow: hidden; isolation: isolate; background: var(--app-bg-hover); }
.media-surface > img, .media-surface > video { display: block; width: 100%; height: 100%; object-fit: var(--media-fit,cover); opacity: 0; filter: blur(12px); transform: scale(1.035); transition: opacity .55s, filter .7s, transform .8s cubic-bezier(.2,.7,.2,1); }
.media-surface.is-ready > img, .media-surface.is-ready > video { opacity: 1; filter: blur(0); transform: scale(1); }
.media-surface > video { position: absolute; inset: 0; }
.media-frost { position: absolute; inset: 0; background: linear-gradient(135deg, var(--app-bg-hover), var(--app-bg-card)); box-shadow: inset 0 1px 0 var(--app-border); overflow: hidden; }
.media-frost::after { content: ''; position: absolute; inset: -30%; background: linear-gradient(110deg,transparent 30%,color-mix(in srgb,var(--app-text-main) 8%,transparent) 50%,transparent 70%); animation: media-shimmer 1.7s ease-in-out infinite; }
.media-frost i { position: absolute; inset: 38%; border-radius: 50%; background: var(--app-accent-bg-soft); filter: blur(30px); }
.media-motion-mark { position: absolute; left: 12px; top: 12px; width: 30px; height: 30px; display: grid; place-items: center; background: var(--app-glass); backdrop-filter: blur(16px); color: var(--app-text-main); border: 1px solid var(--app-border); border-radius: 50%; pointer-events: none; }
.media-retry { position: absolute; inset: 0; margin: auto; width: 44px; height: 44px; display: grid; place-items: center; color: var(--app-text-main); border: 1px solid var(--app-border); border-radius: 50%; background: var(--app-glass); cursor: pointer; }
@keyframes media-shimmer { from { transform: translateX(-60%); } to { transform: translateX(60%); } }
@media(prefers-reduced-motion:reduce) { .media-surface > img,.media-surface > video { transition: none; transform: none; filter: none; } .media-frost::after { animation: none; } }
</style>
