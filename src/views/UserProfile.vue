<template>
  <div class="profile">
    <div class="container" v-if="userId">
      <div class="header">
        <el-avatar :size="80" :src="avatarUrl" class="avatar-lg">
           {{ username?.charAt(0)?.toUpperCase() }}
        </el-avatar>
        <div class="meta">
          <div class="name">{{ username }}</div>
          <div class="desc">公开分享</div>
        </div>
        <div class="follow-area" v-if="!isSelf">
          <el-button 
            :type="isFollowing ? 'default' : 'primary'" 
            round
            @click="toggleFollow"
          >
            {{ isFollowing ? '已关注' : '关注' }}
          </el-button>
          <span class="followers">粉丝 {{ followersCount }}</span>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="profile-tabs">
        <el-tab-pane label="TA的帖子" name="posts">
          <div class="posts-list" v-loading="loadingProfile">
            <div v-for="p in userPosts" :key="p.id" class="post-card">
              <div class="post-header">
                <div class="author">
                  <el-avatar :size="32" :src="p.author?.avatarUrl || avatarUrl" class="avatar-sm">
                    {{ (p.author?.username || username)?.charAt(0)?.toUpperCase() }}
                  </el-avatar>
                  <span class="name">{{ p.author?.username || username }}</span>
                  <span class="time">{{ formatDate(p.createdAt) }}</span>
                </div>
              </div>
              <h4 class="post-title" @click="goPost(p.id)">{{ p.title }}</h4>
              <p class="post-content" @click="goPost(p.id)">{{ p.content }}</p>
              <div class="post-images" v-if="p.images && p.images.length">
                <img 
                  v-for="(img, idx) in p.images.slice(0, 4)" 
                  :key="idx" 
                  :src="img" 
                  class="post-img" 
                  @click.stop="goImage(p.id, idx)" 
                />
              </div>
              <div class="post-footer">
                <div class="tags-list">
                  <span class="tag" v-for="t in p.tags" :key="t">#{{ t }}</span>
                </div>
                <div class="stats">
                  <span><el-icon><Star /></el-icon> {{ p.likes || 0 }}</span>
                  <span><el-icon><ChatLineSquare /></el-icon> {{ p.commentsCount || 0 }}</span>
                </div>
              </div>
            </div>
            <div v-if="!loadingProfile && userPosts.length === 0" class="empty-state">
              <el-empty description="TA还没有发布任何作品" />
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="点赞的帖子" name="likes">
          <div class="wallpaper-grid" v-loading="loadingLikes">
            <UnifiedCard 
              v-for="p in likedPosts" 
              :key="p.id" 
              :title="p.title" 
              :cover="p.images?.[0]" 
              :images="p.images || []"
              :image-count="p.images?.length || 0"
              :subtitle="p.author?.username || ''" 
              :to="String(`/community/post/${p.id}`)" 
              :likes="p.likes"
              :no-actions="true"
            />
          </div>
          <div v-if="!loadingLikes && likedPosts.length === 0" class="empty-state">
            <el-empty description="TA还没有点赞任何帖子" />
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="收藏的帖子" name="favorites">
          <div class="wallpaper-grid" v-loading="loadingFavorites">
            <UnifiedCard 
              v-for="p in favoritePosts" 
              :key="p.id" 
              :title="p.title" 
              :cover="p.images?.[0] || p.cover" 
              :images="p.images || (p.cover ? [p.cover] : [])"
              :image-count="p.images?.length || (p.cover ? 1 : 0)"
              :subtitle="p.author?.username || ''" 
              :to="String(`/community/post/${p.id}`)" 
              :likes="p.likes" 
              :favorites="p.favorites"
              :no-actions="true"
            />
          </div>
          <div v-if="!loadingFavorites && favoritePosts.length === 0" class="empty-state">
            <el-empty description="TA还没有收藏任何帖子" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Star, ChatLineSquare } from '@element-plus/icons-vue'
import { getUserProfile, getUserCommunityPosts, getMyCommunityPosts, getUserLikes, getUserPostFavorites, getOtherUserLikedPosts, getOtherUserPostFavorites, followUser, unfollowUser } from '@/api'
import { useUserStore } from '@/store/user'
import UnifiedCard from '@/components/UnifiedCard.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { normalizePagedResult, normalizePost } from '@/utils'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const userId = route.params.id
const userPosts = ref([])
const likedPosts = ref([])
const favoritePosts = ref([])
const activeTab = ref('posts')
const username = ref('用户')
const avatarUrl = ref('')
const isSelf = ref(false)
const isFollowing = ref(false)
const followersCount = ref(0)

const isMounted = ref(true)
onBeforeUnmount(() => {
  isMounted.value = false
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const normalizePostPage = (response) => normalizePagedResult(response, normalizePost).items

const profileState = useAsyncState(async () => {
  isSelf.value = userStore.info?.id && String(userStore.info.id) === String(userId)

  try {
    if (!isSelf.value) {
      const profile = await getUserProfile(userId)
      if (!isMounted.value) return userPosts.value
      username.value = profile.nickname || profile.username || '用户'
      avatarUrl.value = profile.avatarUrl || ''
      isFollowing.value = !!profile.isFollowing
      followersCount.value = profile.stats?.followersCount ?? profile.followersCount ?? 0
    } else {
      username.value = userStore.info?.nickname || userStore.info?.username || '我'
      avatarUrl.value = userStore.info?.avatarUrl || ''
      followersCount.value = userStore.info?.stats?.followersCount ?? 0
    }
  } catch (e) {
    console.error('Failed to load profile', e)
  }

  const res = isSelf.value
    ? await getMyCommunityPosts({ page: 1, size: 20 })
    : await getUserCommunityPosts(userId, { page: 1, size: 20 })
  if (!isMounted.value) return userPosts.value

  userPosts.value = normalizePostPage(res)

  if ((!username.value || username.value === '用户') && userPosts.value.length > 0) {
    const author = userPosts.value[0]?.author
    if (author) {
      username.value = author.nickname || author.username || '用户'
      avatarUrl.value = author.avatarUrl || ''
    }
  }

  return userPosts.value
}, { initialData: [] })

const likesState = useAsyncState(async () => {
  const likes = isSelf.value
    ? await getUserLikes({ page: 1, size: 20 })
    : await getOtherUserLikedPosts(userId, { page: 1, size: 20 })
  if (!isMounted.value) return likedPosts.value
  likedPosts.value = normalizePostPage(likes)
  return likedPosts.value
}, { initialData: [] })

const favoritesState = useAsyncState(async () => {
  const favorites = isSelf.value
    ? await getUserPostFavorites({ page: 1, size: 20 })
    : await getOtherUserPostFavorites(userId, { page: 1, size: 20 })
  if (!isMounted.value) return favoritePosts.value
  favoritePosts.value = normalizePostPage(favorites)
  return favoritePosts.value
}, { initialData: [] })

const loadingProfile = profileState.loading
const loadingLikes = likesState.loading
const loadingFavorites = favoritesState.loading

onMounted(async () => {
  try {
    await profileState.run()
  } catch (e) {
    if (!isMounted.value) return
    ElMessage.error(e.response?.data?.message || '加载用户公开帖子失败')
  }

  try {
    await likesState.run()
  } catch {}

  try {
    await favoritesState.run()
  } catch {}
})

const goPost = (id) => router.push(`/community/post/${id}`)
const goImage = (id, index) => router.push(`/community/post/${id}/image/${index}`)
const toggleFollow = async () => {
  try {
    if (isFollowing.value) { 
      await unfollowUser(userId)
      if (!isMounted.value) return
      isFollowing.value = false
      followersCount.value = Math.max(0, followersCount.value - 1) 
    } else { 
      await followUser(userId)
      if (!isMounted.value) return
      isFollowing.value = true
      followersCount.value = followersCount.value + 1 
    }
  } catch {}
}
</script>

<style scoped>
.profile {
  padding: 30px 0;
  min-height: 80vh;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 40px;
  background: var(--app-bg-card);
  padding: 30px;
  border-radius: 16px;
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow-sm);
}

.avatar-lg {
  border: 4px solid var(--app-bg-base);
  box-shadow: var(--app-shadow-sm);
}

.meta {
  flex: 1;
}

.name {
  font-size: 24px;
  font-weight: 700;
  color: var(--app-text-main);
  margin-bottom: 8px;
}

.desc {
  color: var(--app-text-secondary);
  font-size: 14px;
}

.follow-area {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.followers {
  font-size: 13px;
  color: var(--app-text-secondary);
}

/* Tabs */
.profile-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  color: var(--app-text-secondary);
}
.profile-tabs :deep(.el-tabs__item.is-active) {
  color: var(--app-color-primary);
  font-weight: 600;
}
.profile-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: var(--app-border);
}

/* Grid Layout for UnifiedCard */
.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 10px 0;
}

/* Post List Styles */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.post-card {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 24px;
  background: var(--app-bg-card);
  transition: all 0.3s ease;
}

.post-card:hover {
  box-shadow: var(--app-shadow-hover);
  transform: translateY(-2px);
}

.post-header {
  margin-bottom: 16px;
}

.author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-sm {
  border: 1px solid var(--app-border);
}

.author .name {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}

.author .time {
  font-size: 13px;
  color: var(--app-text-secondary);
  margin-left: auto;
}

.post-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--app-text-main);
  cursor: pointer;
  line-height: 1.4;
}
.post-title:hover {
  color: var(--app-color-primary);
}

.post-content {
  color: var(--app-text-main);
  font-size: 15px;
  margin: 0 0 16px 0;
  line-height: 1.6;
  opacity: 0.9;
  cursor: pointer;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.post-img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  cursor: zoom-in;
  transition: transform 0.3s ease;
  border: 1px solid var(--app-border);
}

.post-img:hover {
  transform: scale(1.02);
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--app-border);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  color: var(--app-color-primary);
  font-size: 13px;
  background: var(--app-bg-base);
  padding: 2px 8px;
  border-radius: 4px;
}

.stats {
  display: flex;
  gap: 20px;
  color: var(--app-text-secondary);
  font-size: 14px;
}

.stats span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }
  
  .follow-area {
    align-items: center;
    margin-top: 10px;
  }
  
  .wallpaper-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .post-images {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .post-img {
    height: 140px;
  }
}

@media (max-width: 480px) {
  .wallpaper-grid {
    grid-template-columns: 1fr;
  }
}
</style>
