<script setup>
import { Close, TopRight, ArrowRight } from '@element-plus/icons-vue'
import '@/styles/auth-experience.css'
defineProps({ mode: { type: String, default: 'login' } })
defineEmits(['switch', 'close'])
</script>
<template>
  <section class="auth-surface" :class="`auth-${mode}`">
      <button type="button" class="auth-dismiss" :aria-label="mode === 'login' ? '关闭登录' : '返回首页'" :title="mode === 'login' ? '关闭' : '返回首页'" @click="$emit('close')"><el-icon><Close /></el-icon></button>
    <div class="auth-art" aria-hidden="true">
      <img class="auth-landscape" :src="'/preview-assets/forest.jpg'" alt="" />
      <div class="auth-art-shade" />
      <div class="auth-glass-window"><div class="auth-window-line" /><svg viewBox="0 0 100 100"><path d="M10 32V10h22M68 10h22v22M90 68v22H68M32 90H10V68"/><path d="m30 65 20-34 20 34"/></svg></div>
      <div class="auth-art-brand"><svg viewBox="0 0 24 24"><path d="M2 9V2h7M15 2h7v7M22 15v7h-7M9 22H2v-7M7 16l5-8 5 8"/></svg><span>AI 壁纸</span></div>
    </div>
    <div class="auth-content">

      <div class="auth-form-stage">
        <header class="auth-heading"><h1>{{ mode === 'login' ? '登录' : '注册' }}</h1><button type="button" class="auth-switch" data-auth-switch @click="$emit('switch')">{{ mode === 'login' ? '注册' : '登录' }}<el-icon><TopRight /></el-icon></button></header>
        <slot />
      </div>

    </div>
  </section>
</template>
