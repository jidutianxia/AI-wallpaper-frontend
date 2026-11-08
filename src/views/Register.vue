<template>
  <div class="auth-register-page">
    <AuthSurface mode="register" @switch="goLogin" @close="router.push('/')">
      <el-form :model="form" label-position="top" class="auth-form" @submit.prevent="submit" @keyup.enter="!$event.isComposing && submit()">
        <el-form-item label="用户名"><el-input v-model="form.username" autocomplete="username" aria-label="用户名" maxlength="30"><template #prefix><el-icon><User /></el-icon></template></el-input></el-form-item>
        <el-form-item label="邮箱（选填）"><el-input v-model="form.email" autocomplete="email" aria-label="邮箱" type="email"><template #prefix><el-icon><Message /></el-icon></template></el-input></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" autocomplete="new-password" aria-label="密码" type="password" show-password><template #prefix><el-icon><Lock /></el-icon></template></el-input></el-form-item>
        <el-form-item label="确认密码" :error="passwordError"><el-input ref="confirmInput" v-model="form.confirmPassword" autocomplete="new-password" aria-label="确认密码" type="password" show-password @input="passwordError = ''"><template #prefix><el-icon><Lock /></el-icon></template></el-input></el-form-item>
        <p v-if="error" role="alert" class="auth-error">{{ error }}</p>
        <el-button class="auth-submit" type="primary" :loading="loading" @click="submit"><span>创建账户</span><el-icon v-if="!loading"><Right /></el-icon></el-button>
      </el-form>
    </AuthSurface>
  </div>
</template>

<script setup>
import AuthSurface from '@/components/AuthSurface.vue'
import { User, Message, Lock, Right } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { requestAuth } from '@/utils/authEvents'

const router = useRouter()
const userStore = useUserStore()
const form = ref({ username: '', email: '', password: '', confirmPassword: '' })
const loading = ref(false)
const error = ref('')
const passwordError = ref('')
const confirmInput = ref(null)

const submit = async () => {
  if (loading.value) return
  error.value = ''
  if (!form.value.username.trim() || !form.value.password) { error.value = '请输入用户名和密码'; return }
  if (form.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) { error.value = '请输入有效的邮箱地址'; return }
  if (form.value.password !== form.value.confirmPassword) { passwordError.value = '两次输入的密码不一致'; confirmInput.value?.focus?.(); return }
  passwordError.value = ''
  loading.value = true
  try {
    const { confirmPassword, ...payload } = form.value
    await userStore.register(payload)
    ElMessage.success('账户已创建')
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.message || '注册未完成，请重试'
  } finally { loading.value = false }
}
const goLogin = () => {
  router.push('/')
  requestAuth({ reason: 'login-link' })
}
</script>
