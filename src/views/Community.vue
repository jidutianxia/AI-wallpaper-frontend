<template>
  <div class="community">
    <div class="container">
      <div class="header">
        <h1>社区</h1>
      </div>
      <div class="grid">
        <aside class="left">
          <el-card class="profile-card">
            <div class="profile-top" :class="{ clickable: isAuthenticated }">
              <template v-if="isAuthenticated">
                <img :src="getAvatarUrl(userStore.info?.avatarUrl)" class="avatar-lg" @click="goProfile(userStore.info?.id)" />
                <div class="creator">
                  <div class="creator-name" @click="goProfile(userStore.info?.id)">{{ displayName }}</div>
                  <div class="creator-desc">{{ signature }}</div>
                </div>
                <el-button class="publish-btn" type="primary" round @click.stop="handlePublishClick">发布</el-button>
              </template>
              <template v-else>
                <div class="avatar-lg placeholder"><el-icon><User /></el-icon></div>
                <div class="creator"><div class="creator-name">创作空间</div></div>
                <el-button class="publish-btn" type="primary" round @click.stop="handlePublishClick">发布</el-button>
              </template>
            </div>
            <div v-if="isAuthenticated" class="stats-grid">
              <div class="stat-item"><el-icon class="stat-icon"><EditPen /></el-icon><div class="stat-val">{{ isAuthenticated ? myStat.posts : 0 }}</div><div class="stat-label">发布</div></div>
              <div class="stat-item">
                <el-icon class="stat-icon">
                  <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"><path fill="currentColor" d="M699.6 148.8c-76.8 0-146.4 40.8-187.6 102.4C470.4 189.6 401.2 148.8 324 148.8 194.8 148.8 90 253.6 90 382.8c0 178 184.4 330 384.4 468.4 12.8 8.8 29.2 8.8 42 0C739.2 702.4 934 544.4 934 382.8c-0.4-129.2-105.2-234-234.4-234z m0-64c164.4 0 298.4 133.6 298.4 298 0 205.6-224.4 394-472.4 559.6-9.2 6-21.2 6-30.4 0C247.2 776.8 26 588.4 26 382.8 26 218.4 160 84.8 324.4 84.8c92 0 174.4 42 228.4 107.2 54-65.2 136.4-107.2 228.4-107.2z" transform="scale(0.9) translate(50,50)"/></svg>
                </el-icon>
                <div class="stat-val">{{ isAuthenticated ? myStat.likes : 0 }}</div><div class="stat-label">获赞</div>
              </div>
              <div class="stat-item"><el-icon class="stat-icon"><ChatLineSquare /></el-icon><div class="stat-val">{{ isAuthenticated ? myStat.comments : 0 }}</div><div class="stat-label">评论</div></div>
            </div>
          </el-card>
        </aside>
        <main class="center">
          <div class="filters">
            <el-radio-group v-model="feedMode" class="feed-toggle">
              <el-radio-button label="all">广场</el-radio-button>
              <el-radio-button label="following">关注</el-radio-button>
            </el-radio-group>
            <el-input v-if="feedMode === 'all'" v-model="q" placeholder="搜索标题或内容" class="filter-input" prefix-icon="Search" />
            <el-select v-if="feedMode === 'all'" v-model="tag" placeholder="按标签筛选" class="filter-select" clearable>
              <el-option v-for="t in tagOptions" :key="t" :label="t" :value="t" />
            </el-select>
            <el-select v-if="feedMode === 'all'" v-model="sort" class="filter-select" aria-label="帖子排序">
              <el-option label="最新发布" value="latest" />
              <el-option label="热门讨论" value="popular" />
            </el-select>
          </div>
          <AppState v-if="loading" type="loading" :rows="3" />
          <AppState
            v-else-if="postsError"
            type="error"
            description="帖子加载失败，请重试"
            retryable
            @retry="loadPosts(page)"
          />
          <transition name="fade-list" v-else-if="posts.length > 0"><div class="posts" ref="postsRef">
            <el-card v-for="p in posts" :key="p.id" class="post">
              <div class="post-header">
                <div class="author" @click="goProfile(p.author?.id)"><img :src="getAvatarUrl(p.author?.avatarUrl)" class="avatar" /><span class="name">{{ p.author?.username || '匿名' }}</span></div>
                <h4 class="title" @click="goPost(p.id)">{{ p.title }}</h4>
                <div class="tags"><el-tag v-for="t in p.tags" :key="t" size="small" class="post-tag">{{ t }}</el-tag></div>
              </div>
              <p class="content" @click="goPost(p.id)">{{ p.content }}</p>
              <div class="images" :class="{ 'single-media': p.images?.length === 1 }"><div role="link" tabindex="0" @keydown.enter.self="goImage(p.id,i)" v-for="(u,i) in p.images" :key="i" class="post-media-link" :aria-label="`查看${p.title} · ${i+1}`" @click.stop="goImage(p.id,i)"><MediaSurface :src="u" :alt="p.title" class="image" /></div></div>
              <div class="post-actions">
                <ReactionButton :active="Boolean(p.liked)" :pending-action="p._interacting" :count="Number(p.likes || 0)" @click="toggleLike(p)" />
                <ReactionButton kind="favorite" :active="Boolean(p.favorited)" :pending-action="p._interacting" :count="Number(p.favorites || 0)" @click="toggleFavorite(p)" />
                <el-button link size="small" @click="sharePost(p)">
                  <el-icon :size="18" class="action-icon"><Share /></el-icon>
                  <span class="count">分享</span>
                </el-button>
                <el-button link size="small" @click="openComments(p)">
                  <el-icon :size="18" class="action-icon"><ChatLineSquare /></el-icon>
                  <span class="count">{{ commentCount(p) }}</span>
                </el-button>
                <el-button link size="small" @click="reportPost(p)">
                  <el-icon :size="18" class="action-icon"><Warning /></el-icon>
                  <span class="count">举报</span>
                </el-button>
              </div>
              <div v-if="p.showComment" class="comments">
                <CommentItem v-for="(c,i) in (p.comments||[])" :key="i" :comment="c" />
                <div class="comment-editor"><el-input v-model="p.newComment" placeholder="写下评论" /><el-button size="small" type="primary" @click="addComment(p)">发送</el-button></div>
              </div>
            </el-card>
          </div></transition>
          <div v-else-if="feedMode === 'following'" class="following-empty">
            <AppState description="关注创作者后，这里会展示他们的最新分享" />
            <div v-if="recommendedUsers.length" class="inline-recommendations">
              <div v-for="u in recommendedUsers" :key="u.id" class="recommend-user">
                <img :src="getAvatarUrl(u.avatarUrl)" class="avatar" @click="goProfile(u.id)" />
                <div class="uinfo" @click="goProfile(u.id)">
                  <div class="uname">{{ u.nickname || u.username }}</div>
                  <div class="uextra">帖子 {{ u.postCount || 0 }} | 粉丝 {{ u.followersCount || 0 }}</div>
                </div>
                <el-button size="small" type="primary" round :loading="u.followingLoading" @click="followRecommended(u)">关注</el-button>
              </div>
            </div>
          </div>
          <AppState v-else description="暂无帖子" />
          <div v-if="total > pageSize" class="pagination"><el-pagination background layout="prev, pager, next" :page-size="pageSize" :total="total" v-model:current-page="page" /></div>
        </main>
        <aside v-if="hotPosts.length || recentUsers.length || isAuthenticated" class="right">
          <el-card v-if="hotPosts.length" class="hot"><h4>热门帖子</h4><ol class="hot-list"><li v-for="(h,i) in hotPosts" :key="h.id" @click="goPost(h.id)">{{ i+1 }}. {{ h.title }}</li></ol></el-card>
          <el-card v-if="recentUsers.length" class="recent"><h4>近期分享者</h4><div class="users"><div class="creator-row" v-for="u in recentUsers" :key="u.id" @click="goProfile(u.id)"><img :src="getAvatarUrl(u.avatarUrl)" class="avatar" /><div class="uinfo"><div class="uname">{{ u.username }}</div><div class="uextra">帖子 {{ u.postCount }} | 获赞 {{ u.likeCount }}</div></div></div></div></el-card>
          <el-card v-if="isAuthenticated" class="recommended">
            <h4>推荐关注</h4>
            <AppState v-if="recommendedLoading" type="loading" :rows="2" />
            <div v-else class="users">
              <div class="creator-row recommend-row" v-for="u in recommendedUsers" :key="u.id">
                <img :src="getAvatarUrl(u.avatarUrl)" class="avatar" @click="goProfile(u.id)" />
                <div class="uinfo" @click="goProfile(u.id)">
                  <div class="uname">{{ u.nickname || u.username }}</div>
                  <div class="uextra">帖子 {{ u.postCount || 0 }} | 粉丝 {{ u.followersCount || 0 }}</div>
                </div>
                <el-button size="small" type="primary" link :loading="u.followingLoading" @click.stop="followRecommended(u)">关注</el-button>
              </div>
              <AppState v-if="!recommendedUsers.length" description="暂无推荐" />
            </div>
          </el-card>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import MediaSurface from '@/components/MediaSurface.vue'
import ReactionButton from '@/components/ReactionButton.vue'
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { ElMessage, ElMessageBox } from 'element-plus'
import { EditPen, Star, StarFilled, ChatLineSquare, User, Share, Warning } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getCommunityPosts, getFollowingPosts, getCommunityRecentUsers, commentCommunityPost, getUserStats, getCommunityPostComments, getCommunityPostImageMeta, getCommunityTags, getRecommendedUsers, followUser, reportContent } from '@/api'
import { getCommunityPost } from '@/api'
import AppState from '@/components/AppState.vue'
import CommentItem from '@/components/CommentItem.vue'
import { getImageUrl, getAvatarUrl } from '@/utils/imageHelper'
import { requestAuth } from '@/utils/authEvents'
import { normalizePagedResult, normalizePost } from '@/utils'
import { useInteraction } from '@/composables/useInteraction'
import { useShare } from '@/composables/useShare'
import { isStaleRequestError, usePagedList } from '@/composables/usePagedList'

const tagOptions = ['插画', '风景', '极简', '赛博', '像素', '摄影']
const userStore = useUserStore()
const { toggleInteraction } = useInteraction()
const { share } = useShare()
const isAuthenticated = computed(() => userStore.isAuthenticated)
const displayName = computed(() => userStore.info?.nickname || userStore.info?.username || '请先登录')
const signature = computed(() => userStore.info?.signature || userStore.info?.bio || '')
const q = ref('')
const tag = ref('')
const sort = ref('latest')
const feedMode = ref('all')
const recommendedUsers = ref([])
const recommendedLoading = ref(false)
const {
  items: posts,
  total,
  page,
  pageSize,
  loading,
  error: postsError,
  load: loadPostList
} = usePagedList({
  fetcher: (params) => feedMode.value === 'following' ? getFollowingPosts(params) : getCommunityPosts(params),
  getParams: () => ({
    ...(feedMode.value === 'all'
      ? {
          q: q.value || undefined,
          tag: tag.value || undefined,
          sort: sort.value,
          includeCounts: true
        }
      : {})
  }),
  normalizeItem: normalizePost,
  initialPageSize: 10
})

const myStat = ref({ posts: 0, likes: 0, comments: 0 })
const hotPostsSource = ref([])
const hotPosts = computed(() => hotPostsSource.value)
const recentUsersSource = ref([])
const recentUsers = computed(() => recentUsersSource.value)
const loadHot = async () => {
  try {
    const hot = await getCommunityPosts({ page: 1, size: 5, sort: 'popular', includeCounts: true })
    hotPostsSource.value = normalizePagedResult(hot, normalizePost).items
  } catch {}
}
const loadRecentUsers = async () => {
  try { recentUsersSource.value = await getCommunityRecentUsers() } catch {}
}
const loadTags = async () => {
  try {
    const rows = await getCommunityTags()
    const tags = (rows || []).map(item => item.tag || item.name || item).filter(Boolean)
    if (tags.length > 0) tagOptions.splice(0, tagOptions.length, ...tags)
  } catch {}
}
loadHot(); loadRecentUsers(); loadTags()

const loadRecommendedUsers = async () => {
  if (!isAuthenticated.value) {
    recommendedUsers.value = []
    return
  }
  recommendedLoading.value = true
  try {
    const res = await getRecommendedUsers({ page: 1, size: 5 })
    recommendedUsers.value = normalizePagedResult(res).items
  } catch {
    recommendedUsers.value = []
  } finally {
    recommendedLoading.value = false
  }
}

const loadPosts = async (requestedPage = page.value) => {
  try {
    await loadPostList({ page: requestedPage })
  } catch (error) {
    if (isStaleRequestError(error)) return
    console.error('Failed to fetch community posts:', error)
  }
}

// Watchers for search/filter/pagination
const debouncedLoadPosts = useDebounceFn(() => {
  if (page.value !== 1) page.value = 1
  else loadPosts(1)
}, 300)

watch([q, tag, sort], () => {
  if (feedMode.value === 'all') debouncedLoadPosts()
})
watch(feedMode, (mode) => {
  if (mode === 'following' && !isAuthenticated.value) {
    requestAuth({ reason: 'following-feed' })
    feedMode.value = 'all'
    return
  }
  if (page.value !== 1) page.value = 1
  else loadPosts(1)
  if (mode === 'following') loadRecommendedUsers()
})
watch(page, (nextPage) => loadPosts(nextPage))

// Initial load
loadPosts()

const loadMyStats = async () => {
  if (!isAuthenticated.value) { myStat.value = { posts: 0, likes: 0, comments: 0 }; return }
  try {
    const stats = await getUserStats()
    myStat.value.posts = stats.postCount ?? 0
    myStat.value.likes = stats.likeCount ?? 0
    myStat.value.comments = stats.receivedLikes ?? 0
  } catch { myStat.value = { posts: 0, likes: 0, comments: 0 } }
}
loadMyStats()
watch(isAuthenticated, (v) => {
  if (v) {
    loadMyStats()
    loadRecommendedUsers()
  } else {
    myStat.value = { posts: 0, likes: 0, comments: 0 }
    recommendedUsers.value = []
    if (feedMode.value === 'following') feedMode.value = 'all'
  }
})
const handlePublishClick = () => {
  if (!isAuthenticated.value) {
    ElMessage.warning('请先登录后再发布')
    requestAuth({ reason: 'publish' })
    return
  }
  goCompose()
}

const goCompose = () => { router.push('/community/compose') }

// In-view animation: observe post cards and add class
const postsRef = ref(null)
let io
onMounted(() => {
  io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.classList.add('in-view')
      io?.unobserve(entry.target)
    }
  }, { threshold: 0.12 })
})

onBeforeUnmount(() => {
  if (io) {
    io.disconnect()
    io = null
  }
})

watch([posts, loading], async () => {
  await nextTick()
  if (!postsRef.value || !io || loading.value) return
  const cards = postsRef.value.querySelectorAll('.post:not(.in-view)')
  cards.forEach(c => io.observe(c))
})

const toggleLike = async (p) => {
  await toggleInteraction(p, 'like', 'post', {
    successMessage: (post) => post.liked ? '点赞成功' : '已取消点赞'
  })
}

const addComment = async (p) => {
  const v = (p.newComment || '').trim()
  if (!v) return
  try {
    await commentCommunityPost(p.id, v)
    p.comments = p.comments || []
    p.comments.push({ content: v, createdAt: new Date().toISOString(), author: userStore.info })
    p.commentsCount = (p.commentsCount || 0) + 1
    p.newComment = ''
    ElMessage.success('评论发布成功')
  } catch { ElMessage.error('评论失败') }
}

const openComments = async (p) => {
  p.showComment = !p.showComment
  if (!p.showComment) return
  if (!p.comments || p.comments.length === 0) {
    try {
      const res = await getCommunityPostComments(p.id, { page: 1, size: 10 })
      const pageData = normalizePagedResult(res)
      p.comments = pageData.items
      // Update count if server returns a total count
      if (typeof pageData.total !== 'undefined') p.commentsCount = pageData.total
    } catch {}
  }
}

const commentCount = (p) => p.commentsCount || p.comments?.length || 0

const toggleFavorite = async (p) => {
  await toggleInteraction(p, 'favorite', 'post', {
    successMessage: (post) => post.favorited ? '已收藏' : '已取消收藏'
  })
}

const sharePost = async (p) => {
  await share({
    title: p.title,
    text: (p.content || '').slice(0, 80),
    url: `${location.origin}/community/post/${p.id}`
  })
}

const followRecommended = async (u) => {
  if (!isAuthenticated.value) {
    requestAuth({ reason: 'follow' })
    return
  }
  const previous = [...recommendedUsers.value]
  u.followingLoading = true
  try {
    await followUser(u.id)
    recommendedUsers.value = recommendedUsers.value.filter(item => String(item.id) !== String(u.id))
    ElMessage.success('已关注')
    if (feedMode.value === 'following' && posts.value.length === 0) loadPosts(1)
  } catch {
    recommendedUsers.value = previous
    ElMessage.error('关注失败')
  } finally {
    u.followingLoading = false
  }
}

// 跳转函数
const reportPost = async (p) => {
  if (!isAuthenticated.value) {
    requestAuth({ reason: 'report' })
    return
  }
  try {
    const { value } = await ElMessageBox.prompt('请简要说明问题', '举报帖子', {
      confirmButtonText: '提交',
      cancelButtonText: '取消',
      inputPlaceholder: '例如侵权、垃圾内容或不当内容'
    })
    await reportContent({
      targetType: 'post',
      targetId: p.id,
      reason: 'user_report',
      description: value || ''
    })
    ElMessage.success('举报已提交')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error('提交失败，请稍后重试')
  }
}

import { useRouter } from 'vue-router'
const router = useRouter()
const goPost = (id) => { router.push(`/community/post/${id}`) }
const goImage = async (id, index) => {
  try {
    const meta = await getCommunityPostImageMeta(id, index)
    if (meta && meta.wallpaperInfo && meta.wallpaperInfo.id) {
      router.push(`/detail/${meta.wallpaperInfo.id}`)
    } else {
      router.push(`/community/post/${id}/image/${index}`)
    }
  } catch (e) {
    console.error('Check wallpaper info failed:', e)
    router.push(`/community/post/${id}/image/${index}`)
  }
}
const goProfile = (uid) => {
  if (!uid) return
  const myId = userStore.info?.id
  if (myId && String(myId) === String(uid)) router.push('/user')
  else router.push(`/profile/${uid}`)
}

const currentAvatar = computed(() => getAvatarUrl(userStore.info?.avatarUrl))

watch(() => userStore.info?.id, async () => { await loadPosts(); await loadRecommendedUsers() })

const refreshPost = async (id) => {
  try {
    const fresh = await getCommunityPost(id)
    const idx = posts.value.findIndex(x => String(x.id) === String(id))
    if (idx >= 0) posts.value[idx] = normalizePost({ ...posts.value[idx], ...fresh })
  } catch {}
}
</script>



<style scoped>
.community { padding: 2rem 0; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
.header { margin-bottom: 1rem; }
.grid { display: grid; grid-template-columns: 280px 1fr 300px; gap: 16px; align-items: start; }

/* Profile Card */
.profile-card {
  background: var(--app-bg-card);
  border: 1px solid var(--app-border);
  border-radius: 12px;
  color: var(--app-text-main);
  --el-card-bg-color: var(--app-bg-card);
  --el-card-border-color: var(--app-border);
}
.profile-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--app-border);
  margin-bottom: 16px;
}
.profile-top.clickable { cursor: pointer; }

.avatar-lg {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 12px;
  border: 2px solid var(--app-border);
  box-shadow: var(--app-shadow-sm);
}
.avatar-lg.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-bg-hover);
  color: var(--app-text-secondary);
  font-size: 32px;
}
.creator-name { font-weight: 600; font-size: 1.1rem; color: var(--app-text-main); margin-bottom: 4px; }
.creator-desc { font-size: 0.85rem; color: var(--app-text-secondary); margin-bottom: 12px; }
.publish-btn { width: 100%; }

/* Stats Grid */
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  border-radius: 8px;
  background: var(--app-bg-hover);
  transition: background 0.2s;
}
.stat-item:hover { background: var(--app-accent-bg-soft); }
.stat-icon { font-size: 18px; color: var(--app-text-secondary); margin-bottom: 4px; }
.stat-val { font-weight: 700; font-size: 1.1rem; color: var(--app-text-main); }
.stat-label { font-size: 0.75rem; color: var(--app-text-secondary); }

/* Filters */
.filters { 
  display: flex; 
  gap: 12px; 
  margin-bottom: 16px; 
  background: var(--app-bg-card);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
}
.filter-input { flex: 1; }
.feed-toggle {
  flex: 0 0 auto;
}
/* Force rounded pills for search inputs */
.filter-input :deep(.el-input__wrapper) { 
  background: var(--app-bg-card) !important; 
  box-shadow: 0 0 0 1px var(--app-border) inset !important;
  border-radius: 999px;
  padding-left: 16px;
}
.filter-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--app-color-primary) inset !important;
}
.filter-input :deep(.el-input__inner) { color: var(--app-text-main) !important; }

.filter-select { width: 160px; }
.filter-select :deep(.el-select__wrapper),
.filter-select :deep(.el-input__wrapper) { 
  background: var(--app-bg-card) !important; 
  box-shadow: 0 0 0 1px var(--app-border) inset !important;
  border-radius: 999px;
}


/* Posts */
.posts { display: flex; flex-direction: column; gap: 16px; }
.post {
  border-radius: 12px;
  /* Double gradient for border effect */
  background: linear-gradient(var(--app-bg-card), var(--app-bg-card)) padding-box,
              linear-gradient(135deg, var(--app-brand-gradient-start), var(--app-brand-gradient-end)) border-box;
  border: 1px solid transparent;
  color: var(--app-text-main);
  transition: transform .2s ease, box-shadow .2s ease;
}
.post:hover { transform: translateY(-2px); box-shadow: var(--app-shadow-card); }

.post-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.author { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.author .avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.author .name { font-weight: 500; font-size: 0.95rem; color: var(--app-text-main); }

.title { margin: 0 0 8px 0; font-size: 1.1rem; font-weight: 600; cursor: pointer; color: var(--app-text-main); transition: color 0.2s; }
.title:hover { color: var(--app-color-primary); }

.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.post-tag {
  border-radius: 999px;
  background: var(--app-accent-bg-soft);
  border: 1px solid var(--app-accent-border);
  color: var(--app-text-secondary);
  --el-tag-bg-color: var(--app-accent-bg-soft);
  --el-tag-border-color: var(--app-accent-border);
  --el-tag-text-color: var(--app-text-secondary);
}

.content { margin-bottom: 12px; color: var(--app-text-main); line-height: 1.6; cursor: pointer; opacity: 0.9; }

.images { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; margin-bottom: 12px; }
.image { width: 100%; height: auto; aspect-ratio: 16/9; object-fit: cover; border-radius: 8px; cursor: zoom-in; transition: transform 0.2s; }
.image:hover { transform: scale(1.02); }

.post-actions { display: flex; gap: 16px; border-top: 1px solid var(--app-border); padding-top: 12px; }
.post-actions .el-button { color: var(--app-text-secondary); }
.post-actions .el-button:hover { color: var(--app-color-primary); }
.post-actions .el-button.liked { color: #f56c6c; }
.post-actions .el-button.favorited { color: #e6a23c; }
.action-icon { vertical-align: middle; margin-right: 4px; }

.comments { margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--app-border); }
.comment-editor {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}
.inline-comment-input { flex: 1; }
.inline-comment-input :deep(.el-input__wrapper) {
  border-radius: 999px;
  background: var(--app-bg-base) !important;
  box-shadow: 0 0 0 1px var(--app-border) inset !important;
  padding: 8px 16px;
}
.inline-comment-input :deep(.el-input__inner) { color: var(--app-text-main); height: 24px; }
.send-btn { border-radius: 999px; padding: 8px 24px; height: 40px; }

.pagination { margin-top: 3rem; display: flex; justify-content: center; }

.following-empty {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-bg-card);
}

.inline-recommendations {
  display: grid;
  gap: 10px;
  padding: 0 16px 16px;
}

.recommend-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-bg-hover);
}

.recommend-user .avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

.recommend-user .uinfo {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

/* Right Sidebar */
.right { display: flex; flex-direction: column; gap: 16px; }
.hot, .recent, .recommended {
  border-radius: 12px;
  background: linear-gradient(var(--app-bg-card), var(--app-bg-card)) padding-box,
              linear-gradient(135deg, var(--app-brand-gradient-start), var(--app-brand-gradient-end)) border-box;
  border: 1px solid transparent;
  color: var(--app-text-main);
}
.hot h4, .recent h4, .recommended h4 { margin: 0 0 12px 0; font-size: 1rem; font-weight: 600; }

.hot-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.hot-list li {
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--app-accent-bg-soft);
  border: 1px solid var(--app-accent-border);
  color: var(--app-text-main);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hot-list li:hover { transform: translateX(4px); background: var(--app-bg-hover); box-shadow: var(--app-shadow-sm); }

.users { display: flex; flex-direction: column; gap: 10px; }
.creator-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px;
  border-radius: 8px;
  background: var(--app-accent-bg-soft);
  border: 1px solid var(--app-accent-border);
  cursor: pointer;
  transition: transform 0.2s;
  color: var(--app-text-main);
}
.creator-row:hover { transform: translateX(4px); background: var(--app-bg-hover); }
.recommend-row { cursor: default; }
.recommend-row:hover { transform: none; }
.recommend-row .uinfo,
.recommend-row .avatar { cursor: pointer; }
.user .avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.user .uinfo { flex: 1; min-width: 0; }
.user .uname { font-weight: 500; font-size: 0.9rem; color: var(--app-text-main); margin-bottom: 2px; }
.user .uextra { font-size: 0.75rem; color: var(--app-text-secondary); }

@media (prefers-reduced-motion: no-preference) {
  .post.in-view { animation: post-arrive .42s ease-out; }
}
@keyframes post-arrive {
  from { opacity: .8; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-list-enter-active, .fade-list-leave-active { transition: opacity .25s ease; }
.fade-list-enter-from, .fade-list-leave-to { opacity: 0; }

@media (max-width: 900px) {
  .grid { grid-template-columns: 1fr; }
  .images { grid-template-columns: repeat(3, 1fr); }
  .left, .right { display: none; }
  .filters { flex-wrap: wrap; }
  .feed-toggle { width: 100%; }
  .feed-toggle :deep(.el-radio-button) { flex: 1; }
  .feed-toggle :deep(.el-radio-button__inner) { width: 100%; }
}

@media (max-width: 600px) {
  .community { padding: 0.5rem 0; }
  .container { padding: 0 8px; }
  
  .post { border-radius: 8px; }
  .post :deep(.el-card__body) { padding: 12px !important; }
  
  .post-header { margin-bottom: 8px; }
  .author .avatar { width: 28px; height: 28px; }
  .author .name { font-size: 0.9rem; }
  .title { font-size: 1rem; margin-bottom: 6px; }
  .content { font-size: 0.9rem; margin-bottom: 8px; }
  
  .images { grid-template-columns: repeat(2, 1fr); gap: 4px; }
  /* Single image spans full width */
  .image:first-child:nth-last-child(1) {
    grid-column: 1 / -1;
    aspect-ratio: 16/9;
  }
  
  .post-actions { gap: 4px; padding-top: 8px; justify-content: space-between; }
  .post-actions .el-button { padding: 0 6px; height: 28px; font-size: 12px; }
  .post-actions .action-icon { margin-right: 2px; font-size: 16px !important; }
  
  .pagination { margin-top: 2rem; }
  .pagination :deep(.el-pagination) { 
    --el-pagination-button-width: 28px;
    --el-pagination-button-height: 28px;
    --el-pagination-font-size: 12px;
  }
  .pagination :deep(.btn-prev), .pagination :deep(.btn-next) { margin: 0 2px; }
  .pagination :deep(.el-pager li) { margin: 0 2px; }
}
.header h1 { font-size:24px;font-weight:500;letter-spacing:-.03em; }.header p { color:var(--app-text-secondary); }
.filters { flex-wrap:wrap; }.filters .filter-input { flex:1 1 180px;min-width:160px; }.filters .filter-select { flex:1 1 120px; }.filters .el-radio-group { flex-shrink:0; }
</style>
