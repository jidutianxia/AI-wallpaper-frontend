<template>
  <div class="compose">
    <div class="container">
      <el-card class="composer">
        <div class="composer-header">
          <el-button circle text @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <h2 class="title">发布分享</h2>
        </div>
        <el-form :model="form" label-width="80px">
          <el-form-item label="标题">
            <el-input v-model="form.title" maxlength="80" show-word-limit placeholder="请输入标题" />
          </el-form-item>
          <el-form-item label="内容">
            <el-input v-model="form.content" type="textarea" :rows="6" maxlength="500" show-word-limit placeholder="分享你的创作说明" />
          </el-form-item>
          <el-form-item label="标签">
            <el-select v-model="form.tags" multiple placeholder="选择标签">
              <el-option v-for="t in tagOptions" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>
          <el-form-item label="上传">
            <el-upload class="upload" :http-request="onHttpRequest" :on-success="onUploadSuccess" :on-error="onUploadError" :on-exceed="onExceed" :limit="10" multiple list-type="picture-card" accept="image/*">
              <template #default>
                <el-icon><Plus /></el-icon>
              </template>
              <template #file="{ file }">
                <div class="custom-file-preview">
                  <img class="el-upload-list__item-thumbnail" :src="file.url" alt="" />
                  <span class="el-upload-list__item-actions">
                    <span class="el-upload-list__item-delete" @click="handleRemove(file)">
                      <el-icon><Delete /></el-icon>
                    </span>
                  </span>
                  <div class="wallpaper-option">
                    <el-checkbox v-model="file.isWallpaper" label="收录为壁纸" size="small" @change="(val) => handleWallpaperCheck(val, file)" />
                  </div>
                </div>
                <div v-if="file.isWallpaper" class="wallpaper-form">
                  <el-select v-model="file.wallpaperCategory" placeholder="壁纸分类(必填)" size="small" style="width: 100%; margin-bottom: 4px;">
                    <el-option v-for="c in wallpaperCategories" :key="c.value" :label="c.label" :value="c.value" />
                  </el-select>
                  <el-select v-model="file.wallpaperTags" multiple placeholder="标签(可选)" size="small" style="width: 100%;" allow-create filterable default-first-option>
                    <el-option v-for="t in tagOptions" :key="t" :label="t" :value="t" />
                  </el-select>
                </div>
              </template>
            </el-upload>
          </el-form-item>
          <div class="actions">
            <el-button type="primary" :loading="publishing" @click="publish">发布</el-button>
            <el-button @click="reset">重置</el-button>
          </div>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { uploadCommunityImage, createCommunityPost, getCategories } from '@/api'
import { useRouter } from 'vue-router'

const router = useRouter()
const goBack = () => router.push('/community')

const form = ref({ title: '', content: '', tags: [], images: [] })
const fileList = ref([]) // Manually manage file list for custom rendering
const tagOptions = ['插画', '风景', '极简', '赛博', '像素', '摄影']
const wallpaperCategories = ref([])
const publishing = ref(false)

// Fetch wallpaper categories
const loadCategories = async () => {
  try {
    const cats = await getCategories()
    wallpaperCategories.value = (cats || []).map(c => ({ label: c.name, value: c.id }))
  } catch {}
}
loadCategories()

const onExceed = () => { ElMessage.warning('最多只能上传 10 张图片') }
const onHttpRequest = async (options) => {
  const { file, onSuccess, onError } = options
  const fd = new FormData()
  fd.append('file', file)
  try {
    const r = await uploadCommunityImage(fd)
    // Custom file object augmentation
    file.url = r.data?.url || r.url
    file.isWallpaper = false
    file.wallpaperCategory = ''
    file.wallpaperTags = []
    fileList.value.push(file)
    onSuccess(r.data)
  } catch (e) {
    try { onSuccess({ url: URL.createObjectURL(file) }) } catch { onError(e) }
  }
}
const onUploadSuccess = (response, file) => { 
  // Handled in onHttpRequest for custom file object control, but ensure sync
  if (!file.url) {
    const url = response?.data?.url || response?.url 
    if (url) file.url = url
  }
}
const onUploadError = () => { ElMessage.error('上传失败，请检查登录权限或后端服务') }

const handleRemove = (file) => {
  const idx = fileList.value.indexOf(file)
  if (idx !== -1) fileList.value.splice(idx, 1)
}

const handleWallpaperCheck = (checked, file) => {
  if (checked && form.value.tags.length > 0) {
    file.wallpaperTags = [...form.value.tags]
  }
}

const publish = async () => {
  if (!form.value.title || !form.value.content) { ElMessage.warning('请填写标题与内容'); return }
  
  // Validate wallpaper submissions
  const submissions = []
  const validImages = []
  
  fileList.value.forEach((f, index) => {
    if (f.url) {
      validImages.push(f.url)
      if (f.isWallpaper) {
        if (!f.wallpaperCategory) {
          ElMessage.warning(`请为第 ${index + 1} 张图片选择壁纸分类`)
          throw new Error('Validation failed')
        }
        submissions.push({
          imageIndex: index,
          category: f.wallpaperCategory,
          tags: f.wallpaperTags,
          description: form.value.content.slice(0, 100)
        })
      }
    }
  })

  publishing.value = true
  try {
    const payload = { 
      title: form.value.title, 
      content: form.value.content, 
      tags: form.value.tags, 
      images: validImages,
      wallpaperSubmissions: submissions.length > 0 ? submissions : undefined
    }
    await createCommunityPost(payload)
    reset()
    ElMessage.success('发布成功')
    location.assign('/community')
  } catch (e) {
    if (e.message !== 'Validation failed') ElMessage.error('发布失败')
  } finally { publishing.value = false }
}
const reset = () => { 
  form.value = { title: '', content: '', tags: [], images: [] }
  fileList.value = []
}
</script>

<style scoped>
.compose { padding: 2rem 0; }
.container { max-width: 900px; margin: 0 auto; padding: 0 2rem; }
.composer { 
  padding: 1rem; 
  background-color: var(--app-bg-card); 
  border-color: var(--app-border);
  color: var(--app-text-main);
  --el-card-bg-color: var(--app-bg-card);
}
.composer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--app-border);
  padding-bottom: 16px;
}
.title { margin: 0; font-size: 1.5rem; font-weight: 600; color: var(--app-text-main); }

.upload { margin-top: 0.5rem; }
.actions { display: flex; gap: 12px; justify-content: flex-end; }
.custom-file-preview {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
.custom-file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.wallpaper-option {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.6);
  padding: 2px 4px;
  display: flex;
  justify-content: center;
}
.wallpaper-form {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  padding: 8px;
  border-radius: 4px;
  box-shadow: var(--el-box-shadow-light);
  margin-top: 4px;
  width: 200px;
}
:deep(.el-upload-list__item) {
  overflow: visible !important; 
  margin-bottom: 80px !important; /* Reserve space for form */
}
</style>
