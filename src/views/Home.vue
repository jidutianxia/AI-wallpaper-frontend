<template>
  <div class="home">
    <FeaturedCinema :wallpapers="featuredWallpapers" />
    <nav class="home-subjects container" aria-label="探索主题">
      <router-link
        v-for="topic in ['自然', '城市', '动漫', '极简', '暗黑']"
        :key="topic"
        :to="{ path: '/search', query: { q: topic } }"
        >{{ topic }}<span>↗</span></router-link
      ><router-link to="/category" aria-label="全部分类" title="全部分类"><el-icon><Grid /></el-icon></router-link>
    </nav>
    <section class="featured-section">
      <div class="container">
        <header class="gallery-heading">
          <div>
            <h2>壁纸</h2>
          </div>
          <div class="section-tabs" aria-label="壁纸排序">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              :aria-pressed="activeTab === tab.key"
              :aria-label="tab.label"
              :title="tab.label"
              :class="{ active: activeTab === tab.key }"
              :disabled="loading"
              @click="handleTabChange(tab.key)"
            >
              <el-icon><component :is="tab.icon" /></el-icon>
            </button>
          </div>
        </header>
        <!-- Error State -->
        <div v-if="isError" class="error-state">
          <AppState
            type="error"
            description="加载失败，请重试"
            retryable
            @retry="fetchWallpapers"
          />
        </div>

        <!-- Skeleton Loading -->
        <div v-else-if="loading && page === 1" class="wallpapers-grid">
          <div v-for="n in size" :key="n" class="skeleton-card">
            <el-skeleton animated>
              <template #template>
                <el-skeleton-item
                  variant="image"
                  style="width: 100%; height: 240px; border-radius: 12px"
                />
                <div style="padding: 14px 0">
                  <el-skeleton-item variant="h3" style="width: 50%" />
                  <div
                    style="
                      display: flex;
                      justify-content: space-between;
                      margin-top: 10px;
                    "
                  >
                    <el-skeleton-item variant="text" style="width: 30%" />
                    <el-skeleton-item variant="text" style="width: 20%" />
                  </div>
                </div>
              </template>
            </el-skeleton>
          </div>
        </div>

        <!-- Content -->
        <div v-else-if="!featuredWallpapers.length" class="gallery-empty">
          <svg viewBox="0 0 80 64" aria-hidden="true">
            <rect x="9" y="7" width="62" height="48" rx="4" />
            <circle cx="51" cy="23" r="5" />
            <path d="m10 45 18-19 19 21 11-11 12 12" />
          </svg>
          <h3>暂无作品</h3>
          <router-link
            to="/community/compose"
            class="intro-primary"
            aria-label="上传作品"
            title="上传作品"
            ><el-icon><Plus /></el-icon
          ></router-link>
        </div>
        <div v-else class="wallpapers-grid">
          <UnifiedCard
            v-for="wallpaper in featuredWallpapers"
            :key="wallpaper.id"
            :data="mapCard(wallpaper)"
          />
        </div>

        <div class="load-more" v-if="hasMore && !isError && !loading">
          <div ref="sentinel" class="scroll-sentinel">
            <button @click="loadMore">加载更多作品</button>
          </div>
        </div>
        <div class="load-more" v-else-if="loading && page > 1">
          <el-button loading text>加载中...</el-button>
        </div>
        <div
          class="load-more"
          v-else-if="!hasMore && !isError && featuredWallpapers.length > 0"
        >
          <span class="no-more">没有更多了</span>
        </div>
      </div>
    </section>

    <!-- 页脚已移至全局 App.vue -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import { Clock, TrendCharts, Download, Plus, Grid } from "@element-plus/icons-vue";
import UnifiedCard from "@/components/UnifiedCard.vue";
import FeaturedCinema from "@/components/FeaturedCinema.vue";
import AppState from "@/components/AppState.vue";
import { getWallpapers } from "@/api/wallpaper";
import { formatAuthor, normalizeWallpaper } from "@/utils";
import { isStaleRequestError, usePagedList } from "@/composables/usePagedList";

// 响应式数据
const activeTab = ref("latest");
const sentinel = ref(null);
let observer = null;
let observeTimer = null;

const tabs = [
  { key: "latest", label: "最新", icon: Clock },
  { key: "popular", label: "热门", icon: TrendCharts },
  { key: "featured", label: "下载最多", icon: Download },
];

const sortMap = {
  latest: "latest",
  popular: "hot",
  featured: "download",
};

const {
  items: featuredWallpapers,
  page,
  pageSize: size,
  loading,
  error: listError,
  hasMore,
  load: loadWallpapers,
} = usePagedList({
  fetcher: getWallpapers,
  getParams: () => ({
    sort: sortMap[activeTab.value] || "latest",
  }),
  normalizeItem: normalizeWallpaper,
  initialPageSize: 9,
});

const isError = computed(() =>
  Boolean(listError.value && featuredWallpapers.value.length === 0),
);

// append=true 用于无限滚动追加；重试或切换标签时替换列表，避免重复卡片。
const fetchWallpapers = async (append = false, requestedPage = page.value) => {
  if (loading.value) return;

  try {
    await loadWallpapers({ append, page: requestedPage });
  } catch (error) {
    if (isStaleRequestError(error)) return;
    console.error("Failed to fetch wallpapers:", error);
    ElMessage.error("获取壁纸失败，请稍后重试");
  } finally {
    // 哨兵元素重挂载后重新 observe，保证追加列表时无限滚动还能继续触发。
    if (hasMore.value && !isError.value && sentinel.value && observer) {
      // Small delay to ensure DOM updated
      if (observeTimer) clearTimeout(observeTimer);
      observeTimer = setTimeout(() => {
        observer.unobserve(sentinel.value);
        observer.observe(sentinel.value);
      }, 100);
    }
  }
};

// 切换标签
const handleTabChange = (tab) => {
  if (loading.value || activeTab.value === tab) return;
  activeTab.value = tab;
  fetchWallpapers(false, 1);
};

// 加载更多
const loadMore = () => {
  fetchWallpapers(true, page.value + 1);
};

onMounted(() => {
  fetchWallpapers();

  // Setup Intersection Observer
  observer = new IntersectionObserver(
    (entries) => {
      if (
        entries[0].isIntersecting &&
        hasMore.value &&
        !loading.value &&
        !isError.value
      ) {
        loadMore();
      }
    },
    { rootMargin: "200px" },
  );

  // We need to wait for DOM update to observe sentinel
  if (observeTimer) clearTimeout(observeTimer);
  observeTimer = setTimeout(() => {
    if (sentinel.value) observer.observe(sentinel.value);
  }, 500);
});

onUnmounted(() => {
  if (observeTimer) clearTimeout(observeTimer);
  if (observer) observer.disconnect();
});

// 统一把后端壁纸模型适配为 UnifiedCard 所需字段，页面不再关心兼容字段名。
const mapCard = (w) => ({
  id: w.id,
  target: w,
  title: w.title,
  thumb: w.thumbUrl || w.url,
  url: w.url,
  resolution: w.resolution,
  likes: w.likes,
  liked: w.liked,
  favorited: w.favorited,
  author: formatAuthor(w.uploader || w.author),
  width: w.width,
  height: w.height,
});
</script>
<style scoped>
.home {
  padding: 28px 0 48px;
}
.gallery-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}
.gallery-heading h1 {
  font-size: 22px;
  letter-spacing: -0.04em;
  margin: 0;
  font-weight: 550;
}
.section-tabs {
  display: flex;
  gap: 8px;
}
.section-tabs button {
  border-radius: 0;
  background: transparent;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--app-text-secondary);
}
.section-tabs button.active {
  color: var(--app-text-main);
  border-bottom: 2px solid var(--app-color-primary);
}
.wallpapers-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px 16px;
}
.gallery-empty {
  min-height: 55vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  border: 1px solid var(--app-border);
  background: var(--app-bg-card);
  position: relative;
}
.gallery-empty::before,
.gallery-empty::after {
  content: "";
  width: 20px;
  height: 20px;
  position: absolute;
  border-color: var(--app-text-secondary);
}
.gallery-empty::before {
  top: -1px;
  left: -1px;
  border-top: 1px solid;
  border-left: 1px solid;
}
.gallery-empty::after {
  bottom: -1px;
  right: -1px;
  border-bottom: 1px solid;
  border-right: 1px solid;
}
.gallery-empty svg {
  width: 60px;
  height: 48px;
  stroke: var(--app-text-secondary);
  stroke-width: 0.8;
  fill: none;
}
.gallery-empty h3 {
  font-size: 13px;
  font-weight: 400;
  color: var(--app-text-secondary);
  margin: 0;
}
.intro-primary {
  font-size: 13px;
  color: var(--app-text-main);
  padding: 10px 20px;
  border: 1px solid var(--app-border);
}
.load-more {
  text-align: center;
  padding: 32px;
  font-size: 12px;
  color: var(--app-text-secondary);
}
@media (max-width: 768px) {
  .home {
    padding-top: 20px;
  }
  .wallpapers-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 10px;
  }
  .section-tabs {
    gap: 0;
  }
  .section-tabs button {
    padding-inline: 10px;
  }
  .gallery-empty {
    min-height: 50vh;
  }
}
@media (max-width: 480px) {
  .wallpapers-grid {
    grid-template-columns: 1fr;
  }
}
</style>
