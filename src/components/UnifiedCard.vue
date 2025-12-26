<template>
  <div class="item-card" @click="go">
    <img :src="imgSrc" :alt="title" @error="onError" />
    <div class="badges">
      <span v-if="likesNum !== null" class="badge"><svg viewBox="0 0 24 24" class="icon"><path d="M2 21h4a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H2v11zM22 9h-6.31l.95-4.57A2 2 0 0 0 14.69 2L9 8v11h9a2 2 0 0 0 2-2l1-7a2 2 0 0 0-2-2z" fill="currentColor"/></svg>{{ likesNum }}</span>
      <span v-if="favoritesNum !== null" class="badge"><span class="star">★</span>{{ favoritesNum }}</span>
    </div>
    <div class="overlay">
      <div class="info">
        <h3>{{ title }}</h3>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <div class="actions" @click.stop>
        <el-button size="small" @click="share"><svg viewBox="0 0 24 24" class="icon"><path d="M2 12l20-8-8 9 8 9-20-8 7-2 0 0z" fill="currentColor"/></svg>分享</el-button>
        <el-button size="small" @click="copyLink">复制链接</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({ title: String, cover: String, subtitle: String, to: String, likes: [Number, String], favorites: [Number, String] })
const router = useRouter()
const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmOGY5ZmEiLz48dGV4dCB4PSIxNTAiIHk9IjEwMCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzkxOTI5NyI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'
const imgSrc = computed(() => props.cover || placeholder)
const onError = (e) => { e.target.src = placeholder }
const go = () => { if (props.to) router.push(props.to) }
const likesNum = computed(() => typeof props.likes === 'number' || typeof props.likes === 'string' ? Number(props.likes) : null)
const favoritesNum = computed(() => typeof props.favorites === 'number' || typeof props.favorites === 'string' ? Number(props.favorites) : null)
const share = async () => {
  const url = props.to ? new URL(props.to, location.origin).toString() : location.href
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
.item-card { position: relative; border-radius: 12px; overflow: hidden; background: #f8f9fa; cursor: pointer; transition: all .3s ease; }
.item-card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,.15); }
.item-card img { width: 100%; height: 200px; object-fit: cover; }
.badges { position: absolute; right: 8px; bottom: 8px; display: flex; gap: 6px; z-index: 2; }
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 999px; background: rgba(255,255,255,.85); color: #374151; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.badge .icon { width: 14px; height: 14px; }
.badge .star { font-size: 12px; }
.overlay { position: absolute; inset: 0; display: flex; align-items: flex-end; padding: 16px; background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,.7) 100%); opacity: 0; transition: opacity .3s ease; }
.item-card:hover .overlay { opacity: 1; }
.info { color: #fff; }
.info h3 { margin: 0 0 6px; font-size: 16px; font-weight: 600; }
.info p { margin: 0; font-size: 13px; opacity: .9; }
.actions { display: flex; gap: 8px; }
</style>
