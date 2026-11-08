import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const loadUseTheme = async () => {
  vi.resetModules()
  return import('../useTheme')
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    window.matchMedia = vi.fn().mockReturnValue({ matches: false })
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('initializes dark mode from localStorage', async () => {
    localStorage.setItem('theme', 'dark')
    const { useTheme } = await loadUseTheme()
    const { initTheme, isDark } = useTheme()

    initTheme()

    expect(isDark.value).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('defaults to dark mode when no saved theme exists', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    const { useTheme } = await loadUseTheme()
    const { initTheme, isDark } = useTheme()

    initTheme()

    expect(isDark.value).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggles theme class and persists the selected mode', async () => {
    const { useTheme } = await loadUseTheme()
    const { toggleTheme, isDark } = useTheme()

    toggleTheme()
    await nextTick()

    expect(isDark.value).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('preserves an explicitly selected light theme', async () => {
    localStorage.setItem('theme', 'light')
    const { useTheme } = await loadUseTheme()
    const { initTheme, isDark } = useTheme()
    initTheme()
    expect(isDark.value).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
