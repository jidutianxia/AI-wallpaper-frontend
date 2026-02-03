<template>
  <div 
    class="item-card" 
    @click="go"
    @mouseenter="startSlideshow"
    @mouseleave="stopSlideshow"
  >
    <div class="image-wrapper">
      <img :src="currentImgSrc" :alt="displayTitle" @error="onError" :class="{ 'zoomed': isHovering && !hasMultipleImages }" />
      <!-- 多图标识 -->
      <div v-if="hasMultipleImages" class="multi-badge">
        <svg viewBox="0 0 24 24" class="icon"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
        <span>{{ imageCount }}</span>
      </div>
      <!-- Like Action (Hover) -->
      <div class="like-overlay" @click.stop="toggleLike">
        <div class="like-btn" :class="{ active: isLiked }">
          <svg viewBox="0 0 24 24" class="heart-icon"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg>
        </div>
      </div>
    </div>
    
    <div class="badges">
      <span v-if="likesNum !== null" class="badge"><svg viewBox="0 0 24 24" class="icon"><path d="M2 21h4a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H2v11zM22 9h-6.31l.95-4.57A2 2 0 0 0 14.69 2L9 8v11h9a2 2 0 0 0 2-2l1-7a2 2 0 0 0-2-2z" fill="currentColor"/></svg>{{ likesNum }}</span>
      <span v-if="favoritesNum !== null" class="badge"><span class="star">★</span>{{ favoritesNum }}</span>
    </div>

    <div class="overlay">
      <div class="info">
        <h3>{{ displayTitle }}</h3>
        <p v-if="displaySubtitle">{{ displaySubtitle }}</p>
      </div>
      <div class="actions" @click.stop v-if="!noActions">
        <el-button size="small" @click="share"><svg viewBox="0 0 24 24" class="icon"><path d="M2 12l20-8-8 9 8 9-20-8 7-2 0 0z" fill="currentColor"/></svg>分享</el-button>
        <el-button size="small" @click="copyLink">复制链接</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

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
  data: Object
})

const emit = defineEmits(['like', 'favorite'])

const router = useRouter()
const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmOGY5ZmEiLz48dGV4dCB4PSIxNTAiIHk9IjEwMCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzkxOTI5NyI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'

// Computed values to handle data prop override
const cardData = computed(() => props.data || {})
const displayTitle = computed(() => props.title || cardData.value.title)
const displaySubtitle = computed(() => props.subtitle || cardData.value.subtitle || cardData.value.author)
const displayCover = computed(() => props.cover || cardData.value.cover || cardData.value.thumb || cardData.value.url || (props.images && props.images.length > 0 ? props.images[0] : placeholder))
const displayTo = computed(() => props.to || cardData.value.to || (cardData.value.id ? `/detail/${cardData.value.id}` : ''))
const displayLikes = computed(() => props.likes ?? cardData.value.likes)
const displayFavorites = computed(() => props.favorites ?? cardData.value.favorites)
const isLiked = computed(() => props.liked || cardData.value.liked)
const isFavorited = computed(() => props.favorited || cardData.value.favorited)

const initialCover = computed(() => displayCover.value)
const currentImgSrc = ref(initialCover.value)
const isHovering = ref(false)
const slideIndex = ref(0)
let slideTimer = null

const hasMultipleImages = computed(() => (props.images && props.images.length > 1) || props.imageCount > 1)

// Watch props change to update cover
watch(initialCover, (val) => {
  if (!isHovering.value) currentImgSrc.value = val
})

const onError = (e) => { e.target.src = placeholder }
const go = () => {
  const targetPath = displayTo.value;
  
  if (targetPath && typeof targetPath === 'string' && !targetPath.includes('[object Object]')) {
    router.push(targetPath);
  } else {
    console.error("无效的路由路径:", targetPath);
  }
  if (displayTo.value) router.push(displayTo.value) 
}

const likesNum = computed(() => typeof props.likes === 'number' || typeof props.likes === 'string' ? Number(props.likes) : null)
const favoritesNum = computed(() => typeof props.favorites === 'number' || typeof props.favorites === 'string' ? Number(props.favorites) : null)

const startSlideshow = () => {
  isHovering.value = true
  // Only slideshow if we have valid images array
  if (props.images && props.images.length > 1) {
    slideIndex.value = 0
    // Show up to first 3 images
    const maxSlides = Math.min(props.images.length, 3)
    
    // Clear existing timer if any
    if (slideTimer) clearInterval(slideTimer)
    
    slideTimer = setInterval(() => {
      slideIndex.value = (slideIndex.value + 1) % maxSlides
      currentImgSrc.value = props.images[slideIndex.value]
    }, 1200) // Switch every 1.2s
  }
}

const stopSlideshow = () => {
  isHovering.value = false
  if (slideTimer) {
    clearInterval(slideTimer)
    slideTimer = null
  }
  currentImgSrc.value = initialCover.value
}

const share = async () => {
  const path = displayTo.value;
  // 如果 path 是对象，转换会失败，这里做一层过滤
  const validPath = (typeof path === 'string' && !path.includes('[object Object]')) ? path : '/';
  const url = new URL(validPath, location.origin).toString();
  // const url = props.to ? new URL(props.to, location.origin).toString() : location.href
  try {
    if (navigator.share) { await navigator.share({ title: props.title, url }) }
    else if (navigator.clipboard) { await navigator.clipboard.writeText(url) }
    else { const inp = document.createElement('input'); inp.value = url; document.body.appendChild(inp); inp.select(); document.execCommand('copy'); document.body.removeChild(inp) }
  } catch {}
}
const copyLink = async () => {
  const url = props.to ? new URL(props.to, location.origin).toString() : location.href
  try { await navigator.clipboard.writeText(url) } catch {}
}
</script>

<style scoped>
.item-card { 
  position: relative; 
  border-radius: 12px; 
  overflow: hidden; 
  background: var(--app-bg-card); 
  cursor: pointer; 
  transition: all .3s ease;
  /* Dark mode specific override for better visual as requested */
  border: 1px solid var(--app-border);
}

/* Specific styling for dark mode card background and border */
:root.dark .item-card {
  background: #18181C;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.item-card:hover { 
  transform: translateY(-5px); 
  /* Brand color tinted shadow */
  box-shadow: 0 10px 25px -5px rgba(100, 108, 255, 0.25);
}

:root.dark .item-card:hover {
  box-shadow: 0 10px 25px -5px rgba(114, 46, 209, 0.3); /* Purple tint in dark mode */
}

.image-wrapper {
  width: 100%;
  height: 200px;
  overflow: hidden;
  position: relative;
}

.item-card img { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
  transition: transform 0.5s ease, filter 0.3s ease;
}

/* Zoom effect on hover if single image */
.item-card img.zoomed {
  transform: scale(1.1);
  filter: saturate(0.9);
}

.multi-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  color: white;
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 2;
}

.multi-badge .icon {
  width: 14px;
  height: 14px;
}

.badges { position: absolute; right: 8px; bottom: 8px; display: flex; gap: 6px; z-index: 2; }
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 999px; background: rgba(255,255,255,0.9); color: #333; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); backdrop-filter: blur(4px); }
/* Dark mode badge adaptation */
:root.dark .badge { background: rgba(0,0,0,0.6); color: #eee; border: 1px solid rgba(255,255,255,0.1); }

.badge .icon { width: 14px; height: 14px; }
.badge .star { font-size: 12px; }
.overlay { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 16px; background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,.8) 100%); opacity: 0; transition: opacity .3s ease; }
.item-card:hover .overlay { opacity: 1; }
.info { color: #fff; margin-bottom: 8px; }
.info h3 { margin: 0 0 4px; font-size: 16px; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
.info p { margin: 0; font-size: 12px; opacity: .9; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
.actions { display: flex; gap: 8px; }

/* Like Overlay Button */
.like-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s;
}
.item-card:hover .like-overlay { opacity: 1; }
.like-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: all 0.2s;
}
.like-btn:hover { transform: scale(1.1); }
.like-btn.active { background: #fff; }
.like-btn .heart-icon { width: 20px; height: 20px; color: #ccc; transition: color 0.2s; }
.like-btn.active .heart-icon { color: #f56c6c; }
:root.dark .like-btn { background: rgba(30, 30, 35, 0.8); }
:root.dark .like-btn.active { background: rgba(30, 30, 35, 1); }
</style>
