import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const elementComponentGroups = {
  'vendor-element-forms': new Set([
    'autocomplete', 'cascader', 'cascader-panel', 'checkbox', 'color-picker',
    'color-picker-panel', 'date-picker', 'date-picker-panel', 'form', 'input',
    'input-number', 'input-tag', 'mention', 'radio', 'rate', 'select',
    'select-v2', 'slider', 'switch', 'time-picker', 'time-select', 'transfer',
    'tree-select', 'upload'
  ]),
  'vendor-element-overlays': new Set([
    'alert', 'dialog', 'drawer', 'dropdown', 'focus-trap', 'loading', 'message',
    'message-box', 'notification', 'overlay', 'popconfirm', 'popover', 'popper',
    'tooltip', 'tour'
  ]),
  'vendor-element-data': new Set([
    'avatar', 'badge', 'calendar', 'card', 'carousel', 'descriptions', 'empty',
    'image', 'image-viewer', 'pagination', 'progress', 'result', 'skeleton',
    'statistic', 'table', 'table-v2', 'tag', 'text', 'timeline', 'tree',
    'tree-v2', 'virtual-list', 'watermark'
  ]),
  'vendor-element-layout': new Set([
    'affix', 'anchor', 'backtop', 'breadcrumb', 'button', 'col', 'collapse',
    'collapse-transition', 'collection', 'config-provider', 'container',
    'divider', 'icon', 'infinite-scroll', 'link', 'menu', 'page-header',
    'roving-focus-group', 'row', 'scrollbar', 'segmented', 'slot', 'space',
    'steps', 'teleport'
  ])
}

const getElementComponentChunk = (componentName) => {
  for (const [chunkName, components] of Object.entries(elementComponentGroups)) {
    if (components.has(componentName)) return chunkName
  }
  return 'vendor-element-components'
}

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
          const normalizedId = id.replace(/\\/g, '/')
          if (!normalizedId.includes('node_modules')) return
          if (normalizedId.includes('@element-plus/icons-vue')) return 'vendor-element-icons'
          if (
            normalizedId.includes('@popperjs/') ||
            normalizedId.includes('async-validator') ||
            normalizedId.includes('lodash-unified') ||
            normalizedId.includes('@ctrl/tinycolor')
          ) return 'vendor-element-support'
          if (normalizedId.includes('element-plus/es/components/')) {
            const match = normalizedId.match(/element-plus\/es\/components\/([^/]+)/)
            return getElementComponentChunk(match?.[1] || 'components')
          }
          if (
            normalizedId.includes('element-plus/es/hooks/') ||
            normalizedId.includes('element-plus/es/tokens/') ||
            normalizedId.includes('element-plus/es/utils/') ||
            normalizedId.includes('element-plus/es/constants/')
          ) return 'vendor-element-core'
          if (normalizedId.includes('element-plus')) return 'vendor-element'
          if (normalizedId.includes('vue') || normalizedId.includes('pinia')) return 'vendor-vue'
          if (normalizedId.includes('axios') || normalizedId.includes('@vueuse')) return 'vendor-utils'
          if (normalizedId.includes('viewer') || normalizedId.includes('v-viewer')) return 'vendor-viewer'
          return 'vendor'
        }
      }
    }
  }
})
