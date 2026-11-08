<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthSession } from '@/composables/useAuthSession'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import FloatingActions from '@/components/layout/FloatingActions.vue'
import AuthDialog from '@/components/layout/AuthDialog.vue'
import NotificationCenter from '@/components/layout/NotificationCenter.vue'

const showLoginDialog = ref(false)
const showNotifyDialog = ref(false)
const { initTheme } = useTheme()
const { handleLogout, cancelAuthRedirect } = useAuthSession({
  onAuthRequired: () => {
    showLoginDialog.value = true
  },
})

watch(showLoginDialog, (open) => { if (!open) cancelAuthRedirect?.() })

onMounted(() => {
  initTheme()
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('dialog-open')
})
</script>

<template>
  <div id="app" :class="{ platform: !$route?.meta?.designPreview }">
    <AppNavbar
      v-if="!$route?.meta?.designPreview"
      @login="showLoginDialog = true"
      @logout="handleLogout"
      @notify="showNotifyDialog = true"
    />

    <FloatingActions v-if="!$route?.meta?.designPreview" />

    <a href="#main-content" class="skip-link">跳转到内容</a>
    <main id="main-content" class="main-content" tabindex="-1">
      <router-view v-slot="{ Component, route } = {}"><Transition name="page-reveal" mode="out-in"><component :is="Component" :key="route?.path" /></Transition></router-view>
    </main>

    <AuthDialog v-model="showLoginDialog" />
    <NotificationCenter v-model="showNotifyDialog" />
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}
#app {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  color: var(--app-text-main);
  background: var(--app-bg-base);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding-left: 48px;
  padding-right: 48px;
}
.main-content {
  flex: 1;
  min-width: 0;
}
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--app-bg-base);
  border-bottom: 1px solid var(--app-border);
}
.nav-container {
  max-width: 1600px;
  margin: auto;
  min-height: 72px;
  padding: 12px 48px;
  display: flex;
  align-items: center;
  gap: 32px;
}
.nav-left,
.nav-links,
.nav-right {
  display: flex;
  align-items: center;
  gap: 24px;
}
.nav-left {
  flex-shrink: 0;
}
.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--app-text-main);
  font-size: 20px;
  font-weight: 650;
  letter-spacing: -0.05em;
  white-space: nowrap;
}
.nav-link {
  color: var(--app-text-secondary);
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  white-space: nowrap;
}
.nav-links .router-link-exact-active {
  color: var(--app-text-main);
  box-shadow: 0 1px var(--app-text-main);
}
.nav-center {
  flex: 1;
  position: relative;
  min-width: 80px;
  margin-left: auto;
  max-width: 380px;
}
.nav-right {
  margin-left: auto;
  gap: 12px;
  flex-shrink: 0;
}
.nav-avatar {
  margin-right: 8px;
}
.search-input .el-input__wrapper {
  background: var(--app-bg-hover);
  border-radius: 10px;
  box-shadow: none;
  min-height: 42px;
}
.search-categories {
  position: absolute;
  top: 52px;
  left: 0;
  width: max(100%, 340px);
  max-width: calc(100vw - 40px);
  padding: 16px;
  background: var(--app-bg-card);
  border: 1px solid var(--app-border);
  border-radius: 14px;
  box-shadow: var(--app-shadow-hover);
}
.main-cats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cat-pill {
  padding: 8px 12px;
  font-size: 13px;
  background: transparent;
  box-shadow: none;
  width: 100%;
  text-align: left;
}
.cat-pill.active {
  background: var(--app-bg-hover);
}
.sub-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
}
.sub-item {
  font-size: 12px;
  padding: 8px 12px;
  border: 1px solid var(--app-border);
  background: var(--app-bg-card);
  box-shadow: none;
}
.color-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}
.theme-switch {
  margin-left: 4px;
}
.hamburger {
  display: none !important;
}
.mobile-menu {
  position: sticky;
  top: 80px;
  z-index: 99;
  background: var(--app-bg-card);
  padding: 12px 24px;
  border-bottom: 1px solid var(--app-border);
  display: flex;
  gap: 24px;
}
.mobile-link {
  padding: 8px;
  color: var(--app-text-main);
}
.floating-actions {
  position: fixed;
  right: 20px;
  bottom: 24px;
  z-index: 90;
}
.fab {
  width: 44px !important;
  height: 44px !important;
  margin: 0 !important;
  background: var(--app-bg-card) !important;
  color: var(--app-text-main) !important;
  border: 1px solid var(--app-border) !important;
  box-shadow: var(--app-shadow-card) !important;
}
.login-btn-group {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.auth-banner {
  padding: 16px 0;
  display: flex;
  gap: 8px;
  color: var(--app-text-secondary);
  font-size: 13px;
}
.login-form {
  padding-top: 16px;
}
.notify-container {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 16px;
}
.notify-nav {
  display: grid;
  gap: 8px;
}
.notify-item {
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  cursor: pointer;
}
.notify-item.active {
  background: var(--app-bg-hover);
}
.notify-card {
  margin-bottom: 10px;
}
.notify-title {
  font-weight: 600;
}
.notify-time {
  font-size: 12px;
  color: var(--app-text-secondary);
}
.skip-link {
  position: fixed;
  left: 16px;
  top: -80px;
  z-index: 300;
  background: var(--app-bg-card);
  padding: 12px 20px;
}
.skip-link:focus {
  top: 12px;
}
@media (max-width: 1100px) {
  .nav-container {
    padding-inline: 24px;
    gap: 20px;
  }
  .nav-links,
  .nav-left {
    gap: 16px;
  }
  .container {
    padding-inline: 32px;
  }
}
@media (max-width: 768px) {
  .container {
    padding-inline: 20px;
  }
  .nav-container {
    flex-wrap: wrap;
    min-height: 72px;
    padding: 12px 20px;
    gap: 8px 16px;
  }
  .nav-left {
    flex: 1;
    gap: 12px;
  }
  .nav-links {
    display: none;
  }
  .hamburger {
    display: inline-flex !important;
    padding: 8px !important;
    min-width: 40px;
    min-height: 40px;
  }
  .nav-center {
    order: 3;
    flex-basis: 100%;
    max-width: none;
  }
  .nav-right {
    gap: 8px;
  }
  .nav-right .nav-link {
    max-width: 88px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .nav-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
  }
  .theme-switch {
    margin: 0;
  }
  .mobile-menu {
    position: static;
  }
  .notify-container {
    grid-template-columns: 1fr;
  }
  .notify-nav {
    grid-template-columns: repeat(2, 1fr);
  }
  .floating-actions {
    right: 12px;
    bottom: 16px;
  }
}
.brand-mark {
  width: 26px;
  height: 26px;
  fill: none;
  stroke: var(--app-text-main);
  stroke-width: 1.4;
}
.nav-links .router-link-exact-active {
  box-shadow: 0 2px var(--app-color-primary);
}
</style>

<style src="./styles/platform.css"></style>

<style src="./styles/interactions.css"></style>
