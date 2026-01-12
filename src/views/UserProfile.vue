<template>
  <div class="profile">
    <div class="container" v-if="userId">
      <div class="header">
        <img :src="avatarUrl" class="avatar" />
        <div class="meta">
          <div class="name">{{ username }}</div>
          <div class="desc">公开分享</div>
        </div>
        <div class="follow-area" v-if="!isSelf">
          <el-button type="primary" size="small" @click="toggleFollow">{{ isFollowing ? '已关注' : '关注' }}</el-button>
          <span class="followers">粉丝 {{ followersCount }}</span>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="profile-tabs">
        <el-tab-pane label="TA的帖子" name="posts">
          <div class="posts" v-if="loadingProfile">
            <el-card v-for="i in 3" :key="i" class="post"><el-skeleton animated :rows="3" /></el-card>
          </div>
          <div class="posts" v-else>
            <el-card v-for="p in userPosts" :key="p.id" class="post">
              <div class="post-head">
                <h4 class="title" @click="goPost(p.id)">{{ p.title }}</h4>
                <div class="meta-right">
                  <span class="count">👍 {{ Number(p.likes || 0) }}</span>
                  <span class="count">💬 {{ Number(p.commentsCount || 0) }}</span>
                </div>
              </div>
              <div class="tags">
                <el-tag v-for="t in p.tags" :key="t" size="small">{{ t }}</el-tag>
              </div>
              <p class="content">{{ p.content }}</p>
              <div class="images">
                <img v-for="(u,i) in p.images" :key="u" :src="u" class="image" @click="goImage(p.id,i)" />
              </div>
            </el-card>
          </div>
        </el-tab-pane>
        <el-tab-pane label="点赞的帖子" name="likes">
          <div class="posts" v-if="loadingLikes">
            <el-card v-for="i in 2" :key="i" class="post"><el-skeleton animated :rows="3" /></el-card>
          </div>
          <div class="posts" v-else>
            <el-card v-for="p in likedPosts" :key="p.id" class="post">
              <div class="post-head">
                <h4 class="title" @click="goPost(p.id)">{{ p.title }}</h4>
                <div class="meta-right">
                  <span class="count">👍 {{ Number(p.likes || 0) }}</span>
                  <span class="count">💬 {{ Number(p.commentsCount || 0) }}</span>
                </div>
              </div>
              <div class="tags">
                <el-tag v-for="t in p.tags" :key="t" size="small">{{ t }}</el-tag>
              </div>
              <p class="content">{{ p.content }}</p>
              <div class="images">
                <img v-for="(u,i) in p.images" :key="u" :src="u" class="image" @click="goImage(p.id,i)" />
              </div>
            </el-card>
            <div v-if="likedPosts.length === 0" class="empty">暂无点赞的帖子</div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="收藏的帖子" name="favorites">
          <div class="posts" v-if="loadingFavorites">
            <el-card v-for="i in 2" :key="i" class="post"><el-skeleton animated :rows="3" /></el-card>
          </div>
          <div class="posts" v-else>
            <el-card v-for="p in favoritePosts" :key="p.id" class="post">
              <div class="post-head">
                <h4 class="title" @click="goPost(p.id)">{{ p.title }}</h4>
                <div class="meta-right">
                  <span class="count">👍 {{ Number(p.likes || 0) }}</span>
                  <span class="count">💬 {{ Number(p.commentsCount || 0) }}</span>
                </div>
              </div>
              <div class="tags">
                <el-tag v-for="t in p.tags" :key="t" size="small">{{ t }}</el-tag>
              </div>
              <p class="content">{{ p.content }}</p>
              <div class="images">
                <img v-for="(u,i) in p.images" :key="u" :src="u" class="image" @click="goImage(p.id,i)" />
              </div>
            </el-card>
            <div v-if="favoritePosts.length === 0" class="empty">暂无收藏的帖子</div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserCommunityPosts, getMyCommunityPosts, getUserLikes, getUserPostFavorites, getOtherUserLikedPosts, getOtherUserPostFavorites, getFollowState, followUser, unfollowUser, getFollowersCount } from '@/api/wallpaper'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const userId = route.params.id
const userPosts = ref([])
const likedPosts = ref([])
const favoritePosts = ref([])
const loadingProfile = ref(true)
const loadingLikes = ref(true)
const loadingFavorites = ref(true)
const activeTab = ref('posts')
const username = ref('用户')
const avatarUrl = ref('')
const isSelf = ref(false)
const isFollowing = ref(false)
const followersCount = ref(0)

onMounted(async () => {
  try {
    isSelf.value = userStore.info?.id && String(userStore.info.id) === String(userId)
    const res = isSelf.value ? await getMyCommunityPosts({ page: 1, size: 20 }) : await getUserCommunityPosts(userId, { page: 1, size: 20 })
    userPosts.value = res.items || []
    const a = userPosts.value[0]?.author
    if (a) {
      username.value = a.nickname || a.username || '用户'
      avatarUrl.value = a.avatarUrl || ''
    } else if (isSelf.value) {
      username.value = userStore.info?.nickname || userStore.info?.username || '我'
      avatarUrl.value = userStore.info?.avatarUrl || ''
    }
    if (!isSelf.value) {
      try {
        const s = await getFollowState(userId)
        isFollowing.value = !!(s?.isFollowing)
      } catch {}
      try {
        const c = await getFollowersCount(userId)
        followersCount.value = Number(c?.count || 0)
      } catch {}
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载用户公开帖子失败')
  } finally { loadingProfile.value = false }

  try {
    // For Likes (Community Posts)
    const likes = isSelf.value 
      ? await getUserLikes({ page: 1, size: 20 }) 
      : await getOtherUserLikedPosts(userId, { page: 1, size: 20 })
    likedPosts.value = likes.items || []
  } catch {}
  finally { loadingLikes.value = false }

  try {
    // For Favorites (Community Posts)
    const favs = isSelf.value 
      ? await getUserPostFavorites({ page: 1, size: 20 }) 
      : await getOtherUserPostFavorites(userId, { page: 1, size: 20 })
    favoritePosts.value = favs.items || []
  } catch {}
  finally { loadingFavorites.value = false }
})

const goPost = (id) => router.push(`/community/post/${id}`)
const goImage = (id, index) => router.push(`/community/post/${id}/image/${index}`)
const toggleFollow = async () => {
  try {
    if (isFollowing.value) { await unfollowUser(userId); isFollowing.value = false; followersCount.value = Math.max(0, followersCount.value - 1) }
    else { await followUser(userId); isFollowing.value = true; followersCount.value = followersCount.value + 1 }
  } catch {}
}
</script>

<style scoped>
.profile { padding: 2rem 0; }
.container { max-width: 1000px; margin: 0 auto; padding: 0 2rem; }
.header { display: flex; gap: 16px; align-items: center; margin-bottom: 24px; }
.avatar {
  width: 64px; height: 64px; border-radius: 50%; object-fit: cover;
  border: 2px solid var(--app-border);
  box-shadow: var(--app-shadow-card);
}
.name { font-size: 1.25rem; font-weight: 700; color: var(--app-text-main); }
.desc { color: var(--app-text-secondary); font-size: 0.9rem; margin-top: 4px; }
.meta { display: flex; flex-direction: column; justify-content: center; }

.follow-area { margin-left: auto; display: inline-flex; align-items: center; gap: 12px; }
.followers { font-size: 13px; color: var(--app-text-secondary); }

/* Tabs */
.profile-tabs :deep(.el-tabs__item) { color: var(--app-text-secondary); }
.profile-tabs :deep(.el-tabs__item.is-active) { color: var(--app-color-primary); }

.posts { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.post {
  border-radius: 12px;
  /* Double gradient for border effect */
  background: linear-gradient(var(--app-bg-card), var(--app-bg-card)) padding-box,
              linear-gradient(135deg, var(--app-brand-gradient-start), var(--app-brand-gradient-end)) border-box;
  border: 1px solid transparent;
  color: var(--app-text-main);
  transition: transform .2s ease, box-shadow .2s ease;
}
.post:hover { transform: translateY(-2px); box-shadow: var(--app-shadow-hover); }

.post-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
.title { font-weight: 600; cursor: pointer; color: var(--app-text-main); margin: 0; }
.title:hover { color: var(--app-color-primary); }

.meta-right { display: inline-flex; gap: 8px; align-items: center; font-size: 13px; color: var(--app-text-secondary); }

.count {
  display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px;
  background: var(--app-accent-bg-soft);
  color: var(--app-text-main);
  font-size: 12px;
}

.tags { display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
.post :deep(.el-tag) {
  border-radius: 999px;
  background: var(--app-accent-bg-soft);
  border: 1px solid var(--app-accent-border);
  color: var(--app-text-secondary);
  --el-tag-bg-color: var(--app-accent-bg-soft);
  --el-tag-border-color: var(--app-accent-border);
  --el-tag-text-color: var(--app-text-secondary);
}

.content { margin-bottom: 12px; color: var(--app-text-main); line-height: 1.6; opacity: 0.9; }

.images { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
.image { width: 100%; height: 160px; object-fit: cover; border-radius: 8px; cursor: zoom-in; transition: transform 0.2s; }
.image:hover { transform: scale(1.02); }

.empty { text-align: center; padding: 40px; color: var(--app-text-secondary); }

@media (max-width: 768px) { .images { grid-template-columns: repeat(2, 1fr); } }
</style>
