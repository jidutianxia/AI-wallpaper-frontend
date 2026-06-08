import { ref, watch } from 'vue'
import { getLocalStorageItem, setLocalStorageItem } from '@/utils/storage'

const isDark = ref(false)

export function useTheme() {
  // Initialize state based on current DOM (which is set by the inline script in App.vue or index.html)
  // or checks localStorage if DOM isn't ready yet (though App.vue script runs early)
  
  const initTheme = () => {
    const saved = getLocalStorageItem('theme')
    const html = document.documentElement
    
    // Check if class is already there (from App.vue early script)
    if (html.classList.contains('dark')) {
      isDark.value = true
      return
    }
    
    // Fallback if no early script ran
    if (saved === 'dark') {
      isDark.value = true
      html.classList.add('dark')
    } else if (saved === 'light') {
      isDark.value = false
      html.classList.remove('dark')
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      isDark.value = prefersDark
      if (prefersDark) html.classList.add('dark')
    }
  }

  const toggleTheme = () => {
    isDark.value = !isDark.value
  }

  watch(isDark, (val) => {
    const html = document.documentElement
    if (val) {
      html.classList.add('dark')
      setLocalStorageItem('theme', 'dark')
    } else {
      html.classList.remove('dark')
      setLocalStorageItem('theme', 'light')
    }
  }, { flush: 'post' })

  return {
    isDark,
    toggleTheme,
    initTheme
  }
}
