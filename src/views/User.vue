<template>
  <div class="user">
    <!-- 用户信息卡片 -->
    <div class="user-profile">
      <div class="profile-header">
        <el-avatar :size="80" :src="userStore.info?.avatar">
          {{ userStore.info?.username?.charAt(0).toUpperCase() }}
        </el-avatar>
        <div class="profile-info">
          <h2>{{ userStore.info?.username || '游客' }}</h2>
          <p>{{ userStore.info?.email }}</p>
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-number">{{ userStats.favorites }}</span>
              <span class="stat-label">收藏</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userStats.likes }}</span>
              <span class="stat-label">点赞</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userStats.downloads }}</span>
              <span class="stat-label">下载</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="profile-actions" v-if="userStore.isAuthenticated">
        <el-button @click="showEditDialog = true">编辑资料</el-button>
        <el-button @click="showUploadDialog = true" type="primary" v-if="userStore.info?.role === 'admin'">上传壁纸</el-button>
      </div>
    </div>
    
    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="user-tabs">
      <el-tab-pane label="我的收藏" name="favorites">
        <div class="wallpaper-grid" v-loading="loading.favorites">
          <div 
            v-for="wallpaper in favorites" 
            :key="wallpaper.id" 
            class="wallpaper-item"
            @click="viewDetail(wallpaper.id)"
          >
            <img :src="wallpaper.thumbUrl" :alt="wallpaper.title" />
            <div class="wallpaper-overlay">
              <div class="wallpaper-actions">
                <el-button 
                  :icon="Star" 
                  circle 
                  size="small" 
                  type="danger"
                  @click.stop="removeFavorite(wallpaper)"
                />
                <el-button 
                  :icon="Download" 
                  circle 
                  size="small" 
                  @click.stop="downloadWallpaper(wallpaper)"
                />
              </div>
              <div class="wallpaper-info">
                <h3>{{ wallpaper.title }}</h3>
                <p>收藏于 {{ formatDate(wallpaper.favoriteTime) }}</p>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!loading.favorites && favorites.length === 0" class="empty-state">
          <el-empty description="还没有收藏任何壁纸" />
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="我的点赞" name="likes">
        <div class="wallpaper-grid" v-loading="loading.likes">
          <div 
            v-for="wallpaper in likes" 
            :key="wallpaper.id" 
            class="wallpaper-item"
            @click="viewDetail(wallpaper.id)"
          >
            <img :src="wallpaper.thumbUrl" :alt="wallpaper.title" />
            <div class="wallpaper-overlay">
              <div class="wallpaper-actions">
                <el-button 
                  :icon="Star" 
                  circle 
                  size="small" 
                  type="danger"
                  @click.stop="toggleLike(wallpaper)"
                />
                <el-button 
                  :icon="Download" 
                  circle 
                  size="small" 
                  @click.stop="downloadWallpaper(wallpaper)"
                />
              </div>
              <div class="wallpaper-info">
                <h3>{{ wallpaper.title }}</h3>
                <p>点赞于 {{ formatDate(wallpaper.likeTime) }}</p>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!loading.likes && likes.length === 0" class="empty-state">
          <el-empty description="还没有点赞任何壁纸" />
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="我的上传" name="uploads" v-if="userStore.info?.role === 'admin'">
        <div class="wallpaper-grid" v-loading="loading.uploads">
          <div 
            v-for="wallpaper in uploads" 
            :key="wallpaper.id" 
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
          <el-input v-model="editForm.username" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="editForm.avatar" :src="editForm.avatar" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveProfile" :loading="saving">保存</el-button>
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
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star, Download, Edit, Delete, Plus, UploadFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getCategories, uploadWallpaper, likeWallpaper, favoriteWallpaper } from '@/api/wallpaper'
import request from '@/api/wallpaper'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const activeTab = ref('favorites')
const showEditDialog = ref(false)
const showUploadDialog = ref(false)
const saving = ref(false)
const uploading = ref(false)

// 用户统计
const userStats = reactive({
  favorites: 0,
  likes: 0,
  downloads: 0
})

// 加载状态
const loading = reactive({
  favorites: false,
  likes: false,
  uploads: false
})

// 数据列表
const favorites = ref([])
const likes = ref([])
const uploads = ref([])
const categories = ref([])

// 编辑表单
const editForm = reactive({
  username: '',
  email: '',
  avatar: ''
})

// 上传表单
const uploadForm = reactive({
  title: '',
  category: '',
  tags: '',
  file: null
})

// 获取用户收藏
const fetchFavorites = async () => {
  loading.favorites = true
  try {
    const response = await request.get('/user/favorites')
    favorites.value = response.data || []
    userStats.favorites = favorites.value.length
  } catch (error) {
    // 模拟数据
    favorites.value = [
      {
        id: 1,
        title: '收藏的风景',
        thumbUrl: 'https://via.placeholder.com/300x200/4CAF50/white?text=Favorite1',
        favoriteTime: '2024-01-15'
      },
      {
        id: 2,
        title: '收藏的抽象',
        thumbUrl: 'https://via.placeholder.com/300x200/FF9800/white?text=Favorite2',
        favoriteTime: '2024-01-10'
      }
    ]
    userStats.favorites = favorites.value.length
  } finally {
    loading.favorites = false
  }
}

// 获取用户点赞
const fetchLikes = async () => {
  loading.likes = true
  try {
    const response = await request.get('/user/likes')
    likes.value = response.data || []
    userStats.likes = likes.value.length
  } catch (error) {
    // 模拟数据
    likes.value = [
      {
        id: 3,
        title: '点赞的城市',
        thumbUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=300&h=200&fit=crop&crop=center',
        likeTime: '2024-01-12'
      }
    ]
    userStats.likes = likes.value.length
  } finally {
    loading.likes = false
  }
}

// 获取用户上传
const fetchUploads = async () => {
  if (userStore.info?.role !== 'admin') return
  
  loading.uploads = true
  try {
    const response = await request.get('/user/uploads')
    uploads.value = response.data || []
  } catch (error) {
    // 模拟数据
    uploads.value = [
      {
        id: 4,
        title: '我上传的壁纸',
        thumbUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=200&fit=crop&crop=center',
        status: 'approved'
      }
    ]
  } finally {
    loading.uploads = false
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await getCategories()
    categories.value = response || []
  } catch (error) {
    categories.value = [
      { id: 1, name: '风景' },
      { id: 2, name: '抽象' },
      { id: 3, name: '动漫' },
      { id: 4, name: '游戏' }
    ]
  }
}

// 查看详情
const viewDetail = (id) => {
  router.push(`/detail/${id}`)
}

// 移除收藏
const removeFavorite = async (wallpaper) => {
  try {
    await favoriteWallpaper(wallpaper.id)
    favorites.value = favorites.value.filter(item => item.id !== wallpaper.id)
    userStats.favorites--
    ElMessage.success('已取消收藏')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 切换点赞
const toggleLike = async (wallpaper) => {
  try {
    await likeWallpaper(wallpaper.id)
    likes.value = likes.value.filter(item => item.id !== wallpaper.id)
    userStats.likes--
    ElMessage.success('已取消点赞')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 下载壁纸
const downloadWallpaper = (wallpaper) => {
  const link = document.createElement('a')
  link.href = wallpaper.url || wallpaper.thumbUrl
  link.download = `${wallpaper.title}.jpg`
  link.click()
  userStats.downloads++
  ElMessage.success('开始下载')
}

// 编辑壁纸
const editWallpaper = (wallpaper) => {
  ElMessage.info('编辑功能开发中...')
}

// 删除壁纸
const deleteWallpaper = async (wallpaper) => {
  try {
    await ElMessageBox.confirm('确定要删除这张壁纸吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.delete(`/wallpapers/${wallpaper.id}`)
    uploads.value = uploads.value.filter(item => item.id !== wallpaper.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 保存资料
const saveProfile = async () => {
  saving.value = true
  try {
    await request.put('/user/profile', editForm)
    await userStore.fetchUser()
    showEditDialog.value = false
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 头像上传成功
const handleAvatarSuccess = (response) => {
  editForm.avatar = response.url
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
    ElMessage.error('上传失败：' + (error.response?.data?.message || error.message))
  } finally {
    uploading.value = false
  }
}

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 监听标签页切换
watch(activeTab, (newTab) => {
  switch (newTab) {
    case 'favorites':
      if (favorites.value.length === 0) fetchFavorites()
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
      email: newInfo.email || '',
      avatar: newInfo.avatar || ''
    })
  }
}, { immediate: true })

// 组件挂载
onMounted(() => {
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    router.push('/')
    return
  }
  
  fetchCategories()
  fetchFavorites()
})
</script>

<style scoped>
.user {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.user-profile {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
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
  border: 4px solid #f0f0f0;
}

.profile-info h2 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.profile-info p {
  margin: 0;
  color: #666;
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
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.profile-actions {
  display: flex;
  gap: 15px;
}

.user-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
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
  background: #f8f9fa;
  transition: all 0.3s ease;
  cursor: pointer;
}

.wallpaper-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
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

.wallpaper-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.wallpaper-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #666;
  font-size: 14px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-approved {
  background: #f0f9ff;
  color: #0369a1;
}

.status-pending {
  background: #fef3c7;
  color: #d97706;
}

.status-rejected {
  background: #fee2e2;
  color: #dc2626;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state .el-icon {
  font-size: 64px;
  color: #ddd;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #999;
}

.empty-state p {
  margin: 0;
  color: #ccc;
}

.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  transition: border-color 0.3s ease;
}

.upload-area:hover {
  border-color: #409eff;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text {
  color: #606266;
  font-size: 14px;
}

.upload-hint {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user {
    padding: 12px;
  }
  
  .user-profile {
    padding: 16px;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .profile-info h2 {
    font-size: 1.5rem;
    margin-bottom: 8px;
  }
  
  .profile-info p {
    font-size: 14px;
  }
  
  .profile-stats {
    justify-content: center;
    gap: 24px;
    margin-bottom: 20px;
  }
  
  .stat-number {
    font-size: 24px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .profile-actions {
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .profile-actions .el-button {
    font-size: 14px;
  }
  
  .user-tabs {
    margin-top: 16px;
  }
  
  .wallpaper-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px;
  }
  
  .wallpaper-item img {
    height: 150px;
  }
  
  .wallpaper-overlay {
    padding: 12px;
    opacity: 1;
    background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.8) 100%);
  }
  
  .wallpaper-actions {
    gap: 6px;
  }
  
  .wallpaper-actions .el-button {
    width: 28px;
    height: 28px;
  }
  
  .wallpaper-info h3 {
    font-size: 0.9rem;
    color: white;
  }
  
  .wallpaper-info p {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .empty-state {
    padding: 40px 16px;
  }
  
  .upload-area {
    padding: 24px;
  }
  
  .upload-icon {
    font-size: 36px;
  }
}

@media (max-width: 480px) {
  .user {
    padding: 8px;
  }
  
  .user-profile {
    padding: 12px;
  }
  
  .profile-header .el-avatar {
    width: 60px !important;
    height: 60px !important;
  }
  
  .profile-info h2 {
    font-size: 1.3rem;
  }
  
  .profile-stats {
    gap: 16px;
    margin-bottom: 16px;
  }
  
  .stat-number {
    font-size: 20px;
  }
  
  .stat-label {
    font-size: 11px;
  }
  
  .profile-actions {
    gap: 6px;
  }
  
  .profile-actions .el-button {
    font-size: 12px;
    padding: 8px 12px;
  }
  
  .wallpaper-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 8px;
  }
  
  .wallpaper-item img {
    height: 200px;
  }
  
  .wallpaper-overlay {
    padding: 16px;
  }
  
  .wallpaper-info h3 {
    font-size: 1rem;
  }
  
  .wallpaper-info p {
    font-size: 0.85rem;
  }
  
  .empty-state {
    padding: 32px 12px;
  }
  
  .upload-area {
    padding: 20px;
  }
  
  .upload-icon {
    font-size: 32px;
  }
  
  .upload-text {
    font-size: 13px;
  }
  
  .upload-hint {
    font-size: 11px;
  }
}
</style>