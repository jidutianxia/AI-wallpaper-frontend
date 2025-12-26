<template>
  <div class="profile">
    <div class="container" v-if="userId">
      <div class="header">
        <img :src="avatarUrl" class="avatar" />
        <div class="meta">
          <div class="name">{{ username }}</div>
          <div class="desc">公开分享</div>
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
                <div class="tags">
                  <el-tag v-for="t in p.tags" :key="t" size="small">{{ t }}</el-tag>
                </div>
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
                <div class="tags">
                  <el-tag v-for="t in p.tags" :key="t" size="small">{{ t }}</el-tag>
                </div>
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
                <div class="tags">
                  <el-tag v-for="t in p.tags" :key="t" size="small">{{ t }}</el-tag>
                </div>
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
import { getUserCommunityPosts, getMyCommunityPosts, getUserLikes, getUserPostFavorites } from '@/api/wallpaper'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const userId = route.params.id // 支持字符串ID或用户名
const userPosts = ref([])
const likedPosts = ref([])
const favoritePosts = ref([])
const loadingProfile = ref(true)
const loadingLikes = ref(true)
const loadingFavorites = ref(true)
const activeTab = ref('posts')
const username = ref('用户')
const avatarUrl = ref('')

onMounted(async () => {
  try {
    const isSelf = userStore.info?.id && String(userStore.info.id) === String(userId)
    const res = isSelf ? await getMyCommunityPosts({ page: 1, size: 20 }) : await getUserCommunityPosts(userId, { page: 1, size: 20 })
    userPosts.value = res.items || []
    const a = userPosts.value[0]?.author
    if (a) {
      username.value = a.nickname || a.username || '用户'
      avatarUrl.value = a.avatarUrl || ''
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载用户公开帖子失败')
  } finally { loadingProfile.value = false }

  try {
    const likes = await getUserLikes({ page: 1, size: 20 })
    likedPosts.value = likes.items || []
  } catch {}
  finally { loadingLikes.value = false }

  try {
    const favs = await getUserPostFavorites({ page: 1, size: 20 })
    favoritePosts.value = favs.items || []
  } catch {}
  finally { loadingFavorites.value = false }
})

const goPost = (id) => router.push(`/community/post/${id}`)
const goImage = (id, index) => router.push(`/community/post/${id}/image/${index}`)
</script>

<style scoped>
.profile { padding: 2rem 0; }
.container { max-width: 1000px; margin: 0 auto; padding: 0 2rem; }
.header { display: inline-flex; gap: 16px; align-items: center; margin-bottom: 16px; }
.avatar { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; }
.name { font-size: 1.25rem; font-weight: 700; }
.posts { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.post-head { display: flex; justify-content: space-between; align-items: baseline; }
.images { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
.image { width: 100%; height: 160px; object-fit: cover; border-radius: 8px; cursor: zoom-in; }
@media (max-width: 768px) { .images { grid-template-columns: repeat(2, 1fr); } }
.post { border: 1px solid transparent; border-radius: 12px; background: linear-gradient(#ffffff,#ffffff) padding-box, linear-gradient(135deg, var(--brand-gradient-start), var(--brand-gradient-end)) border-box; transition: transform .2s ease, box-shadow .2s ease; }
.dark .post { background: linear-gradient(#1f2937,#1f2937) padding-box, linear-gradient(135deg, var(--brand-gradient-start), var(--brand-gradient-end)) border-box; }
.post:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(0,0,0,.12); }
.dark .post:hover { box-shadow: 0 10px 24px rgba(0,0,0,.35); }
:deep(.el-tag) { border-radius: 999px; padding: 0 10px; background: rgba(147,197,253,.18); border: 1px solid rgba(147,197,253,.35); color: #1f2937; }
.dark :deep(.el-tag) { background: rgba(30,64,175,.28); border-color: rgba(59,130,246,.4); color: #e5e7eb; }
.image:hover { transform: scale(1.02); transition: transform .2s ease; }
.dark .profile :deep(.el-card.post) { background:#1f2937; border-color:#374151; color:#e5e7eb; }
.dark .name { color:#e5e7eb; }
</style>
