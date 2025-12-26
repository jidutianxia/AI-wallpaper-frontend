<template>
  <div class="register">
    <div class="container">
      <el-card class="panel">
        <h2 class="title">创建账户</h2>
        <el-form :model="form" label-width="80px">
          <el-form-item label="用户名">
            <el-input v-model="form.username" maxlength="30" show-word-limit />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="form.email" type="email" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.password" type="password" show-password />
          </el-form-item>
          <div class="actions">
            <el-button type="primary" :loading="loading" @click="submit">注册</el-button>
            <el-button @click="goLogin">已有账号？登录</el-button>
          </div>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const form = ref({ username: '', email: '', password: '' })
const loading = ref(false)

const submit = async () => {
  if (!form.value.username || !form.value.password) { ElMessage.warning('请输入用户名和密码'); return }
  loading.value = true
  try {
    await userStore.register(form.value)
    ElMessage.success('注册成功，请登录')
    router.push('/')
    window.dispatchEvent(new CustomEvent('auth-required'))
  } catch (e) {
    ElMessage.error(e.response?.data?.message || e.message)
  } finally { loading.value = false }
}
const goLogin = () => { router.push('/'); window.dispatchEvent(new CustomEvent('auth-required')) }
</script>

<style scoped>
.register { padding: 2rem 0; }
.container { max-width: 560px; margin: 0 auto; padding: 0 2rem; }
.panel { box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
.panel { border-radius: var(--radius-lg); box-shadow: var(--shadow-3); border: 1px solid var(--border); background: var(--card-bg); }
.title { margin-bottom: 1rem; }
.actions { display: flex; gap: 12px; justify-content: flex-end; }
.actions :deep(.el-button) { border-radius: var(--radius-sm); box-shadow: var(--shadow-1); }
</style>
