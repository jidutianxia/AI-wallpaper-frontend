<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const visible = defineModel({ type: Boolean, default: false })

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const form = ref({
  username: '',
  password: ''
})

watch(visible, (open) => {
  const el = document.documentElement
  if (open) el.classList.add('dialog-open')
  else el.classList.remove('dialog-open')
})

const close = () => {
  visible.value = false
}

const goRegister = () => {
  close()
  router.push('/register')
}

const submit = async () => {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    await userStore.login(form.value)
    ElMessage.success('登录成功')
    close()
    form.value = { username: '', password: '' }
  } catch (error) {
    ElMessage.error('登录失败：' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-dialog v-model="visible" title="用户登录" width="420px" class="login-dialog">
    <div class="auth-banner">
      <el-icon class="banner-icon"><User /></el-icon>
      <div class="banner-text">欢迎回来，登录后可发布、点赞与收藏</div>
    </div>
    <el-form :model="form" label-width="80px" size="large" class="login-form">
      <el-form-item label="用户名">
        <el-input v-model="form.username" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="密码">
        <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="login-btn-group">
        <el-button class="login-btn" @click="close">取消</el-button>
        <el-button class="login-btn" @click="goRegister">注册</el-button>
        <el-button class="login-btn" type="primary" :loading="loading" @click="submit">登录</el-button>
      </div>
    </template>
  </el-dialog>
</template>
