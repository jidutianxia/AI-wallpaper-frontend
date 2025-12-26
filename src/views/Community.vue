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
              <div class="stat-item"><span class="stat-icon"><svg viewBox="0 0 24 24" class="thumb-svg" aria-hidden="true"><path d="M2 21h4a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H2v11zM22 9h-6.31l.95-4.57A2 2 0 0 0 14.69 2L9 8v11h9a2 2 0 0 0 2-2l1-7a2 2 0 0 0-2-2z" fill="currentColor"/></svg></span><div class="stat-val">{{ isAuthenticated ? myStat.likes : 0 }}</div><div class="stat-label">获赞</div></div>
              <div class="stat-item"><el-icon class="stat-icon"><ChatLineSquare /></el-icon><div class="stat-val">{{ isAuthenticated ? myStat.comments : 0 }}</div><div class="stat-label">评论</div></div>
            </div>
          </el-card>
        </aside>
        <main class="center">
          <div class="filters">
            <el-input v-model="q" placeholder="搜索标题或内容" class="filter-input" />
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
                <div class="tags"><el-tag v-for="t in p.tags" :key="t" size="small">{{ t }}</el-tag></div>
              </div>
              <p class="content" @click="goPost(p.id)">{{ p.content }}</p>
              <div class="images"><img v-for="(u,i) in p.images" :key="u" :src="u" class="image" @click="goImage(p.id,i)" /></div>
              <div class="post-actions">
                <el-button aria-label="点赞" size="small" :type="p.liked ? 'primary' : undefined" @click="toggleLike(p)"><svg viewBox="0 0 24 24" class="btn-icon thumb-svg" aria-hidden="true"><path d="M2 21h4a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H2v11zM22 9h-6.31l.95-4.57A2 2 0 0 0 14.69 2L9 8v11h9a2 2 0 0 0 2-2l1-7a2 2 0 0 0-2-2z" fill="currentColor"/></svg> 点赞 {{ p.likes ?? 0 }}</el-button>
                <el-button aria-label="收藏" size="small" :type="p.favorited ? 'warning' : ''" @click="toggleFavorite(p)">{{ p.favorited ? '★' : '☆' }} 收藏</el-button>
                <el-button aria-label="分享" size="small" @click="sharePost(p)"><svg viewBox="0 0 24 24" class="btn-icon plane-svg" aria-hidden="true"><path d="M2 12l20-8-8 9 8 9-20-8 7-2 0 0z" fill="currentColor"/></svg> 分享</el-button>
                <el-button aria-label="评论" size="small" class="pill-btn" @click="openComments(p)"><el-icon class="btn-icon"><ChatLineSquare /></el-icon> 评论 {{ commentCount(p) }}</el-button>
              </div>
              <div v-if="p.showComment" class="comments">
                <CommentItem v-for="(c,i) in (p.comments||[])" :key="i" :comment="c" />
                <div class="comment-editor"><el-input v-model="p.newComment" placeholder="写下评论" /><el-button size="small" type="primary" @click="addComment(p)">发布</el-button></div>
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
import { Plus, EditPen, StarFilled, ChatLineSquare, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getCommunityPosts, getCommunityRecentUsers, likeCommunityPost, commentCommunityPost, getMyCommunityPosts, favoriteCommunityPost, getUserStats, getCommunityPostComments } from '@/api/wallpaper'
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
const signature = computed(() => userStore.info?.bio || '登录后可发布内容')
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
      // Ensure likes/comments are Numbers. If null/undefined, default to 0.
      p.likes = typeof p.likes === 'number' ? p.likes : 0
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
  const prev = p.favorited
  // Optimistic update
  p.favorited = !p.favorited
  try {
    const r = await favoriteCommunityPost(p.id)
    if (r && typeof r === 'object' && typeof r.favorited !== 'undefined') {
      p.favorited = !!r.favorited
    }
    ElMessage.success(p.favorited ? '已收藏' : '已取消收藏')
  } catch { p.favorited = prev; ElMessage.error('收藏失败') }
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
import { getCommunityPost } from '@/api/wallpaper'
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
.profile-card { background: linear-gradient(180deg, rgba(147,197,253,.08), rgba(147,197,253,0)); border: 1px solid rgba(148,163,184,.18); box-shadow: 0 8px 24px rgba(0,0,0,.08); }
.profile-top { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; padding-bottom: 8px; }
.profile-top.clickable { cursor: pointer; }
.avatar-lg { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; box-shadow: 0 6px 18px rgba(0,0,0,.12); }
.avatar-lg.placeholder { display:flex; align-items:center; justify-content:center; background:#f5f7fa; color:#9aa0a6; }
.creator-name { font-weight: 600; }
.creator-desc { font-size: 12px; opacity: .8; }
.publish-btn { box-shadow: 0 6px 18px rgba(64,158,255,.35); }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding-top: 8px; }
.stat-item { display: grid; justify-items: center; padding: 10px 6px; border-radius: 10px; background: rgba(255,255,255,.6); }
.stat-icon { font-size: 18px; opacity: .8; }
.thumb-svg { width: 18px; height: 18px; color: #9aa0a6; }
.plane-svg { width: 16px; height: 16px; color: #9aa0a6; }
.btn-icon { width: 16px; height: 16px; margin-right: 4px; }
.stat-val { font-size: 1.2rem; font-weight: 700; }
.stat-label { font-size: 12px; opacity: .8; }
.dark .community :deep(.el-card) { background:#1f2937; border-color:#374151; color:#e5e7eb; }
.dark .community .profile-card { background:#1f2937; border-color:#374151; }
.dark .community .stat-item { background: rgba(31,41,55,.6); color:#e5e7eb; }
.dark .community .thumb-svg { color:#9ca3af; }
.profile-card { background: linear-gradient(180deg, rgba(147,197,253,.08), rgba(147,197,253,0)); border: 1px solid rgba(148,163,184,.18); box-shadow: 0 8px 24px rgba(0,0,0,.08); }
.profile-top { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; padding-bottom: 8px; }
.avatar-lg { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; box-shadow: 0 6px 18px rgba(0,0,0,.12); }
.creator-name { font-weight: 600; }
.creator-desc { font-size: 12px; opacity: .8; }
.publish-btn { box-shadow: 0 6px 18px rgba(64,158,255,.35); }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding-top: 8px; }
.stat-item { display: grid; justify-items: center; padding: 10px 6px; border-radius: 10px; background: rgba(255,255,255,.6); }
.stat-icon { font-size: 18px; opacity: .8; }
.stat-val { font-size: 1.2rem; font-weight: 700; }
.stat-label { font-size: 12px; opacity: .8; }
.filters { display: flex; gap: 12px; margin-bottom: 12px; }
.filter-input { flex: 1; }
.filter-select { width: 160px; }
.composer { margin-bottom: 2rem; }
.stats { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 16px; }
.stat { display: grid; justify-items: center; padding: 8px 0; border-radius: 8px; }
.num { font-size: 1.4rem; font-weight: 700; }
.label { opacity: 0.8; }
.upload { margin-top: 0.5rem; }
.actions { display: flex; gap: 12px; justify-content: flex-end; }
.posts { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.post-header { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; }
.author { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
.avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.name { font-size: 0.9rem; opacity: 0.9; }
.images { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px; }
.image { width: 100%; height: 140px; object-fit: cover; border-radius: 8px; }
.post-actions { display: flex; gap: 8px; margin-top: 8px; }
.comments { margin-top: 8px; display: grid; gap: 8px; }
.comment-editor { display: flex; gap: 8px; }
.pagination { display: flex; justify-content: center; margin-top: 12px; }
.right .hot-list { list-style: none; padding: 0; margin: 8px 0 0; display: grid; gap: 8px; }
.users { display: grid; gap: 10px; }
.user { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.uinfo { display: grid; }
.hot, .recent { border: 1px solid transparent; border-radius: 12px; background: linear-gradient(#ffffff,#ffffff) padding-box, linear-gradient(135deg, var(--brand-gradient-start), var(--brand-gradient-end)) border-box; }
.dark .hot, .dark .recent { background: linear-gradient(#1f2937,#1f2937) padding-box, linear-gradient(135deg, var(--brand-gradient-start), var(--brand-gradient-end)) border-box; }
.hot h4, .recent h4 { margin: 0 0 8px 0; }
.hot-list li { padding: 6px 12px; border-radius: 999px; background: rgba(147,197,253,.18); border: 1px solid rgba(147,197,253,.35); color:#1f2937; transition: transform .2s ease, box-shadow .2s ease; }
.hot-list li:hover { transform: translateX(2px); box-shadow: 0 8px 20px rgba(37,99,235,.15); }
.dark .hot-list li { background: rgba(30,64,175,.28); border-color: rgba(59,130,246,.4); color:#e5e7eb; }
.users .user { padding: 6px 10px; border-radius: 999px; background: rgba(147,197,253,.12); border: 1px solid rgba(147,197,253,.28); transition: transform .2s ease, box-shadow .2s ease; }
.users .user:hover { transform: translateX(2px); box-shadow: 0 8px 20px rgba(37,99,235,.15); }
.dark .users .user { background: rgba(30,64,175,.22); border-color: rgba(59,130,246,.35); }
@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
  .images { grid-template-columns: repeat(2, 1fr); }
}
.post { border: 1px solid transparent; border-radius: 12px; background: linear-gradient(#ffffff,#ffffff) padding-box, linear-gradient(135deg, var(--brand-gradient-start), var(--brand-gradient-end)) border-box; transition: transform .2s ease, box-shadow .2s ease; }
.dark .post { background: linear-gradient(#1f2937,#1f2937) padding-box, linear-gradient(135deg, var(--brand-gradient-start), var(--brand-gradient-end)) border-box; }
/* in-view animation */
.post { opacity: 0; transform: translateY(6px); }
.post.in-view { opacity: 1; transform: translateY(0); transition: opacity .35s ease, transform .35s ease; }
.fade-list-enter-active, .fade-list-leave-active { transition: opacity .25s ease; }
.fade-list-enter-from, .fade-list-leave-to { opacity: 0; }
.post:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(0,0,0,.12); }
.dark .post:hover { box-shadow: 0 10px 24px rgba(0,0,0,.35); }
:deep(.el-tag) { border-radius: 999px; padding: 0 10px; background: rgba(147,197,253,.18); border: 1px solid rgba(147,197,253,.35); color: #1f2937; }
.dark :deep(.el-tag) { background: rgba(30,64,175,.28); border-color: rgba(59,130,246,.4); color: #e5e7eb; }
.image:hover { transform: scale(1.02); transition: transform .2s ease; }
</style>
watch(() => userStore.info?.id, async () => { loadInteractions(); await loadPosts(); })
import { getCommunityPost } from '@/api/wallpaper'
const refreshPost = async (id) => {
  try {
    const fresh = await getCommunityPost(id)
    const idx = posts.value.findIndex(x => String(x.id) === String(id))
    if (idx >= 0) { posts.value[idx] = { ...posts.value[idx], ...fresh }; applyInteractions() }
  } catch {}
}
