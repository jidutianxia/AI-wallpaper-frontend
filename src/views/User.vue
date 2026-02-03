<template>
  <div class="user">
    <!-- 用户信息卡片 -->
    <div class="user-profile">
      <div class="profile-header">
        <el-avatar :size="80" :src="getAvatarUrl(userStore.info?.avatarUrl)">
          {{ userStore.info?.username?.charAt(0).toUpperCase() }}
        </el-avatar>
        <div class="profile-info">
          <h2>{{ userStore.info?.nickname || userStore.info?.username || '游客' }}</h2>
          <p>{{ userStore.info?.signature || userStore.info?.bio || '这个人很懒，什么都没写' }}</p>
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-number">{{ userStats.posts }}</span>
              <span class="stat-label">发布</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userStats.favorites }}</span>
              <span class="stat-label">收藏</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userStats.likes }}</span>
              <span class="stat-label">获赞</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="profile-actions" v-if="userStore.isAuthenticated">
        <el-button @click="showEditDialog = true" class="action-btn">编辑资料</el-button>
        <el-button @click="showUploadDialog = true" type="primary" v-if="userStore.info?.role === 'admin'" class="action-btn">上传壁纸</el-button>
      </div>
    </div>
    
    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="user-tabs">
      <el-tab-pane label="发布的作品" name="posts">
        <div class="posts-list" v-loading="loading.posts">
          <div v-for="p in posts" :key="p.id" class="post-card">
            <div class="post-header">
              <div class="author">
                <img :src="getAvatarUrl(p.author?.avatarUrl || userStore.info?.avatarUrl)" class="avatar-sm" />
                <span class="name">{{ p.author?.username || userStore.info?.username }}</span>
                <span class="time">{{ formatDate(p.createdAt) }}</span>
              </div>
              <div class="post-manage">
                <el-button link type="primary" :icon="Edit" @click="openEditPost(p)">编辑</el-button>
                <el-button link type="danger" :icon="Delete" @click="deletePost(p)">删除</el-button>
              </div>
            </div>
            <h4 class="post-title" @click="router.push(`/community/post/${p.id}`)">{{ p.title }}</h4>
            <p class="post-content" @click="router.push(`/community/post/${p.id}`)">{{ p.content }}</p>
            <div class="post-images" v-if="p.images && p.images.length">
              <img v-for="(img, idx) in p.images.slice(0, 4)" :key="idx" :src="img" class="post-img" />
            </div>
            <div class="post-footer">
              <span class="tag" v-for="t in p.tags" :key="t">#{{ t }}</span>
              <div class="stats">
                <span><el-icon><Star /></el-icon> {{ p.likes || 0 }}</span>
                <span><el-icon><ChatLineSquare /></el-icon> {{ p.commentsCount || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!loading.posts && posts.length === 0" class="empty-state">
          <el-empty description="还没有发布任何作品" />
          <el-button type="primary" @click="router.push('/community/compose')">去发布</el-button>
        </div>
      </el-tab-pane>


      <el-tab-pane label="我喜欢的壁纸" name="wallpaperLikes">
        <div class="wallpaper-grid" v-loading="loading.wallpaperLikes">
          <UnifiedCard 
            v-for="w in wallpaperLikes" 
            :key="w.id" 
            :title="w.title" 
            :cover="w.thumbUrl || w.url" 
            :to="String(`/detail/${w.id}`)" 
            :likes="w.likes" 
            :favorites="w.favorites"
            :no-actions="true"
          />
        </div>
        <div v-if="!loading.wallpaperLikes && (!wallpaperLikes || wallpaperLikes.length === 0)" class="empty-state">
          <el-empty description="还没有喜爱任何壁纸" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="我的点赞（帖子）" name="likes">
        <div class="wallpaper-grid" v-loading="loading.likes">
          <UnifiedCard 
            v-for="p in likes" 
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
        <div v-if="!loading.likes && likes.length === 0" class="empty-state">
          <el-empty description="还没有点赞任何帖子" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="我的收藏（帖子）" name="favorites">
        <div class="wallpaper-grid" v-loading="loading.favorites">
          <UnifiedCard 
            v-for="p in favorites" 
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
        <div v-if="!loading.favorites && favorites.length === 0" class="empty-state">
          <el-empty description="还没有收藏任何帖子" />
        </div>
      </el-tab-pane>

      <!-- <el-tab-pane label="我的收藏（图片）" name="imageFavorites">
        <div class="wallpaper-grid" v-loading="loading.imageFavorites">
          <div 
            v-for="img in imageFavorites" 
            :key="img.url" 
            class="wallpaper-item"
            @click="router.push(`/community/post/${img.postId}/image/${img.index}`)"
          >
            <img :src="getImageUrl(img.url)" :alt="`图片 ${img.index}`" />
            <div class="wallpaper-overlay">
              <div class="wallpaper-info">
                 <p>来自帖子 #{{ img.postId }}</p>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!loading.imageFavorites && imageFavorites.length === 0" class="empty-state">
          <el-empty description="还没有收藏任何图片" />
        </div>
      </el-tab-pane> -->
      
      <el-tab-pane label="我的上传" name="uploads" v-if="userStore.info?.role === 'admin'">
        <div class="wallpaper-grid" v-loading="loading.uploads">
          <div 
            v-for="wallpaper in uploads" 
            :key="wallpaper.id" 
            :title="wallpaper.title"
            class="wallpaper-item"
            @click="viewDetail(wallpaper.id)"
          >
            <img :src="wallpaper.thumbUrl" :alt="wallpaper.title" />
            <div class="wallpaper-overlay">
              <div class="wallpaper-actions">
                <el-button 
                  :icon="Edit" 
                  circle 
                  size="small" 
                  @click.stop="editWallpaper(wallpaper)"
                />
                <el-button 
                  :icon="Delete" 
                  circle 
                  size="small" 
                  type="danger"
                  @click.stop="deleteWallpaper(wallpaper)"
                />
              </div>
              <div class="wallpaper-info">
                <h3>{{ wallpaper.title }}</h3>
                <p>状态：{{ wallpaper.status === 'approved' ? '已审核' : '待审核' }}</p>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!loading.uploads && uploads.length === 0" class="empty-state">
          <el-empty description="还没有上传任何壁纸" />
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 编辑资料对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑资料" width="400px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" disabled placeholder="用户名不可修改" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" placeholder="设置昵称" />
        </el-form-item>
        <el-form-item label="个性签名">
          <el-input v-model="editForm.signature" placeholder="一句话介绍自己" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :http-request="uploadAvatar"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="editForm.avatarUrl" :src="getAvatarUrl(editForm.avatarUrl)" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveProfile" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 编辑帖子对话框 -->
    <el-dialog v-model="showEditPostDialog" title="编辑作品" width="500px">
      <el-form :model="editPostForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="editPostForm.title" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input type="textarea" v-model="editPostForm.content" rows="4" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="editPostForm.tags" placeholder="用逗号分隔多个标签" />
        </el-form-item>
        <!-- 暂时简化图片编辑，只支持文本修改，如需图片修改需更复杂的逻辑 -->
        <el-form-item label="提示">
          <span style="color:#999; font-size:12px;">暂时只支持编辑文本内容</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditPostDialog = false">取消</el-button>
        <el-button type="primary" @click="savePost" :loading="savingPost">保存</el-button>
      </template>
    </el-dialog>

    <!-- 上传壁纸对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传壁纸" width="500px">
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="uploadForm.title" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="uploadForm.category" placeholder="选择分类">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="uploadForm.tags" placeholder="用逗号分隔多个标签" />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload
            class="upload-demo"
            drag
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
            :show-file-list="false"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传jpg/png文件，且不超过10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="submitUpload" :loading="uploading">上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star, Download, Edit, Delete, Plus, UploadFilled, ChatLineSquare } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { 
  getCategories, uploadWallpaper, likeWallpaper, favoriteWallpaper, 
  getUserLikes, getUserStats, getMyPostFavorites, getMyWallpaperFavorites,
  getMyCommunityPosts, deleteCommunityPost, updateCommunityPost,
  deleteWallpaper as apiDeleteWallpaper, getUserUploads, getMyFavoriteCommunityImages,
  getMyLikedWallpapers
} from '@/api'
import UnifiedCard from '@/components/UnifiedCard.vue'
import request from '@/api'
import { getImageUrl, getAvatarUrl } from '@/utils/imageHelper'

const router = useRouter()
const userStore = useUserStore()

const isMounted = ref(true)
onBeforeUnmount(() => {
  isMounted.value = false
})

// 响应式数据
const activeTab = ref('posts') // 默认显示发布的作品
const showEditDialog = ref(false)
const showUploadDialog = ref(false)
const showEditPostDialog = ref(false)
const saving = ref(false)
const savingPost = ref(false)
const uploading = ref(false)

// 用户统计
const userStats = reactive({
  posts: 0,
  favorites: 0,
  likes: 0,
  downloads: 0
})

// 加载状态
const loading = reactive({
  posts: false,
  favorites: false,
  wallpaperFavorites: false,
  likes: false,
  wallpaperLikes: false,
  uploads: false,
  imageFavorites: false
})

// 数据列表
const posts = ref([])
const favorites = ref([])
const wallpaperFavorites = ref([])
const imageFavorites = ref([])
const likes = ref([])
const uploads = ref([])
const categories = ref([])
const wallpaperLikes = ref([])


// 编辑表单
const editForm = reactive({
  username: '',
  nickname: '',
  signature: '',
  email: '',
  avatarUrl: ''
})

// 编辑帖子表单
const editPostForm = reactive({
  id: null,
  title: '',
  content: '',
  tags: ''
})

// 上传表单
const uploadForm = reactive({
  title: '',
  category: '',
  tags: '',
  file: null
})

// Helper to normalize post images (handle string vs object)
const normalizePost = (p) => {
  if (p.images && Array.isArray(p.images)) {
    p.images = p.images.map(img => {
      if (typeof img === 'string') return img
      return img?.url || img?.src || img?.path || ''
    }).filter(Boolean)
  }
  if (p.cover && typeof p.cover === 'object') {
     p.cover = p.cover.url || p.cover.src || p.cover.path || ''
  }
  return p
}

// 获取统计数据
const fetchUserStats = async () => {
  try {
    const stats = await getUserStats()
    if (!isMounted.value) return
    if (stats) {
      userStats.posts = stats.postCount ?? 0
      userStats.favorites = stats.favoriteCount ?? stats.favoritesCount ?? 0
      userStats.likes = stats.likeCount ?? stats.likesCount ?? 0
      userStats.downloads = stats.downloads ?? 0
    }
  } catch (error) {
    if (!isMounted.value) return
    userStats.posts = posts.value.length
    userStats.favorites = favorites.value.length
    userStats.likes = likes.value.length
  }
}

// 获取我发布的作品
const fetchMyPosts = async () => {
  loading.posts = true
  try {
    const response = await getMyCommunityPosts({ page: 1, size: 50 })
    if (!isMounted.value) return
    const list = Array.isArray(response) ? response : (response.items || [])
    posts.value = list.map(normalizePost)
    if (userStats.posts === 0) userStats.posts = response.total || posts.value.length
    
    // Sync avatar from posts if missing in store
    if (posts.value.length > 0 && userStore.info && !userStore.info.avatarUrl) {
      const authorAvatar = posts.value[0].author?.avatarUrl
      if (authorAvatar) {
        userStore.info.avatarUrl = authorAvatar
      }
    }
  } catch (error) {
    if (!isMounted.value) return
    posts.value = []
  } finally {
    if (isMounted.value) loading.posts = false
  }
}

// 获取用户收藏 (帖子)
const fetchFavorites = async () => {
  loading.favorites = true
  try {
    const response = await getMyPostFavorites()
    if (!isMounted.value) return
    const list = Array.isArray(response) ? response : (response.items || [])
    favorites.value = list.map(normalizePost)
  } catch (error) {
    if (!isMounted.value) return
    favorites.value = []
  } finally {
    if (isMounted.value) loading.favorites = false
  }
}

// 获取用户偏爱壁纸
const fetchWallpaperFavorites = async () => {
  loading.wallpaperFavorites = true
  try {
    const response = await getMyWallpaperFavorites()
    if (!isMounted.value) return
    wallpaperFavorites.value = Array.isArray(response) ? response : (response.items || [])
  } catch (error) {
    if (!isMounted.value) return
    wallpaperFavorites.value = []
  } finally {
    if (isMounted.value) loading.wallpaperFavorites = false
  }
}

// 获取用户点赞的壁纸
const fetchWallpaperLikes = async () => {
  loading.wallpaperLikes = true
  try {
    const response = await getMyLikedWallpapers()
    if (!isMounted.value) return
    wallpaperLikes.value = Array.isArray(response) ? response : (response.items || [])
  } catch (error) {
    if (!isMounted.value) return
    wallpaperLikes.value = []
  } finally {
    if (isMounted.value) loading.wallpaperLikes = false
  }
}

// 获取用户点赞 (帖子)
const fetchLikes = async () => {
  loading.likes = true
  try {
    const response = await getUserLikes({ page: 1, size: 50 })
    if (!isMounted.value) return
    const list = Array.isArray(response) ? response : (response.items || [])
    likes.value = list.map(normalizePost)
  } catch (error) {
    if (!isMounted.value) return
    likes.value = []
  } finally {
    if (isMounted.value) loading.likes = false
  }
}

// 获取用户上传
const fetchUploads = async () => {
  if (userStore.info?.role !== 'admin') return
  
  loading.uploads = true
  try {
    const response = await getUserUploads()
    if (!isMounted.value) return
    uploads.value = response || []
  } catch (error) {
    if (!isMounted.value) return
    uploads.value = []
  } finally {
    if (isMounted.value) loading.uploads = false
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await getCategories()
    if (!isMounted.value) return
    categories.value = response || []
  } catch (error) {
    if (!isMounted.value) return
    categories.value = []
  }
}

// 查看详情
const viewDetail = (id) => {
  router.push(`/detail/${id}`)
}

// 删除壁纸
const deleteWallpaper = async (wallpaper) => {
  try {
    await ElMessageBox.confirm('确定要删除这张壁纸吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await apiDeleteWallpaper(wallpaper.id)
    if (!isMounted.value) return
    uploads.value = uploads.value.filter(item => item.id !== wallpaper.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

// 打开编辑帖子
const openEditPost = (post) => {
  editPostForm.id = post.id
  editPostForm.title = post.title
  editPostForm.content = post.content
  editPostForm.tags = (post.tags || []).join(',')
  showEditPostDialog.value = true
}

// 保存帖子
const savePost = async () => {
  if (!editPostForm.title) return ElMessage.warning('标题不能为空')
  
  savingPost.value = true
  try {
    const payload = {
      title: editPostForm.title,
      content: editPostForm.content,
      tags: editPostForm.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean)
    }
    await updateCommunityPost(editPostForm.id, payload)
    if (!isMounted.value) return
    ElMessage.success('更新成功')
    showEditPostDialog.value = false
    fetchMyPosts()
  } catch (error) {
    if (!isMounted.value) return
    ElMessage.error('更新失败')
  } finally {
    if (isMounted.value) savingPost.value = false
  }
}

// 删除帖子
const deletePost = async (post) => {
  try {
    await ElMessageBox.confirm('确定要删除这个作品吗？此操作不可恢复', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteCommunityPost(post.id)
    if (!isMounted.value) return
    ElMessage.success('删除成功')
    posts.value = posts.value.filter(p => p.id !== post.id)
    userStats.posts = Math.max(0, userStats.posts - 1)
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

// 保存资料
const saveProfile = async () => {
  saving.value = true
  try {
    const payload = { 
      email: editForm.email, 
      avatarUrl: editForm.avatarUrl 
    }
    if (editForm.nickname) payload.nickname = editForm.nickname
    if (editForm.signature) payload.signature = editForm.signature
    
    await request.put('/auth/me', payload)
    if (!isMounted.value) return
    await userStore.fetchUser()
    if (!isMounted.value) return
    try { window.dispatchEvent(new CustomEvent('auth-changed', { detail: { type: 'profile-updated' } })) } catch {}
    showEditDialog.value = false
    ElMessage.success('保存成功')
  } catch (error) {
    if (!isMounted.value) return
    const msg = error.response?.data?.message || error.message || '保存失败'
    ElMessage.error(msg)
  } finally {
    if (isMounted.value) saving.value = false
  }
}

// 头像上传
const uploadAvatar = async (opt) => {
  try {
    const fd = new FormData(); fd.append('file', opt.file)
    const res = await request.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    if (!isMounted.value) return
    const url = res?.data?.data?.url || res?.data?.url || res?.url
    if (url) editForm.avatarUrl = url
    ElMessage.success('头像上传成功')
    opt.onSuccess && opt.onSuccess(res)
  } catch (e) {
    if (!isMounted.value) return
    ElMessage.error('头像上传失败')
    opt.onError && opt.onError(e)
  }
}

// 头像上传前验证
const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isJPG) {
    ElMessage.error('头像只能是 JPG/PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
  }
  return isJPG && isLt2M
}

// 壁纸上传成功
const handleUploadSuccess = (response) => {
  uploadForm.file = response
  ElMessage.success('文件上传成功')
}

// 壁纸上传前验证
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
  }
  return isImage && isLt10M
}

// 提交上传
const submitUpload = async () => {
  if (!uploadForm.title || !uploadForm.category || !uploadForm.file) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('title', uploadForm.title)
    formData.append('category', uploadForm.category)
    formData.append('tags', uploadForm.tags)
    formData.append('file', uploadForm.file)
    
    await uploadWallpaper(formData)
    if (!isMounted.value) return
    showUploadDialog.value = false
    ElMessage.success('上传成功，等待审核')
    
    // 重置表单
    Object.assign(uploadForm, {
      title: '',
      category: '',
      tags: '',
      file: null
    })
    
    // 刷新上传列表
    fetchUploads()
  } catch (error) {
    if (!isMounted.value) return
    ElMessage.error('上传失败：' + (error.response?.data?.message || error.message))
  } finally {
    if (isMounted.value) uploading.value = false
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 监听标签页切换
watch(activeTab, (newTab) => {
  switch (newTab) {
    case 'posts':
      if (posts.value.length === 0) fetchMyPosts()
      break
    case 'favorites':
      if (favorites.value.length === 0) fetchFavorites()
      break
    case 'wallpaperLikes':
      if (wallpaperLikes.value.length === 0) fetchWallpaperLikes()
      break
    case 'likes':
      if (likes.value.length === 0) fetchLikes()
      break
    case 'uploads':
      if (uploads.value.length === 0) fetchUploads()
      break
  }
})

// 监听用户信息变化
watch(() => userStore.info, (newInfo) => {
  if (newInfo) {
    Object.assign(editForm, {
      username: newInfo.username || '',
      nickname: newInfo.nickname || '',
      signature: newInfo.signature || newInfo.bio || '',
      email: newInfo.email || '',
      avatarUrl: newInfo.avatarUrl || ''
    })
  }
}, { immediate: true })

// 组件挂载
onMounted(async () => {
  // 如果没有 token，直接跳转
  if (!userStore.token) {
    ElMessage.warning('请先登录')
    router.push('/')
    return
  }
  
  // 如果有 token 但未认证（可能是刷新页面），尝试重新获取用户信息
  if (!userStore.isAuthenticated) {
    try {
      await userStore.initAuth()
    } catch (e) {
      // initAuth 失败会自动 logout
    }
  }

  if (!isMounted.value) return

  // 二次检查
  if (!userStore.isAuthenticated && !userStore.info) {
    ElMessage.warning('登录已过期，请重新登录')
    router.push('/')
    return
  }
  
  fetchCategories()
  fetchUserStats()
  fetchMyPosts() // Default tab
})



</script>

<style scoped>
.user {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.user-profile {
  background: var(--app-bg-card);
  border-radius: 12px;
  padding: 30px;
  box-shadow: var(--app-shadow-card);
  margin-bottom: 30px;
  border: 1px solid var(--app-border);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 30px;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--app-bg-base);
  box-shadow: var(--app-shadow-sm);
}

.profile-info h2 {
  margin: 0 0 10px 0;
  color: var(--app-text-main);
  font-size: 28px;
  font-weight: 600;
}

.profile-info p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 16px;
}

.profile-stats {
  display: flex;
  gap: 40px;
  margin-bottom: 30px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: var(--app-color-primary);
  margin-bottom: 5px;
}

.stat-label {
  color: var(--app-text-secondary);
  font-size: 14px;
}

.profile-actions {
  display: flex;
  gap: 15px;
}

.action-btn {
  border-radius: 999px;
  padding: 8px 24px;
  height: auto;
}
.action-btn:not(.el-button--primary) {
  background: var(--app-bg-base);
  border-color: var(--app-border);
  color: var(--app-text-main);
}
.action-btn:not(.el-button--primary):hover {
  border-color: var(--app-color-primary);
  color: var(--app-color-primary);
  background: var(--app-bg-hover);
}

.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 20px;
}

.wallpaper-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: var(--app-bg-hover);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid transparent;
}
.wallpaper-item:hover {
  transform: translateY(-5px);
  box-shadow: var(--app-shadow-hover);
}

.wallpaper-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.wallpaper-item:hover img {
  transform: scale(1.05);
}

.wallpaper-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.7) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: flex-end;
  padding: 20px;
}
/* Ensure overlay text is always white regardless of theme */
.wallpaper-overlay h3, .wallpaper-overlay p { color: white; }

.wallpaper-item:hover .wallpaper-overlay {
  opacity: 1;
}

.wallpaper-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.wallpaper-info {
  padding: 15px;
}

.wallpaper-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: white;
  line-height: 1.4;
}
.wallpaper-info p { color: rgba(255,255,255,0.8); margin: 0; font-size: 0.9rem; }

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--app-text-secondary);
}

.upload-area {
  border: 2px dashed var(--app-border);
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  transition: border-color 0.3s ease;
  background: var(--app-bg-card);
}

/* Dialog Dark Mode - Handled globally by element-bridge.css */

/* Post Card Styles */
.posts-list {
  display: grid;
  gap: 20px;
  padding: 10px;
}

.post-card {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 20px;
  background: var(--app-bg-card);
  transition: all 0.3s ease;
  color: var(--app-text-main);
}

.post-card:hover {
  box-shadow: var(--app-shadow-hover);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.author {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.name {
  font-weight: 600;
  font-size: 14px;
  color: var(--app-text-main);
}

.time {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.post-title {
  font-size: 18px;
  margin: 0 0 8px 0;
  color: var(--app-text-main);
  cursor: pointer;
}
.post-title:hover { color: var(--app-color-primary); }

.post-content {
  color: var(--app-text-main);
  font-size: 14px;
  margin: 0 0 12px 0;
  line-height: 1.6;
  cursor: pointer;
  opacity: 0.9;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.post-img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--app-border);
}

.tag {
  color: var(--app-color-primary);
  font-size: 13px;
  margin-right: 8px;
}

.stats {
  display: flex;
  gap: 16px;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user { padding: 12px; }
  .user-profile { padding: 16px; }
  .profile-header { flex-direction: column; text-align: center; gap: 16px; }
  .profile-info h2 { font-size: 1.5rem; margin-bottom: 8px; }
  .profile-stats { justify-content: center; gap: 24px; }
  .wallpaper-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 12px; }
  .wallpaper-item img { height: 150px; }
  .post-images { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
  .user { padding: 8px; }
  .wallpaper-grid { grid-template-columns: 1fr; }
  .wallpaper-item img { height: 200px; }
}
</style>
