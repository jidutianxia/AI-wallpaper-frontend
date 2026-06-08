import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '') // 如果后端不需要 /api 前缀，可以开启这行
      }
    }
  },
  test: {
    environment: 'happy-dom',
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,vue}'],
      exclude: ['src/main.js', 'src/test/**', 'src/**/*.test.js', 'src/**/__tests__/**']
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('element-plus') || id.includes('@element-plus')) return 'vendor-element'
          if (id.includes('vue') || id.includes('pinia')) return 'vendor-vue'
          if (id.includes('axios') || id.includes('@vueuse')) return 'vendor-utils'
          if (id.includes('viewer') || id.includes('v-viewer')) return 'vendor-viewer'
          return 'vendor'
        }
      }
    }
  }
})
