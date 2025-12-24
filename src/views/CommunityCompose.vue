<template>
  <div class="compose">
    <div class="container">
      <el-card class="composer">
        <h2 class="title">发布分享</h2>
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
              <el-icon><Plus /></el-icon>
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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { uploadWallpaper, createCommunityPost } from '@/api/wallpaper'

const form = ref({ title: '', content: '', tags: [], images: [] })
const tagOptions = ['插画', '风景', '极简', '赛博', '像素', '摄影']
const publishing = ref(false)

const onExceed = () => { ElMessage.warning('最多只能上传 10 张图片') }
const onHttpRequest = async (options) => {
  const { file, onSuccess, onError } = options
  const fd = new FormData()
  fd.append('file', file)
  try {
    const r = await uploadWallpaper(fd)
    onSuccess(r.data)
  } catch (e) {
    try { onSuccess({ url: URL.createObjectURL(file) }) } catch { onError(e) }
  }
}
const onUploadSuccess = (response) => { if (response?.url) form.value.images.push(response.url) }
const onUploadError = () => { ElMessage.error('上传失败，请检查登录权限或后端服务') }
const publish = async () => {
  if (!form.value.title || !form.value.content) { ElMessage.warning('请填写标题与内容'); return }
  publishing.value = true
  try {
    const payload = { title: form.value.title, content: form.value.content, tags: form.value.tags, imageUrls: form.value.images }
    await createCommunityPost(payload)
    reset()
    ElMessage.success('发布成功')
    location.assign('/community')
  } finally { publishing.value = false }
}
const reset = () => { form.value = { title: '', content: '', tags: [], images: [] } }
</script>

<style scoped>
.compose { padding: 2rem 0; }
.container { max-width: 900px; margin: 0 auto; padding: 0 2rem; }
.composer { padding: 1rem; }
.title { margin-bottom: 1rem; }
.upload { margin-top: 0.5rem; }
.actions { display: flex; gap: 12px; justify-content: flex-end; }
.dark :deep(.el-card.composer) { background:#1f2937; border-color:#374151; color:#e5e7eb; }
.dark .title { color:#e5e7eb; }
</style>
