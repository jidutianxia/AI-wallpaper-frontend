import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// import VueLazyLoad from 'vue3-lazy'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 自研懒加载指令
app.directive('lazy', {
  mounted(el, binding) {
    const src = binding.value
    if (!('IntersectionObserver' in window)) {
      el.setAttribute('src', src)
      return
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          el.setAttribute('src', src)
          observer.unobserve(el)
        }
      })
    }, { rootMargin: '100px' })
    // 占位背景以减轻白屏
    el.style.background = 'linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.15))'
    el.style.minHeight = '80px'
    observer.observe(el)
  }
})
app.mount('#app')
    
