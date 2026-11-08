<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AuthSurface from '@/components/AuthSurface.vue'
import { User, Lock, Right } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const visible = defineModel({ type: Boolean, default: false })

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const loginError = ref('')
const form = ref({
  username: '',
  password: ''
})

watch(visible, (open) => {
  if (open) loginError.value = ''
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
  if (loading.value) return
  loginError.value = ''
  if (!form.value.username || !form.value.password) {
    loginError.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  try {
    await userStore.login(form.value)
    ElMessage.success('登录成功')
    close()
    form.value = { username: '', password: '' }
  } catch (error) {
    loginError.value = error.response?.data?.message || '用户名或密码不正确'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-dialog v-model="visible" title="登录" width="min(920px, calc(100vw - 28px))" align-center :show-close="false" class="auth-dialog" modal-class="auth-overlay" destroy-on-close>
    <AuthSurface mode="login" @switch="goRegister" @close="close">
      <el-form :model="form" label-position="top" class="auth-form" @submit.prevent="submit" @keyup.enter="!$event.isComposing && submit()">
        <el-form-item label="用户名"><el-input v-model="form.username" autocomplete="username" aria-label="用户名"><template #prefix><el-icon><User /></el-icon></template></el-input></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" type="password" autocomplete="current-password" aria-label="密码" show-password><template #prefix><el-icon><Lock /></el-icon></template></el-input></el-form-item>
        <p v-if="loginError" role="alert" class="auth-error">{{ loginError }}</p>
        <el-button class="auth-submit" type="primary" :loading="loading" @click="submit"><span>登录</span><el-icon v-if="!loading"><Right /></el-icon></el-button>
      </el-form>
    </AuthSurface>
  </el-dialog>
</template>
