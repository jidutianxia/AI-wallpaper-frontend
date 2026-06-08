<template>
  <div class="compose">
    <div class="container">
      <el-card class="composer">
        <div class="composer-header">
          <el-button circle text :icon="ArrowLeftBold" @click="goBack">
          </el-button>

          <h2 class="title">发布分享</h2>
        </div>
        <el-form :model="form" label-width="80px">
          <el-form-item label="标题">
            <el-input v-model="form.title" maxlength="80" show-word-limit placeholder="请输入标题" />
          </el-form-item>
          <el-form-item label="内容">
            <el-input v-model="form.content" type="textarea" :rows="6" maxlength="500" show-word-limit
              placeholder="分享你的创作说明" input-style="background-color: var(--app-bg-card);" />
          </el-form-item>
          <el-form-item label="标签">
            <el-select ref="tagSelectRef" v-model="form.tags" multiple filterable allow-create default-first-option
              placeholder="选择或输入标签" @change="handleTagChange">
              <el-option v-for="t in tagOptions" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>
          <el-form-item label="上传">
            <el-upload class="upload" v-model:file-list="fileList" :http-request="onHttpRequest"
              :before-upload="beforeUpload"
              :on-success="onUploadSuccess" :on-error="onUploadError" :on-exceed="onExceed" :limit="10" multiple
              list-type="picture-card" accept="image/*">
              <template #default>
                <el-icon>
                  <Plus />
                </el-icon>
              </template>
              <template #file="{ file }">
                <div class="custom-file-preview">
                  <img class="el-upload-list__item-thumbnail" :src="file.url" alt="" />
                  <span class="el-upload-list__item-actions">
                    <span class="el-upload-list__item-delete" @click="handleRemove(file)">
                      <el-icon>
                        <Delete />
                      </el-icon>
                    </span>
                  </span>
                  <div class="wallpaper-option">
                    <el-checkbox v-model="file.isWallpaper" label="收录为壁纸" size="small"
                      @change="(val) => handleWallpaperCheck(val, file)" />
                  </div>
                </div>
                <div v-if="file.isWallpaper" class="wallpaper-form">
                  <el-select v-model="file.wallpaperCategory" placeholder="壁纸分类(必填)" size="small"
                    style="width: 100%; margin-bottom: 4px;">
                    <el-option v-for="c in wallpaperCategories" :key="c.value" :label="c.label" :value="c.value" />
                  </el-select>

                  <el-select v-model="file.wallpaperTags" multiple placeholder="标签(可选)" size="small"
                    style="width: 100%;" allow-create filterable default-first-option
                    @change="handleWallpaperTagChange($event)" 
                    >
                  
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
import { ref, reactive ,nextTick} from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete, ArrowLeft, ArrowLeftBold } from '@element-plus/icons-vue'
import { uploadCommunityImage, createCommunityPost, getCategories } from '@/api'
import { useRouter } from 'vue-router'
import { validateImageFile, validateUploadCount } from '@/utils'

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
  } catch { }
}
loadCategories()

const onExceed = (files) => {
  const result = validateUploadCount([...(fileList.value || []), ...(files || [])], 10)
  ElMessage.warning(result.message || '最多只能上传 10 张图片')
}

const beforeUpload = (file) => {
  const result = validateImageFile(file, { maxSizeMB: 10 })
  if (!result.valid) ElMessage.error(result.message)
  return result.valid
}

const onHttpRequest = async (options) => {
  const { file, onSuccess, onError } = options
  const validation = validateImageFile(file, { maxSizeMB: 10 })
  if (!validation.valid) {
    ElMessage.error(validation.message)
    onError(new Error(validation.message))
    return
  }
  const fd = new FormData()
  fd.append('file', file)
  try {
    const r = await uploadCommunityImage(fd)
    // Custom file object augmentation
    // Note: We don't push to fileList here because v-model:file-list handles it.
    // We just need to return data for onSuccess.
    // Since uploadCommunityImage already unwraps response (returning data object directly),
    // we pass r directly instead of r.data
    onSuccess(r)
  } catch (e) {
    onError(e)
  }
}
const onUploadSuccess = (response, file) => {
  // Initialize extended properties on the UploadFile object
  if (file.isWallpaper === undefined) {
    file.isWallpaper = false
    file.wallpaperCategory = ''
    file.wallpaperTags = []
  }

  // Sync URL: Always override blob URL with remote URL from backend
  const remoteUrl = response?.data?.url || response?.url || (typeof response?.data === 'string' ? response.data : null)
  
  if (remoteUrl) {
    file.url = remoteUrl
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
      if (f.url.startsWith('blob:')) {
        ElMessage.error(`第 ${index + 1} 张图片上传未完成或失败，请删除后重试`)
        throw new Error('Validation failed')
      }
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
    console.log('Publish Payload:', payload) // Debug: Check payload structure
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

const tagSelectRef = ref(null)

const handleTagChange = () => {
  if (tagSelectRef.value) {
    // 核心代码：强制清空输入框正在输入的搜索文本
    tagSelectRef.value.states.inputValue = ''
    // 或者使用官方推荐的 query 变量（取决于 Element Plus 版本）
    tagSelectRef.value.query = ''
  }
}


// 这里的逻辑：选中或回车后，强制将内部搜索文本清空
// $event 此时是选中的值，我们需要通过 ref 数组或更直接的方式
// 技巧：利用 select 内部自动触发的 query 清空

// 处理图片单独的壁纸标签变更
const handleWallpaperTagChange = (val) => {
  // 核心逻辑：在数据更新后的下一个时刻清空输入框文本
  // val 是当前已选中的标签数组
  nextTick(() => {
    // 找到当前正在输入的 input 元素
    const activeInput = document.activeElement;
    if (activeInput && activeInput.tagName === 'INPUT') {
      // 1. 清空原生 DOM 的值
      activeInput.value = '';
      
      // 2. 触发 input 事件让 Vue/Element 监测到内容已变为空（可选，视版本而定）
      activeInput.dispatchEvent(new Event('input'));
    }
  });
}
</script>

<style scoped>
.compose {
  padding: 2rem 0;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 2rem;
}

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

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--app-text-main);
}

.upload {
  margin-top: 0.5rem;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

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
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 4px;
  display: flex;
  justify-content: center;
}

/* --- 壁纸信息悬浮表单适配 --- */
.wallpaper-form {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  /* 修复：使用主题变量，不再使用白色背景 */
  background: var(--app-bg-card) !important;
  border: 1px solid var(--app-border) !important;
  padding: 8px;
  border-radius: 4px;
  /* 修复：暗色模式下的阴影 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
  margin-top: 4px;
  width: 200px;
}

:global(.el-select-dropdown__item.hover),
:global(.el-select-dropdown__item.is-hovering),
:global(.el-select-dropdown__item:hover) {
  background-color: var(--app-bg-hover) !important;
  color: var(--app-color-primary) !important;
}

/* 针对下拉列表容器本身的背景适配 */
:global(.el-select-dropdown__list) {
  background-color: var(--app-bg-card) !important;
}

:global(.el-select-dropdown) {
  background-color: var(--app-bg-card) !important;
  border: 1px solid var(--app-border) !important;
}

:deep(.el-upload-list__item) {
  overflow: visible !important;
  margin-bottom: 80px !important;
  /* Reserve space for form */
  background-color: var(--app-bg-card) !important;
  border: 1px solid var(--app-border) !important;
}

/* 1. 同时针对 input 和 textarea 的计数器进行彻底透明化 */
:deep(.el-input__count) {
  background: transparent !important;
  background-color: transparent !important;
  /* 双重保险 */
  box-shadow: none !important;
  /* 某些版本自带内阴影 */
  color: var(--el-text-color-secondary) !important;
  /* 确保文字颜色在深色模式可见 */
}

/* 2. 专门针对 el-input 内部嵌套的计数器 */
:deep(.el-input__count-inner) {
  background: transparent !important;
}

/* 3. 如果 0/80 依然有白色背景，可能是因为它所在的 wrapper 限制了 */
/* 统一输入框外层容器的背景 */
:deep(.el-input__wrapper) {
  background-color: var(--app-bg-card) !important;
  /* 确保边框和内阴影也适配暗色 */
  box-shadow: 0 0 0 1px var(--app-border) inset !important; 
}

/* 确保内部 input 标签也是透明的，从而露出容器的背景 */
:deep(.el-input__inner) {
  background: transparent !important;
  color: var(--app-text-main) !important;
}

/* 适配获得焦点时的状态，防止出现亮色边框 */
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--app-color-primary) inset !important;
}

/* 4. 针对 textarea 的计数器（你已经解决的部分，保持一致） */
:deep(.el-textarea .el-input__count) {
  background: transparent !important;
  bottom: 5px;
  /* 调整位置避免压线 */
  right: 10px;
}

:deep(.el-upload--picture-card) {
  background-color: var(--app-bg-hover);
  border-color: var(--app-border);
}

:deep(.el-upload--picture-card:hover) {
  border-color: var(--app-color-primary);
  color: var(--app-color-primary);
}
</style>
