<template>
  <div class="community">
    <div class="container">
      <div class="header">
        <h2>社区</h2>
        <p>浏览公共分享与创作，支持上传最多 10 张图片。</p>
      </div>
      <div class="grid">
        <aside class="left">
          <el-card class="profile-card">
            <div class="profile-top" :class="{ clickable: isAuthenticated }">
              <template v-if="isAuthenticated">
                <img :src="avatarUrl" class="avatar-lg" @click="goProfile(userStore.info?.id)" />
                <div class="creator">
                  <div class="creator-name" @click="goProfile(userStore.info?.id)">{{ displayName }}</div>
                  <div class="creator-desc">{{ signature }}</div>
                </div>
                <el-button class="publish-btn" type="primary" round @click.stop="handlePublishClick">发布</el-button>
              </template>
              <template v-else>
                <div class="avatar-lg placeholder"><el-icon><User /></el-icon></div>
                <div class="creator"><div class="creator-name">请先登录</div><div class="creator-desc">登录后可发布内容</div></div>
                <el-button class="publish-btn" type="primary" round :disabled="true" @click.stop="handlePublishClick">发布</el-button>
              </template>
            </div>
            <div class="stats-grid">
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
            <el-input v-model="q" placeholder="搜索标题或内容" class="filter-input" prefix-icon="Search" />
            <el-select v-model="tag" placeholder="按标签筛选" class="filter-select" clearable>
              <el-option v-for="t in tagOptions" :key="t" :label="t" :value="t" />
            </el-select>
          </div>
          <template v-if="loading">
            <div class="posts">
              <el-card v-for="i in 3" :key="i" class="post">
                <el-skeleton animated :rows="3" />
              </el-card>
            </div>
          </template>
          <transition name="fade-list" v-else><div class="posts" ref="postsRef">
            <el-card v-for="p in pagedPosts" :key="p.id" class="post">
              <div class="post-header">
                <div class="author" @click="goProfile(p.author?.id)"><img :src="p.author?.avatarUrl" class="avatar" /><span class="name">{{ p.author?.username || '匿名' }}</span></div>
                <h4 class="title" @click="goPost(p.id)">{{ p.title }}</h4>
                <div class="tags"><el-tag v-for="t in p.tags" :key="t" size="small" class="post-tag">{{ t }}</el-tag></div>
              </div>
              <p class="content" @click="goPost(p.id)">{{ p.content }}</p>
              <div class="images"><img v-for="(u,i) in p.images" :key="u" :src="u" class="image" @click="goImage(p.id,i)" /></div>
              <div class="post-actions">
                <el-button link size="small" :class="{ 'liked': p.liked }" @click="toggleLike(p)">
                  <el-icon :size="20" class="action-icon">
                    <svg v-if="p.liked" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path fill="currentColor" d="M923 283.6a260.04 260.04 0 0 0-56.9-82.8 264.4 264.4 0 0 0-84-55.5A260 260 0 0 0 679.7 125c-49.3 0-97.4 13.5-139.2 39-10 6.1-19.5 12.8-28.5 20.1-9-7.3-18.5-14-28.5-20.1-41.8-25.5-89.9-39-139.2-39-35.5 0-69.9 6.8-102.4 20.3-31.4 13-59.7 31.7-84 55.5a258.44 258.44 0 0 0-56.9 82.8c-13.9 32.3-21 66.6-21 101.9 0 33.3 6.8 68 20.3 103.3 11.3 29.5 27.5 60.1 48.2 91 32.8 48.9 77.9 99.9 133.9 151.6 92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3 56-51.7 101.1-102.7 133.9-151.6 20.7-30.9 37-61.5 48.2-91 13.5-35.3 20.3-70 20.3-103.3.1-35.3-7-69.6-20.9-101.9z"/></svg>
                    <svg v-else viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path fill="currentColor" d="M699.6 148.8c-76.8 0-146.4 40.8-187.6 102.4C470.4 189.6 401.2 148.8 324 148.8 194.8 148.8 90 253.6 90 382.8c0 178 184.4 330 384.4 468.4 12.8 8.8 29.2 8.8 42 0C739.2 702.4 934 544.4 934 382.8c-0.4-129.2-105.2-234-234.4-234z m0-64c164.4 0 298.4 133.6 298.4 298 0 205.6-224.4 394-472.4 559.6-9.2 6-21.2 6-30.4 0C247.2 776.8 26 588.4 26 382.8 26 218.4 160 84.8 324.4 84.8c92 0 174.4 42 228.4 107.2 54-65.2 136.4-107.2 228.4-107.2z" transform="scale(0.9) translate(50,50)"/></svg>
                  </el-icon>
                  <span class="count">{{ p.likes }}</span>
                </el-button>
                <el-button link size="small" :class="{ 'favorited': p.favorited }" @click="toggleFavorite(p)">
                  <el-icon :size="20" class="action-icon">
                    <StarFilled v-if="p.favorited" />
                    <Star v-else />
                  </el-icon>
                  <span class="count">{{ p.favorites ?? 0 }}</span>
                </el-button>
                <el-button link size="small" @click="sharePost(p)">
                  <el-icon :size="18" class="action-icon"><Share /></el-icon>
                  <span class="count">分享</span>
                </el-button>
                <el-button link size="small" @click="openComments(p)">
                  <el-icon :size="18" class="action-icon"><ChatLineSquare /></el-icon>
                  <span class="count">{{ commentCount(p) }}</span>
                </el-button>
              </div>
              <div v-if="p.showComment" class="comments">
                <CommentItem v-for="(c,i) in (p.comments||[])" :key="i" :comment="c" />
                <div class="comment-editor"><el-input v-model="p.newComment" placeholder="写下评论" /><el-button size="small" type="primary" @click="addComment(p)">发送</el-button></div>
              </div>
            </el-card>
          </div></transition>
          <div v-if="!loading && filteredPosts.length === 0" class="empty">暂无帖子，去发布一条吧</div>
          <div class="pagination"><el-pagination background layout="prev, pager, next" :page-size="pageSize" :total="filteredPosts.length" v-model:current-page="page" /></div>
        </main>
        <aside class="right">
          <el-card class="hot"><h4>热门帖子</h4><ol class="hot-list"><li v-for="(h,i) in hotPosts" :key="h.id" @click="goPost(h.id)">{{ i+1 }}. {{ h.title }}</li></ol></el-card>
          <el-card class="recent"><h4>近期分享者</h4><div class="users"><div class="user" v-for="u in recentUsers" :key="u.id" @click="goProfile(u.id)"><img :src="u.avatarUrl" class="avatar" /><div class="uinfo"><div class="uname">{{ u.username }}</div><div class="uextra">帖子 {{ u.postCount }} | 获赞 {{ u.likeCount }}</div></div></div></div></el-card>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, EditPen, Star, StarFilled, ChatLineSquare, User, Share } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getCommunityPosts, getCommunityRecentUsers, likeCommunityPost, commentCommunityPost, getMyCommunityPosts, favoriteCommunityPost, getUserStats, getCommunityPostComments } from '@/api'
import { getCommunityPost } from '@/api'
import CommentItem from '@/components/CommentItem.vue'

const tagOptions = ['插画', '风景', '极简', '赛博', '像素', '摄影']
const seed = [
  {
    id: 1,
    title: '赛博朋克光影练习',
    content: '分享近期光影练习与配色方案，欢迎交流。',
    tags: ['赛博','配色'],
    images: ['https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&h=400&fit=crop&crop=center'],
    author: { id: 100, username: 'Neo', avatarUrl: 'https://i.pravatar.cc/80?img=12' },
    likes: 12,
    liked: false,
    comments: ['很酷','色彩很棒'],
    newComment: '',
    showComment: false
  },
  {
    id: 2,
    title: '自然风景系列壁纸',
    content: '记录旅行中的风景，整理为移动端壁纸。',
    tags: ['风景','摄影'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&crop=center'],
    author: { id: 101, username: 'Luna', avatarUrl: 'https://i.pravatar.cc/80?img=21' },
    likes: 8,
    liked: false,
    comments: ['太治愈了'],
    newComment: '',
    showComment: false
  }
]
const posts = ref([])
const userStore = useUserStore()
const isAuthenticated = computed(() => userStore.isAuthenticated)
const displayName = computed(() => userStore.info?.nickname || userStore.info?.username || '请先登录')
const signature = computed(() => userStore.info?.signature || userStore.info?.bio || '登录后可发布内容')
const avatarUrl = computed(() => userStore.info?.avatarUrl || 'https://i.pravatar.cc/80?u=user')
const q = ref('')
const tag = ref('')
const page = ref(1)
const pageSize = ref(5)
const filteredPosts = computed(() => {
  const text = q.value.trim().toLowerCase()
  return posts.value.filter(p => {
    const matchText = !text || p.title.toLowerCase().includes(text) || p.content.toLowerCase().includes(text)
    const matchTag = !tag.value || p.tags.includes(tag.value)
    return matchText && matchTag
  })
})
const pagedPosts = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredPosts.value.slice(start, start + pageSize.value)
})
const myStat = ref({ posts: 0, likes: 0, comments: 0 })
const hotPostsSource = ref([])
const hotPosts = computed(() => hotPostsSource.value)
const recentUsersSource = ref([])
const recentUsers = computed(() => recentUsersSource.value)
const loadHot = async () => {
  try {
    const hot = await getCommunityPosts({ page: 1, size: 5, sort: 'popular', includeCounts: true })
    hotPostsSource.value = hot.items || []
  } catch {}
}
const loadRecentUsers = async () => {
  try { recentUsersSource.value = await getCommunityRecentUsers() } catch {}
}
loadHot(); loadRecentUsers()

// 持久化到本地，供详情页读取
const loading = ref(false)

const applyInteractions = () => {
    posts.value = (posts.value || []).map(p => {
      p.liked = !!p.liked
      p.favorited = !!p.favorited
      // Ensure likes/comments/favorites are Numbers. If null/undefined, default to 0.
      p.likes = typeof p.likes === 'number' ? p.likes : 0
      p.favorites = typeof p.favorites === 'number' ? p.favorites : 0
      p.commentsCount = typeof p.commentsCount === 'number' ? p.commentsCount : 0
      return p
    })
  }

const loadPosts = async () => {
  loading.value = true
  try {
    const list = await getCommunityPosts({ page: page.value, size: pageSize.value, q: q.value || undefined, tag: tag.value || undefined, sort: 'latest', includeCounts: true })
    posts.value = list.items || []
    applyInteractions()
  } finally { loading.value = false }
}
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
watch(isAuthenticated, (v) => { if (v) loadMyStats(); else myStat.value = { posts: 0, likes: 0, comments: 0 } })
const handlePublishClick = () => {
  if (!isAuthenticated.value) {
    ElMessage.warning('请先登录后再发布')
    window.dispatchEvent(new CustomEvent('auth-required'))
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
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view') })
  }, { threshold: 0.12 })
})

watch([pagedPosts, loading], async () => {
  await nextTick()
  if (!postsRef.value || !io || loading.value) return
  const cards = postsRef.value.querySelectorAll('.post')
  cards.forEach(c => io.observe(c))
})

const toggleLike = async (p) => {
  const prev = { liked: p.liked, likes: p.likes }
  // Optimistic update
  p.liked = !p.liked
  p.likes = (prev.likes || 0) + (p.liked ? 1 : -1)
  
  try {
    const r = await likeCommunityPost(p.id)
    if (r && typeof r === 'object') {
      // Backend should return the definitive state
      if (typeof r.liked !== 'undefined') p.liked = !!r.liked
      if (typeof r.likes !== 'undefined') p.likes = r.likes
    }
    ElMessage.success(p.liked ? '点赞成功' : '已取消点赞')
  } catch {
    // Revert on error
    p.liked = prev.liked; p.likes = prev.likes; ElMessage.error('点赞失败')
  }
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
      p.comments = res.items || []
      // Update count if server returns a total count
      if (typeof res.total !== 'undefined') p.commentsCount = res.total
    } catch {}
  }
}

const commentCount = (p) => p.commentsCount || p.comments?.length || 0

const toggleFavorite = async (p) => {
  const prev = { favorited: p.favorited, favorites: p.favorites }
  // Optimistic update
  p.favorited = !p.favorited
  p.favorites = (prev.favorites || 0) + (p.favorited ? 1 : -1)
  try {
    const r = await favoriteCommunityPost(p.id)
    if (r && typeof r === 'object') {
       if (typeof r.favorited !== 'undefined') p.favorited = !!r.favorited
       if (typeof r.favorites !== 'undefined') p.favorites = r.favorites
    }
    ElMessage.success(p.favorited ? '已收藏' : '已取消收藏')
  } catch { p.favorited = prev.favorited; p.favorites = prev.favorites; ElMessage.error('收藏失败') }
}

const sharePost = async (p) => {
  const url = `${location.origin}/community/post/${p.id}`
  try {
    if (navigator.share) {
      await navigator.share({ title: p.title, text: (p.content || '').slice(0, 80), url })
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url)
      ElMessage.success('链接已复制到剪贴板')
    } else {
      const inp = document.createElement('input')
      inp.value = url
      document.body.appendChild(inp)
      inp.select(); document.execCommand('copy')
      document.body.removeChild(inp)
      ElMessage.success('链接已复制到剪贴板')
    }
  } catch (e) {
    ElMessage.error('分享失败：' + (e.message || '未知错误'))
  }
}

// 跳转函数
import { useRouter } from 'vue-router'
const router = useRouter()
const goPost = (id) => { router.push(`/community/post/${id}`) }
const goImage = (id, index) => { router.push(`/community/post/${id}/image/${index}`) }
const goProfile = (uid) => {
  if (!uid) return
  const myId = userStore.info?.id
  if (myId && String(myId) === String(uid)) router.push('/user')
  else router.push(`/profile/${uid}`)
}

const currentAvatar = 'https://i.pravatar.cc/80?u=community'

watch(() => userStore.info?.id, async () => { await loadPosts(); })

const refreshPost = async (id) => {
  try {
    const fresh = await getCommunityPost(id)
    const idx = posts.value.findIndex(x => String(x.id) === String(id))
    if (idx >= 0) { posts.value[idx] = { ...posts.value[idx], ...fresh }; applyInteractions() }
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

/* Right Sidebar */
.right { display: flex; flex-direction: column; gap: 16px; }
.hot, .recent {
  border-radius: 12px;
  background: linear-gradient(var(--app-bg-card), var(--app-bg-card)) padding-box,
              linear-gradient(135deg, var(--app-brand-gradient-start), var(--app-brand-gradient-end)) border-box;
  border: 1px solid transparent;
  color: var(--app-text-main);
}
.hot h4, .recent h4 { margin: 0 0 12px 0; font-size: 1rem; font-weight: 600; }

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
.user {
  display: flex; align-items: center; gap: 10px;
  padding: 8px;
  border-radius: 8px;
  background: var(--app-accent-bg-soft);
  border: 1px solid var(--app-accent-border);
  cursor: pointer;
  transition: transform 0.2s;
  color: var(--app-text-main);
}
.user:hover { transform: translateX(4px); background: var(--app-bg-hover); }
.user .avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.user .uinfo { flex: 1; min-width: 0; }
.user .uname { font-weight: 500; font-size: 0.9rem; color: var(--app-text-main); margin-bottom: 2px; }
.user .uextra { font-size: 0.75rem; color: var(--app-text-secondary); }

/* Animation */
.post { opacity: 0; transform: translateY(10px); }
.post.in-view { opacity: 1; transform: translateY(0); transition: opacity .4s ease, transform .4s ease; }
.fade-list-enter-active, .fade-list-leave-active { transition: opacity .25s ease; }
.fade-list-enter-from, .fade-list-leave-to { opacity: 0; }

@media (max-width: 900px) {
  .grid { grid-template-columns: 1fr; }
  .images { grid-template-columns: repeat(3, 1fr); }
  .left, .right { display: none; }
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
</style>
