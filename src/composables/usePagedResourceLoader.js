import { normalizePagedResult } from '@/utils/normalizers'

export function usePagedResourceLoader({ loading, isActive = () => true } = {}) {
  const loadPagedResource = async ({ loadingKey, target, request, normalizeItem, onLoaded }) => {
    if (loading && loadingKey) loading[loadingKey] = true
    try {
      const response = await request()
      if (!isActive()) return null
      const pageData = normalizePagedResult(response, normalizeItem)
      target.value = pageData.items
      onLoaded?.(pageData)
      return pageData
    } catch {
      if (!isActive()) return null
      target.value = []
      return null
    } finally {
      if (loading && loadingKey && isActive()) loading[loadingKey] = false
    }
  }

  return { loadPagedResource }
}
