<script setup>
import { ref } from 'vue'
import { Sunny, Moon, Top, Setting } from '@element-plus/icons-vue'
import { useTheme } from '@/composables/useTheme'

defineEmits(['settings'])

const { isDark, toggleTheme } = useTheme()
const actionsSide = ref('right')

const toggleActionsSide = () => {
  actionsSide.value = actionsSide.value === 'right' ? 'left' : 'right'
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="floating-actions" :class="actionsSide">
    <el-button class="fab" circle title="切换主题" @click="toggleTheme()">
      <el-icon v-if="isDark"><Sunny /></el-icon>
      <el-icon v-else><Moon /></el-icon>
    </el-button>
    <el-button class="fab" circle title="切换位置" @click="toggleActionsSide">
      <span class="icon-text">↔</span>
    </el-button>
    <el-button class="fab" circle title="设置" @click="$emit('settings')">
      <el-icon><Setting /></el-icon>
    </el-button>
    <el-button class="fab" circle title="返回顶部" @click="scrollToTop">
      <el-icon><Top /></el-icon>
    </el-button>
  </div>
</template>
