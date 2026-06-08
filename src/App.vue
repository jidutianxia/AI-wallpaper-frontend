<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthSession } from '@/composables/useAuthSession'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import FloatingActions from '@/components/layout/FloatingActions.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AuthDialog from '@/components/layout/AuthDialog.vue'
import NotificationCenter from '@/components/layout/NotificationCenter.vue'

const showLoginDialog = ref(false)
const showSettingsDrawer = ref(false)
const showNotifyDialog = ref(false)
const { initTheme } = useTheme()
const { handleLogout } = useAuthSession({
  onAuthRequired: () => {
    showLoginDialog.value = true
  }
})

onMounted(() => {
  initTheme()
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('dialog-open')
})
</script>

<template>
  <div id="app">
    <AppNavbar
      @login="showLoginDialog = true"
      @logout="handleLogout"
      @notify="showNotifyDialog = true"
    />

    <FloatingActions @settings="showSettingsDrawer = true" />

    <main class="main-content">
      <router-view />
    </main>

    <AppFooter />
    <AuthDialog v-model="showLoginDialog" />
    <NotificationCenter v-model="showNotifyDialog" />

    <el-drawer v-model="showSettingsDrawer" title="快捷设置" direction="rtl" size="240px">
      <div class="settings">
        <div class="settings-item" style="justify-content: center; color: #909399; padding: 20px 0;">
          暂无更多设置
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--app-text-main);
  background-color: var(--app-bg-base);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgba(255,255,255,.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0,0,0,.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}
.dark .navbar { background-color: #0f172a; border-bottom-color: #1f2937; backdrop-filter: none; box-shadow: 0 4px 20px rgba(0,0,0,.35); }

.dialog-open .navbar { backdrop-filter: none !important; }

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 2rem;
  max-width: 100rem; /* 1600px */
  margin: 0 auto;
  height: 4.5rem; /* 72px */
  position: relative;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 2rem;
  overflow: hidden;
  max-width: 600px;
  opacity: 1;
  transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}

.nav-left.nav-hidden {
  max-width: 0;
  opacity: 0;
  gap: 0;
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #409eff 0%, #a0cfff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-decoration: none;
  white-space: nowrap;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
  white-space: nowrap;
}

.hamburger {
  display: none;
  margin-right: 12px;
  font-size: 20px;
  cursor: pointer;
}

.nav-center {
  flex: 1;
  max-width: 25rem;
  min-width: 18.75rem; /* 300px */
  margin: 0 2rem;
  transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1); /* Smoother timing */
  position: relative;
  flex-shrink: 0; /* Prevent squashing by other elements */
}

.nav-center.expanded {
  max-width: 75rem; /* 1200px */
  margin: 0;
  flex: 1;
  display: flex;
  justify-content: flex-start;
  /* Shift left */
  transform: translateX(0); 
}

.search-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.search-input {
  width: 100%;
  transition: all 0.3s;
}

.nav-center.expanded .search-input {
  width: 320px; /* Width of the red box area roughly */
}

/* Search Categories */
.search-categories {
  display: flex;
  align-items: center;
  position: relative;
}

.main-cats {
  display: flex;
  gap: 8px;
}

.cat-group {
  position: relative;
  display: flex;
  align-items: center;
}

.cat-pill {
  padding: 6px 16px;
  border-radius: 99px;
  background: linear-gradient(#ffffff,#ffffff) padding-box, linear-gradient(135deg,#93c5fd,#f0abfc) border-box;
  border: 1px solid transparent;
  color: #606266;
  font-size: 0.9rem;
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease, color .2s ease;
  white-space: nowrap;
}
.cat-pill:hover, .cat-pill.active {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(37,99,235,.25);
  color: #409eff;
}
.dark .cat-pill {
  color: #cbd5e1;
  background: linear-gradient(#0b1220,#0b1220) padding-box, linear-gradient(135deg,#3b82f6,#a78bfa) border-box;
}
.dark .cat-pill:hover, .dark .cat-pill.active { box-shadow: 0 8px 20px rgba(37,99,235,.35); color: #93c5fd; }

/* Sub Categories Dropdown */
.sub-dropdown {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 12px;
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
  min-width: 260px;
  z-index: 101;
}

.dark .sub-dropdown {
  background: transparent;
  border-color: transparent;
}

.sub-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.sub-item {
  padding: 8px 16px;
  border-radius: 99px;
  text-align: center;
  background: #fff;
  border: 1px solid #e4e7ed;
  color: #606266;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.sub-item:hover {
  background: #f5f7fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  color: #409eff;
  border-color: #c6e2ff;
}

.dark .sub-item { 
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0; 
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}
.dark .sub-item:hover { 
  background: #1e293b; 
  color: #fff;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6);
  border-color: rgba(255, 255, 255, 0.3);
}

.color-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  border: 1px solid rgba(0,0,0,0.1);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-link {
  display: inline-flex;  /* 变为弹性盒子 */
  align-items: center;   /* 垂直居中核心属性 */
  gap: 8px;              /* 在头像和文字之间加点间距，比 margin 更好用 */
  
  text-decoration: none;
  color: #606266;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s;
}

.nav-link:hover {
  color: #409eff;
}

.main-content {
  flex: 1;
  padding-top: 2rem;
}

.theme-switch { margin-left: 12px; }

/* Dark Mode - Navbar override removed, variables handle it */
:root.dark .nav-link { color: var(--app-text-secondary); }
:root.dark .nav-link:hover { color: var(--app-color-primary); }

/* Custom Login Dialog Buttons */
.login-btn-group {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.login-dialog .el-dialog__footer {
  padding-top: 10px;
  padding-bottom: 24px;
}
.login-btn {
  padding: 8px 20px !important;
  height: 32px !important;
  border-radius: var(--radius-sm) !important;
  font-weight: 500;
  box-shadow: var(--shadow-1);
}
.auth-banner { display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:10px; background: rgba(147,197,253,.12); margin: 4px 0 8px; }
.banner-icon { color:#409eff; }
.banner-text { font-size: 13px; opacity:.9; }
.login-form { padding-top: 6px; }
.nav-avatar { margin-right: 8px; }
.notify-btn { margin-right: 8px; }

.floating-actions {
  position: fixed;
  right: 1rem;
  bottom: 6rem;
  display: none; /* Hidden on Desktop */
  flex-direction: column;
  align-items: center;
  gap: 1rem; /* Increased gap slightly */
  z-index: 200;
}
.floating-actions.left { left: 1rem; right: auto; }
.fab { 
  width: 40px; 
  height: 40px; 
  padding: 0; 
  margin-left: 0 !important; /* Fix alignment issue */
  font-size: 1.1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
}
.fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}
.dark .fab {
  background: #1f2937;
  color: #e5e7eb;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}
.icon-text { font-size: 18px; line-height: 1; font-weight: bold; }
.settings { display: flex; flex-direction: column; gap: 1rem; }
.settings-item { display: flex; justify-content: space-between; align-items: center; }

/* Mobile Responsive */
@media (max-width: 768px) {
  .nav-container { padding: 0.6rem 1rem; height: auto; min-height: 3.5rem; flex-wrap: wrap; }
  .nav-links { display: none; }
  .hamburger { display: block; margin-right: 12px; font-size: 20px; cursor: pointer; }
  .nav-right { gap: 0.5rem; margin-left: auto; } /* Push right */
  .theme-switch { display: none; }
  
  .nav-left { gap: 1rem; }

  /* Search Bar Adaptation */
  .nav-center { 
    max-width: 100%; 
    margin: 0.5rem 0 0; 
    order: 3; /* Move search to bottom line on mobile */
    width: 100%;
    flex-basis: 100%;
  }
  .nav-center.expanded { max-width: 100%; }
  
  .search-wrapper { gap: 0.5rem; flex-direction: column; align-items: stretch; }
  .search-input { width: 100% !important; } /* Full width input */
  
  .search-categories { 
    flex-direction: column; 
    align-items: flex-start; 
    width: 100%;
    overflow: hidden;
    margin-top: 4px;
  }
  
  /* Horizontal Scroll for Categories */
  .main-cats { 
    display: flex; /* Show cats */
    overflow-x: auto; 
    gap: 0.5rem; 
    width: 100%;
    padding-bottom: 0; 
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .main-cats::-webkit-scrollbar { display: none; } /* Hide scrollbar */
  
  .sub-dropdown { position: fixed; left: 0; right: 0; bottom: 0; top: auto; transform: none; margin: 0; min-width: 100%; background: var(--app-bg-card); border-top: 1px solid var(--app-border); padding: 16px; z-index: 2000; border-radius: 16px 16px 0 0; box-shadow: 0 -4px 20px rgba(0,0,0,0.1); }
  
  .sub-list { grid-template-columns: repeat(3, 1fr); gap: 12px; }
  
  .cat-pill { padding: 0.375rem 0.875rem; flex-shrink: 0; }
  .sub-item { padding: 0.5rem; font-size: 13px; }
  
  .mobile-menu { padding: 0.5rem 1rem; background: var(--app-bg-card); border-top: 1px solid var(--app-border); }
  .mobile-link { display: block; padding: 0.75rem 0; color: inherit; text-decoration: none; }
  
  /* Floating Actions Mobile Optimization */
  .floating-actions { 
    display: flex; 
    bottom: 2rem; /* Lower position */
    right: 0.8rem;
    gap: 0.8rem;
  }
  .fab { 
    width: 36px; 
    height: 36px; 
    font-size: 1rem; 
  }
  
  /* Footer Mobile Optimization */
  .footer { padding-bottom: 6rem; /* Avoid overlap with FAB */ }
  .footer-content { grid-template-columns: 1fr; gap: 2rem; }
  .footer-links { grid-template-columns: 1fr; gap: 1.5rem; }
  .link-group h4 { margin-bottom: 0.5rem; }
  .newsletter { flex-direction: column; }
  .newsletter .el-button { width: 100%; }
}

/* Tablet Responsive */
@media (min-width: 768px) and (max-width: 1024px) {
  .nav-center { max-width: 56rem; }
  .sub-list { grid-template-columns: 1fr 1fr; }
  .search-wrapper { gap: 1rem; }
  .floating-actions { display: flex; }
}



/* Footer Styles */
.footer {
  background: var(--app-bg-card);
  color: var(--app-text-main);
  padding: 3rem 0 1rem;
  margin-top: 4rem;
  border-top: 1px solid var(--app-border);
}
/* Removed dark override */

.container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }

.footer-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 3rem;
  margin-bottom: 2rem;
}

.footer-brand h3 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #a0cfff;
}

.footer-brand p { opacity: 0.8; line-height: 1.6; }

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.link-group h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #a0cfff;
}

.link-group ul { list-style: none; padding: 0; }
.link-group li { margin-bottom: 0.5rem; }
.link-group a { color: rgba(255,255,255,0.7); text-decoration: none; transition: 0.3s; }
.link-group a:hover { color: #a0cfff; }
.link-group p { opacity: 0.8; margin-bottom: 1rem; font-size: 0.9rem; }

.newsletter { display: flex; gap: 0.5rem; }

.footer-bottom {
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 1rem;
  text-align: center;
  opacity: 0.6;
}

/* Removed duplicate media query */

/* Notify Styles moved from global */
.notify-container { display: grid; grid-template-columns: 160px 1fr; gap: 12px; }
.notify-nav { display: grid; gap: 8px; }
.notify-item { 
  height: 36px; 
  border-radius: 18px; 
  background: var(--app-bg-card); 
  border: 1px solid var(--app-border); 
  color: var(--app-text-main);
  cursor: pointer;
  transition: all 0.2s;
}
.notify-item:hover { border-color: var(--app-color-primary); }
.notify-item.active { 
  background: var(--app-color-primary); 
  color: #fff; 
  border-color: var(--app-color-primary); 
}
.notify-card { margin-bottom: 8px; }
.notify-title { 
  font-weight: 600; 
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}
.notify-time { 
  font-size: 12px; 
  color: var(--el-text-color-secondary);
  margin-top: 6px;
}
</style>


