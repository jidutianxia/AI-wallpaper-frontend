<template>
  <div
    class="item-card"
    role="link"
    tabindex="0"
    :aria-label="displayTitle"
    @keydown.enter.self="go"
    @click="go"
    @mouseenter="startSlideshow"
    @mouseleave="stopSlideshow"
  >
    <div class="image-wrapper">
      <MediaSurface :src="isVideo(cardData.url) ? cardData : currentImgSrc" :alt="displayTitle" />
      <!-- 多图标识 -->
      <div v-if="hasMultipleImages" class="multi-badge">
        <svg viewBox="0 0 24 24" class="icon">
          <path
            fill="currentColor"
            d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
          />
        </svg>
        <span>{{ imageCount }}</span>
      </div>
    </div>

    <button class="card-preview-action" :aria-label="`快速预览${displayTitle}`" :disabled="opening" @click.stop="open([{ ...cardData, url: cardData.url || displayCover, title: displayTitle }])" @keydown.enter.stop><el-icon><FullScreen /></el-icon></button>
    <div v-if="canReact" class="card-reactions">
      <ReactionButton :active="reactionState.liked" :pending-action="reactionState._interacting" :count="reactionState.likes" :label="`点赞${displayTitle}`" @click="react('like')" />
      <ReactionButton kind="favorite" :count="favoritesNum ?? undefined" :active="reactionState.favorited" :pending-action="reactionState._interacting" :label="`收藏${displayTitle}`" @click="react('favorite')" />
    </div>
    <div v-if="!canReact" class="badges">
      <span v-if="likesNum !== null" class="badge"
        ><svg viewBox="0 0 24 24" class="icon">
          <path
            d="M2 21h4a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H2v11zM22 9h-6.31l.95-4.57A2 2 0 0 0 14.69 2L9 8v11h9a2 2 0 0 0 2-2l1-7a2 2 0 0 0-2-2z"
            fill="currentColor"
          /></svg
        >{{ likesNum }}</span
      >
      <span v-if="favoritesNum !== null" class="badge"
        ><span class="star">★</span>{{ favoritesNum }}</span
      >
    </div>

    <div class="overlay">
      <div class="info">
        <h3>{{ displayTitle }}</h3>
        <p v-if="displaySubtitle">{{ displaySubtitle }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import MediaSurface from '@/components/MediaSurface.vue'
import { isVideo } from '@/utils/media'
import { computed, reactive, ref, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { FullScreen } from '@element-plus/icons-vue'
import ReactionButton from '@/components/ReactionButton.vue'
import { useInteraction } from '@/composables/useInteraction'
import { usePhotoViewer } from '@/composables/usePhotoViewer'
const { open, opening } = usePhotoViewer()

const props = defineProps({
  title: String,
  cover: String,
  subtitle: String,
  to: String,
  likes: [Number, String],
  favorites: [Number, String],
  noActions: Boolean,
  images: { type: Array, default: () => [] },
  imageCount: { type: Number, default: 0 },
  liked: Boolean,
  favorited: Boolean,
  data: Object,
})

const emit = defineEmits(['like', 'favorite'])
const reaction = reactive({ id: null, liked: false, favorited: false, likes: 0 })
watch(() => props.data, (data) => {
  if (!data || reaction._interacting) return
  Object.assign(reaction, { id: data.id, liked: Boolean(data.liked), favorited: Boolean(data.favorited), likes: Number(data.likes ?? props.likes ?? 0) })
}, { immediate: true })
const canReact = computed(() => !!props.data?.id && !props.noActions && !props.to && !props.data?.to)
const reactionState = computed(() => props.data?.target || reaction)
async function react(kind) {
  const { toggleInteraction } = useInteraction()
  const target = reactionState.value
  if (await toggleInteraction(target, kind, 'wallpaper')) {
    Object.assign(props.data, { liked: target.liked, favorited: target.favorited, likes: target.likes })
    emit(kind, target)
  }
}

const router = useRouter()
const placeholder =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmOGY5ZmEiLz48dGV4dCB4PSIxNTAiIHk9IjEwMCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzkxOTI5NyI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'

// Computed values to handle data prop override
const cardData = computed(() => props.data || {})
const displayTitle = computed(() => props.title || cardData.value.title)
const displaySubtitle = computed(
  () => props.subtitle || cardData.value.subtitle || cardData.value.author,
)
const displayCover = computed(
  () =>
    props.cover ||
    cardData.value.cover ||
    cardData.value.thumb ||
    cardData.value.url ||
    (props.images && props.images.length > 0 ? props.images[0] : placeholder),
)
const displayTo = computed(
  () =>
    props.to ||
    cardData.value.to ||
    (cardData.value.id ? `/detail/${cardData.value.id}` : ''),
)
const displayLikes = computed(() => props.likes ?? cardData.value.likes)
const displayFavorites = computed(
  () => props.favorites ?? cardData.value.favorites,
)
const isLiked = computed(() => props.liked || cardData.value.liked)
const isFavorited = computed(() => props.favorited || cardData.value.favorited)

const initialCover = computed(() => displayCover.value)
const currentImgSrc = ref(initialCover.value)
const isHovering = ref(false)
const slideIndex = ref(0)
let slideTimer = null

const hasMultipleImages = computed(
  () => (props.images && props.images.length > 1) || props.imageCount > 1,
)

const setCurrentImage = (src) => {
  const nextSrc = src || placeholder
  currentImgSrc.value = nextSrc
}

// Watch props change to update cover
watch(initialCover, (val) => {
  if (!isHovering.value) setCurrentImage(val)
})

const go = () => {
  const targetPath = displayTo.value

  if (
    targetPath &&
    typeof targetPath === 'string' &&
    !targetPath.includes('[object Object]')
  ) {
    router.push(targetPath)
  } else {
    console.error('无效的路由路径:', targetPath)
  }
}

const likesNum = computed(() =>
  typeof displayLikes.value === 'number' ||
  typeof displayLikes.value === 'string'
    ? Number(displayLikes.value)
    : null,
)
const favoritesNum = computed(() =>
  typeof displayFavorites.value === 'number' ||
  typeof displayFavorites.value === 'string'
    ? Number(displayFavorites.value)
    : null,
)

const startSlideshow = () => {
  isHovering.value = true
  // Only slideshow if we have valid images array
  if (
    props.images &&
    props.images.length > 1 &&
    !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    slideIndex.value = 0
    // Show up to first 3 images
    const maxSlides = Math.min(props.images.length, 3)

    // Clear existing timer if any
    if (slideTimer) clearInterval(slideTimer)

    slideTimer = setInterval(() => {
      slideIndex.value = (slideIndex.value + 1) % maxSlides
      setCurrentImage(props.images[slideIndex.value])
    }, 1200) // Switch every 1.2s
  }
}

const stopSlideshow = () => {
  isHovering.value = false
  if (slideTimer) {
    clearInterval(slideTimer)
    slideTimer = null
  }
  setCurrentImage(initialCover.value)
}

onBeforeUnmount(() => {
  if (slideTimer) clearInterval(slideTimer)
})
</script>

<style scoped>
.item-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 2px;
  transition: box-shadow 0.2s;
}
.item-card:hover {
  box-shadow: var(--app-shadow-hover);
}
.image-wrapper {
  aspect-ratio: 3/2;
  position: relative;
  overflow: hidden;
  background: var(--app-bg-hover);
}
.item-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}
.item-card img.zoomed {
  transform: scale(1.035);
}
.overlay {
  padding: 12px 0;
}
.info h3 {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 550;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.info p {
  margin: 0;
  font-size: 12px;
  color: var(--app-text-secondary);
}
.badges {
  position: absolute;
  right: 12px;
  top: 12px;
  display: flex;
  gap: 6px;
}
.badge,
.multi-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--app-bg-card);
  color: var(--app-text-main);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
}
.multi-badge {
  position: absolute;
  bottom: 12px;
  left: 12px;
}
.icon {
  width: 14px;
  height: 14px;
}
.image-retry {
  position: absolute;
  bottom: 16px;
  left: 16px;
}
</style>
