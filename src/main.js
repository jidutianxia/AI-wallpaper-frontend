import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'tailwindcss/tailwind.css'
import VueLazyLoad from 'vue3-lazyload'
import 'viewerjs/dist/viewer.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.use(VueLazyLoad)
app.mount('#app')
    