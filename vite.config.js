import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const backend = env.VITE_BACKEND_ORIGIN || 'http://localhost:8080'
  return {
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    proxy: {
      '/uploads': { target: backend, changeOrigin: false },
      '/api': {
        target: backend,
        changeOrigin: false,
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
  }
}
})
