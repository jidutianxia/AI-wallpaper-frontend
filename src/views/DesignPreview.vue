<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '@/components/PreviewIcon.vue'
import { previewWallpapers as wallpapers } from '@/data/previewWallpapers'

const route = useRoute()
const router = useRouter()
const concepts = [
  { id: 'violet', name: '紫曜', detail: '沉浸画廊', accent: '#b8a0ff' },
  { id: 'glacier', name: '冰川', detail: '流光玻璃', accent: '#71d8df' },
  { id: 'cinema', name: '琥珀', detail: '全屏影院', accent: '#e5b67c' },
]
const concept = computed(() =>
  concepts.some((c) => c.id === route.query.concept)
    ? route.query.concept
    : 'violet',
)
const currentConcept = computed(() =>
  concepts.find((c) => c.id === concept.value),
)
const active = ref(0)
const featured = computed(() => wallpapers[active.value])
const query = ref('')
const category = ref('全部')
const savedOnly = ref(false)
const saved = ref([])
try {
  const ids = JSON.parse(
    localStorage.getItem('wallpaper-preview-favorites') || '[]',
  )
  if (Array.isArray(ids))
    saved.value = ids.filter((id) => wallpapers.some((w) => w.id === id))
} catch {}
const filtered = computed(() =>
  wallpapers.filter(
    (w) =>
      (category.value === '全部' || category.value === w.tag) &&
      (!savedOnly.value || saved.value.includes(w.id)) &&
      `${w.title}${w.tag}`.includes(query.value.trim()),
  ),
)
const preview = ref(null)
const device = ref('desktop')
const dialog = ref(null)
const filmstrip = ref(null)
async function centerScene() {
  await nextTick()
  const strip = filmstrip.value
  const selected = strip?.querySelector('[aria-pressed="true"]')
  if (selected) strip.scrollTo({ left: selected.offsetLeft - (strip.clientWidth - selected.clientWidth) / 2, behavior: 'instant' })
}
watch(active, centerScene)
watch(concept, centerScene)
onMounted(centerScene)
const notes = ref(false)
const still = ref(false)
const toast = ref('')
let toastTimer
let returnFocus
const originalOverflow = document.body.style.overflow
async function showCollection(onlySaved) {
  savedOnly.value = onlySaved
  if (!onlySaved) category.value = '全部'
  await nextTick()
  document
    .querySelector('.collection')
    ?.scrollIntoView({
      behavior:
        still.value ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      block: 'start',
    })
}
function favorite(w) {
  saved.value = saved.value.includes(w.id)
    ? saved.value.filter((id) => id !== w.id)
    : [...saved.value, w.id]
  try {
    localStorage.setItem(
      'wallpaper-preview-favorites',
      JSON.stringify(saved.value),
    )
  } catch {}
  toast.value = saved.value.includes(w.id) ? '已收藏' : '已取消收藏'
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 1700)
}
function changeConcept(id) {
  router.replace({ query: { concept: id } })
  active.value = id === 'glacier' ? 1 : id === 'cinema' ? 3 : 0
}
function move(step) {
  active.value = (active.value + step + wallpapers.length) % wallpapers.length
}
function randomPreview() {
  active.value = (active.value + 1 + Math.floor(Math.random() * (wallpapers.length - 1))) % wallpapers.length
  openPreview(featured.value)
}
function resetFilters() {
  query.value = ''
  category.value = '全部'
  savedOnly.value = false
}
async function openPreview(w) {
  returnFocus = document.activeElement
  preview.value = w
  device.value = 'desktop'
  await nextTick()
  dialog.value.showModal()
  document.body.style.overflow = 'hidden'
}
function closePreview() {
  dialog.value.close()
  preview.value = null
  document.body.style.overflow = originalOverflow
  returnFocus?.focus()
}
function previewStep(step) {
  const index = wallpapers.findIndex((w) => w.id === preview.value.id)
  preview.value =
    wallpapers[(index + step + wallpapers.length) % wallpapers.length]
}
function spotlight(event) {
  if (
    still.value ||
    event.pointerType === 'touch' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return
  const box = event.currentTarget.getBoundingClientRect()
  event.currentTarget.style.setProperty(
    '--mouse-x',
    `${event.clientX - box.left}px`,
  )
  event.currentTarget.style.setProperty(
    '--mouse-y',
    `${event.clientY - box.top}px`,
  )
}
watch(concept, () => {
  query.value = ''
  category.value = '全部'
  savedOnly.value = false
})
active.value =
  concept.value === 'glacier' ? 1 : concept.value === 'cinema' ? 3 : 0
onBeforeUnmount(() => {
  clearTimeout(toastTimer)
  document.body.style.overflow = originalOverflow
})
</script>

<template>
  <div class="design-lab" :class="[`theme-${concept}`, { 'is-still': still }]">
    <div class="concept-bar">
      <span class="lab-label"><span class="status-dot" />方案预览</span>
      <div class="concept-options" aria-label="设计方案">
        <button
          v-for="(c, i) in concepts"
          :key="c.id"
          :aria-pressed="concept === c.id"
          :style="{ '--swatch': c.accent }"
          @click="changeConcept(c.id)"
        >
          <i /> <span>{{ String.fromCharCode(65 + i) }} · {{ c.name }}</span>
        </button>
      </div>
      <button
        class="notes-toggle"
        aria-label="设计对照"
        :aria-expanded="notes"
        @click="notes = !notes"
      >
        <Icon name="info" /><span>设计对照</span>
      </button>
    </div>

    <section v-if="notes" class="design-notes">
      <div>
        <strong>A · 紫曜</strong>
        <p>大图拼接、紫色边缘光、悬浮筛选。适合高频浏览与连续收藏。</p>
      </div>
      <div>
        <strong>B · 冰川</strong>
        <p>浅色磨砂、错层画框、青色折射。适合精选内容与品牌展示。</p>
      </div>
      <div>
        <strong>C · 琥珀</strong>
        <p>全屏场景、胶片选片、渐隐切换。适合首访体验与单张作品展示。</p>
      </div>
      <p class="reference-note">
        参考：<a
          href="https://haowallpaper.com/"
          target="_blank"
          rel="noreferrer"
          >哲风壁纸</a
        >
        ·
        <a href="https://wallhaven.cc/" target="_blank" rel="noreferrer"
          >Wallhaven</a
        >
        ·
        <a href="https://wall.alphacoders.com/" target="_blank" rel="noreferrer"
          >Wallpaper Abyss</a
        >。当前为交互样片；图片来自
        Unsplash，仅用于方案比较。收藏保存在本机，未写入正式图库。
      </p>
    </section>

    <div class="preview-site">
      <div
        class="ambient"
        aria-hidden="true"
        :style="{ backgroundImage: `url(${featured.src})` }"
      />
      <header class="preview-header">
        <router-link class="preview-brand" to="/"
          ><span class="brand-orbit"><i /><i /><i /></span
          ><span
            >AI 壁纸<span class="brand-caption">视觉，无界。</span></span
          ></router-link
        >
        <nav class="preview-nav" aria-label="预览导航">
          <button
            :class="{ selected: !savedOnly }"
            @click="showCollection(false)"
          >
            发现
          </button>
          <button
            :class="{ selected: savedOnly }"
            @click="showCollection(true)"
          >
            收藏<span v-if="saved.length" class="saved-count">{{
              saved.length
            }}</span>
          </button>
          <router-link to="/community">社区<Icon name="arrow" /></router-link>
        </nav>
        <div class="header-actions">
          <button
            class="motion-button icon-button"
            :aria-pressed="still"
            :aria-label="still ? '开启动效' : '暂停动效'"
            @click="still = !still"
          >
            <Icon :name="still ? 'play' : 'spark'" /></button
          ><router-link class="entry-button" to="/user"
            >我的空间 <Icon name="arrow"
          /></router-link>
        </div>
      </header>

      <template v-if="concept !== 'cinema'">
        <section class="feature-stage" aria-label="精选壁纸">
          <div v-if="concept === 'glacier'" class="glacier-heading">
            <span class="micro-label"
              >精选 / {{ String(active + 1).padStart(2, '0') }}</span
            >
            <h1>{{ featured.title }}</h1>
            <button class="text-action" @click="openPreview(featured)">
              在我的屏幕上 <Icon name="arrow" />
            </button>
            <div class="glacier-colors">
              <i
                v-for="c in ['#b8cfdd', '#75b6c0', '#d3e7e4', '#f1d9ba']"
                :key="c"
                :style="{ background: c }"
              />
            </div>
          </div>
          <button
            class="feature-main image-surface"
            @click="openPreview(featured)"
            @pointermove="spotlight"
          >
            <Transition name="scene"
              ><img
                :key="featured.id"
                :src="featured.src"
                :alt="featured.title"
                fetchpriority="high"
            /></Transition>
            <span class="feature-shade" /><span class="feature-badge"
              ><span class="status-dot" />本期精选</span
            >
            <span class="feature-caption"
              ><span
                ><span class="micro-label">{{ featured.tag }} / 精选</span
                ><strong>{{ featured.title }}</strong></span
              ><span class="round-arrow"><Icon name="arrow" /></span
            ></span>
          </button>
          <div class="feature-side">
            <button
              v-for="w in [wallpapers[2], wallpapers[4]]"
              :key="w.id"
              class="side-image image-surface"
              @click="openPreview(w)"
              @pointermove="spotlight"
            >
              <img :src="w.src" :alt="w.title" /><span class="side-caption"
                ><strong>{{ w.title }}</strong
                ><Icon name="arrow"
              /></span>
            </button>
          </div>
          <div class="feature-controls">
            <span>{{ String(active + 1).padStart(2, '0') }}<em> / 09</em></span
            ><button aria-label="上一张精选" @click="move(-1)">
              <Icon name="left" /></button
            ><button aria-label="下一张精选" @click="move(1)">
              <Icon name="right" />
            </button>
          </div>
        </section>
      </template>

      <section v-else class="cinema-stage" aria-label="影院精选">
        <Transition name="scene"
          ><img
            :key="featured.id"
            class="cinema-image"
            :src="featured.src"
            :alt="featured.title"
        /></Transition>
        <div class="cinema-shade" />
        <div class="cinema-title">
          <span class="micro-label"
            >{{ featured.tag }} · {{ String(active + 1).padStart(2, '0') }} /
            09</span
          >
          <h1>{{ featured.title }}</h1>
          <div class="cinema-actions">
            <button class="primary-action" @click="openPreview(featured)">
              <Icon name="screen" />上屏预览</button
            ><button
              class="icon-button"
              :aria-label="
                saved.includes(featured.id) ? '取消收藏精选' : '收藏精选'
              "
              :aria-pressed="saved.includes(featured.id)"
              @click="favorite(featured)"
            >
              <Icon name="heart" />
            </button>
          </div>
        </div>
        <div class="cinema-side">
          <span>{{ currentConcept.detail }}</span>
          <div class="vertical-line" />
          <button class="icon-button" aria-label="下一张精选" @click="move(1)">
            <Icon name="down" />
          </button>
        </div>
        <div ref="filmstrip" class="filmstrip" aria-label="选择场景">
          <button
            v-for="(w, i) in wallpapers"
            :key="w.id"
            :aria-label="`切换至${w.title}`"
            :aria-pressed="active === i"
            @click="active = i"
          >
            <img :src="w.src" :alt="w.title" /><span>{{
              String(i + 1).padStart(2, '0')
            }}</span>
          </button>
        </div>
      </section>

      <section class="collection" aria-label="壁纸作品">
        <div class="collection-header">
          <div class="section-heading">
            <Icon :name="savedOnly ? 'heart' : 'grid'" />
            <h2>{{ savedOnly ? '我的收藏' : '发现灵感' }}</h2>
            <span>{{ filtered.length.toString().padStart(2, '0') }}</span>
          </div>
          <button
            class="text-action"
            @click="randomPreview"
          >
            <Icon name="shuffle" />随心一张
          </button>
        </div>
        <div class="filter-dock">
          <div class="category-tabs" aria-label="壁纸主题">
            <button
              v-for="tag in ['全部', '山野', '星空', '海岸', '森林', '旷野']"
              :key="tag"
              :aria-pressed="category === tag"
              @click="category = tag"
            >
              {{ tag }}
            </button>
          </div>
          <label class="preview-search"
            ><Icon name="search" /><input
              v-model="query"
              aria-label="搜索预览壁纸"
              placeholder="搜索你的灵感"
            /><button v-if="query" aria-label="清空搜索" @click="query = ''">
              <Icon name="close" /></button
            ><span v-else class="search-hint">搜索</span></label
          >
        </div>
        <div class="preview-grid">
          <article
            v-for="(w, i) in filtered"
            :key="w.id"
            class="wallpaper-tile image-surface"
            :style="{
              '--image-accent': w.color,
              '--entry-delay': `${i * 45}ms`,
            }"
            @pointermove="spotlight"
          >
            <button
              class="tile-open"
              :aria-label="`预览${w.title}`"
              @click="openPreview(w)"
            >
              <img :src="w.src" :alt="w.title" loading="lazy" /><span
                class="tile-shade"
              /><span class="tile-caption"
                ><strong>{{ w.title }}</strong
                ><span>{{ w.tag }}</span></span
              ><span class="tile-preview"><Icon name="screen" />上屏预览</span>
            </button>
            <button
              class="tile-heart icon-button"
              :aria-label="`${saved.includes(w.id) ? '取消收藏' : '收藏'}${w.title}`"
              :aria-pressed="saved.includes(w.id)"
              @click="favorite(w)"
            >
              <Icon name="heart" />
            </button>
          </article>
        </div>
        <div v-if="!filtered.length" class="preview-empty">
          <Icon :name="savedOnly ? 'heart' : 'search'" />
          <p>{{ savedOnly ? '还没有收藏' : '没有找到相关壁纸' }}</p>
          <button
            @click="resetFilters"
          >
            浏览全部
          </button>
        </div>
        <div class="collection-end">
          <span />{{ filtered.length }} 幅作品<span />
        </div>
      </section>
    </div>

    <dialog
      ref="dialog"
      class="wallpaper-dialog"
      aria-labelledby="preview-dialog-title"
      @cancel.prevent="closePreview"
      @click="$event.target === dialog && closePreview()"
      @keydown.left.prevent="previewStep(-1)"
      @keydown.right.prevent="previewStep(1)"
    >
      <div v-if="preview" class="preview-modal">
        <div class="modal-top">
          <span id="preview-dialog-title"
            >{{ preview.title }}<small>{{ preview.tag }}</small></span
          ><button
            class="icon-button"
            aria-label="关闭预览"
            @click="closePreview"
          >
            <Icon name="close" />
          </button>
        </div>
        <div
          class="device-stage"
          :style="{ '--device-image': `url(${preview.src})` }"
        >
          <div class="device-aura" />
          <button
            class="preview-previous icon-button"
            aria-label="上一张壁纸"
            @click="previewStep(-1)"
          >
            <Icon name="left" />
          </button>
          <div class="device-frame" :class="device">
            <img :src="preview.src" :alt="preview.title" />
            <div v-if="device === 'phone'" class="lock-screen">
              <span>星期四，11月5日</span><strong>09:41</strong>
            </div>
            <span v-if="device === 'desktop'" class="desktop-dock"
              ><i v-for="i in 5" :key="i"
            /></span>
          </div>
          <button
            class="preview-next icon-button"
            aria-label="下一张壁纸"
            @click="previewStep(1)"
          >
            <Icon name="right" />
          </button>
        </div>
        <div class="modal-bottom">
          <div class="device-tabs">
            <button
              :aria-pressed="device === 'desktop'"
              @click="device = 'desktop'"
            >
              <Icon name="screen" />桌面</button
            ><button
              :aria-pressed="device === 'phone'"
              @click="device = 'phone'"
            >
              <Icon name="phone" />锁屏</button
            ><button
              :aria-pressed="device === 'original'"
              @click="device = 'original'"
            >
              原图
            </button>
          </div>
          <div class="modal-actions">
            <button
              class="icon-button"
              :aria-label="
                saved.includes(preview.id) ? '取消收藏当前壁纸' : '收藏当前壁纸'
              "
              :aria-pressed="saved.includes(preview.id)"
              @click="favorite(preview)"
            >
              <Icon name="heart" /></button
            ><a
              class="primary-action"
              :href="preview.src"
              :download="`${preview.title}-preview.jpg`"
              ><Icon name="down" />下载样图</a
            >
          </div>
        </div>
      </div>
    </dialog>
    <Transition name="toast"
      ><div v-if="toast" role="status" class="preview-toast">
        <Icon name="heart" />{{ toast }}
      </div></Transition
    >
  </div>
</template>

<style src="../styles/design-preview.css"></style>
