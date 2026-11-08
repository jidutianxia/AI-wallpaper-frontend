<script setup>
import { mediaPoster } from '@/utils/media'
import MediaSurface from '@/components/MediaSurface.vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ArrowLeft,
  ArrowRight,
  FullScreen,
  Monitor,
  Iphone,
  TopRight,
} from '@element-plus/icons-vue'
import { previewWallpapers } from '@/data/previewWallpapers'
import { getImageUrl } from '@/utils/imageHelper'
import { usePhotoViewer } from '@/composables/usePhotoViewer'

const props = defineProps({ wallpapers: { type: Array, default: () => [] } })
const stage = ref(null)
const rail = ref(null)
const active = ref(0)
const cycle = ref(0)
const mode = ref('original')
const paused = ref(false)
const hovered = ref(false)
const focused = ref(false)
const reduced = ref(false)
const visible = ref(true)
const pageVisible = ref(true)
const { open, opening, isOpen } = usePhotoViewer()
const scenes = computed(() => {
  const source = props.wallpapers.length
    ? props.wallpapers.slice(0, 5)
    : [
        previewWallpapers[0],
        previewWallpapers[1],
        previewWallpapers[3],
        previewWallpapers[2],
        previewWallpapers[6],
      ]
  return source.map((item) => ({
    ...item,
    url: getImageUrl(item.url || item.src || item.thumbUrl),
    sample: !props.wallpapers.length,
  }))
})
const scene = computed(() => scenes.value[active.value] || scenes.value[0])
const running = computed(
  () =>
    scenes.value.length > 1 &&
    !paused.value &&
    !hovered.value &&
    !focused.value &&
    !reduced.value &&
    !opening.value &&
    !isOpen.value &&
    visible.value &&
    pageVisible.value &&
    mode.value === 'original',
)
const interval = 7000
let timer,
  observer,
  media,
  started = 0,
  remaining = interval,
  touchStart,
  ignoreClickUntil = 0,
  frame = 0
function stopTimer() {
  if (timer) {
    clearTimeout(timer)
    timer = undefined
    remaining = Math.max(0, remaining - (performance.now() - started))
  }
}
function startTimer() {
  stopTimer()
  if (!running.value) return
  started = performance.now()
  timer = setTimeout(() => {
    timer = undefined
    select(active.value + 1)
  }, remaining)
}
function select(index) {
  stopTimer()
  active.value = (index + scenes.value.length) % scenes.value.length
  remaining = interval
  cycle.value++
  startTimer()
}
function toggleMode(next) {
  mode.value = mode.value === next ? 'original' : next
}
function preview(event) {
  if (event?.currentTarget?.classList.contains('cinema-picture') && performance.now() < ignoreClickUntil) return
  open(scenes.value, active.value)
}
function onKey(event) {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault()
    select(active.value + (event.key === 'ArrowRight' ? 1 : -1))
  }
}
function onPointerDown(event) {
  if (event.pointerType === 'touch')
    touchStart = { x: event.clientX, y: event.clientY }
}
function onPointerUp(event) {
  if (!touchStart) return
  const dx = event.clientX - touchStart.x,
    dy = event.clientY - touchStart.y
  touchStart = null
  // Touch browsers may suppress the synthetic click immediately after a swipe.
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && event.target.closest('[data-fullscreen]')) {
    preview()
    return
  }
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
    ignoreClickUntil = performance.now() + 400
    paused.value = true
    select(active.value + (dx < 0 ? 1 : -1))
  }
}
function onPointerMove(event) {
  if (
    event.pointerType !== 'mouse' ||
    reduced.value ||
    mode.value !== 'original'
  )
    return
  cancelAnimationFrame(frame)
  const x = event.clientX,
    y = event.clientY
  frame = requestAnimationFrame(() => {
    const box = stage.value?.getBoundingClientRect()
    if (!box) return
    stage.value.style.setProperty(
      '--look-x',
      `${((x - box.left) / box.width - 0.5) * 10}px`,
    )
    stage.value.style.setProperty(
      '--look-y',
      `${((y - box.top) / box.height - 0.5) * 8}px`,
    )
  })
}
function leave() {
  hovered.value = false
  cancelAnimationFrame(frame)
  stage.value?.style.setProperty('--look-x', '0px')
  stage.value?.style.setProperty('--look-y', '0px')
}
function focusOut(event) {
  if (!stage.value?.contains(event.relatedTarget)) focused.value = false
}
function syncMotion() {
  reduced.value = media.matches
}
function syncVisibility() {
  pageVisible.value = !document.hidden
}
watch(running, startTimer)
watch(
  () => scenes.value.map((item) => item.id).join(','),
  () => select(0),
)
watch(
  active,
  () => {
    const button = rail.value?.children[active.value]
    if (button)
      rail.value.scrollTo({
        left:
          button.offsetLeft - (rail.value.clientWidth - button.clientWidth) / 2,
        behavior: reduced.value ? 'auto' : 'smooth',
      })
  },
  { flush: 'post' },
)
onMounted(() => {
  media = window.matchMedia('(prefers-reduced-motion: reduce)')
  syncMotion()
  media.addEventListener('change', syncMotion)
  syncVisibility()
  document.addEventListener('visibilitychange', syncVisibility)
  observer = new IntersectionObserver(
    ([entry]) => {
      visible.value = entry.isIntersecting
    },
    { threshold: 0.2 },
  )
  observer.observe(stage.value)
  startTimer()
})
onBeforeUnmount(() => {
  stopTimer()
  cancelAnimationFrame(frame)
  observer?.disconnect()
  media?.removeEventListener('change', syncMotion)
  document.removeEventListener('visibilitychange', syncVisibility)
})
</script>

<template>
  <section
    ref="stage"
    class="immersive-carousel"
    :class="[{ 'is-running': running, 'is-reduced': reduced }, `view-${mode}`]"
    aria-label="精选壁纸"
    aria-roledescription="轮播图"
    tabindex="0"
    @keydown="onKey"
    @mouseenter="hovered = true"
    @mouseleave="leave"
    @focusin="focused = true"
    @focusout="focusOut"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointercancel="touchStart = null"
    @pointermove="onPointerMove"
  >
    <Transition name="ambient-fade"
      ><div
        :key="scene.id"
        class="cinema-aura"
        :style="{ backgroundImage: `url(${JSON.stringify(mediaPoster(scene))})` }"
        aria-hidden="true"
    /></Transition>
    <div class="cinema-screen">
      <div
        class="cinema-device-backdrop"
        :style="{ backgroundImage: `url(${JSON.stringify(mediaPoster(scene))})` }"
        aria-hidden="true"
      />
      <Transition name="scene-dissolve">
        <button
          :key="scene.id"
          class="cinema-picture"
          :aria-label="`全屏预览${scene.title}${scene.sample ? '（示例图片）' : ''}`"
          :disabled="opening"
          @click="preview"
        >
          <span class="cinema-frame"
            ><span class="cinema-parallax"
              ><MediaSurface class="cinema-image" :src="scene" :alt="scene.title" eager autoplay :paused="paused || isOpen || opening" /></span
            ><span
              v-if="mode === 'phone'"
              class="cinema-lock"
              aria-hidden="true"
              ><span>9:41</span></span
            ><span
              v-if="mode === 'desktop'"
              class="cinema-device-dock"
              aria-hidden="true"
              ><i /><i /><i /><i /><i /></span
          ></span>
        </button>
      </Transition>
      <div class="cinema-shade" aria-hidden="true" />
      <div class="cinema-heading" aria-live="off">
        <Transition name="name-rise" mode="out-in"
          ><h1 :key="scene.id">{{ scene.title }}</h1></Transition
        >
      </div>
      <button
        v-if="scenes.length > 1 && !reduced"
        class="cinema-icon cinema-play"
        :aria-label="paused ? '播放轮播' : '暂停轮播'"
        :title="paused ? '播放轮播' : '暂停轮播'"
        :aria-pressed="paused"
        @click="paused = !paused"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
          aria-hidden="true"
        >
          <path v-if="paused" d="M8 5.5v13l10-6.5z" />
          <path v-else d="M7 5h3v14H7zm7 0h3v14h-3z" />
        </svg>
      </button>
      <template v-if="scenes.length > 1"
        ><button
          class="cinema-icon cinema-arrow arrow-prev"
          aria-label="上一张精选"
          title="上一张"
          @click="select(active - 1)"
        >
          <el-icon><ArrowLeft /></el-icon></button
        ><button
          class="cinema-icon cinema-arrow arrow-next"
          aria-label="下一张精选"
          title="下一张"
          @click="select(active + 1)"
        >
          <el-icon><ArrowRight /></el-icon></button
      ></template>
      <div class="cinema-bottom-bar">
        <div
          v-if="scenes.length > 1"
          ref="rail"
          class="cinema-filmstrip"
          aria-label="选择壁纸"
        >
          <button
            v-for="(item, index) in scenes"
            :key="item.id"
            :aria-label="`切换至${item.title}`"
            :title="item.title"
            :aria-pressed="active === index"
            @click="select(index)"
          >
            <img :src="mediaPoster(item)" alt="" /><span
              v-if="active === index"
              :key="cycle"
              class="cinema-progress"
              aria-hidden="true"
            />
          </button>
        </div>
        <div class="cinema-tools">
          <button
            class="cinema-icon"
            aria-label="桌面预览"
            title="桌面预览"
            :aria-pressed="mode === 'desktop'"
            @click="toggleMode('desktop')"
          >
            <el-icon><Monitor /></el-icon>
          </button>
          <button
            class="cinema-icon"
            aria-label="锁屏预览"
            title="锁屏预览"
            :aria-pressed="mode === 'phone'"
            @click="toggleMode('phone')"
          >
            <el-icon><Iphone /></el-icon>
          </button>
          <span class="cinema-tool-divider" aria-hidden="true" />
          <button
            class="cinema-icon"
            data-fullscreen
            aria-label="全屏查看"
            title="全屏查看"
            :disabled="opening"
            @click="preview"
          >
            <el-icon><FullScreen /></el-icon>
          </button>
          <router-link
            v-if="!scene.sample"
            class="cinema-icon"
            :to="`/detail/${scene.id}`"
            aria-label="作品详情"
            title="作品详情"
            ><el-icon><TopRight /></el-icon
          ></router-link>
        </div>
      </div>
    </div>
  </section>
</template>
<style scoped src="@/styles/immersive-carousel.css"></style>
