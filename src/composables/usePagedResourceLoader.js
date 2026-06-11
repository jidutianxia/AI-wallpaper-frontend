import { normalizePagedResult } from '@/utils/normalizers'

export function usePagedResourceLoader({ loading, errors, isActive = () => true } = {}) {
  const requestIds = new Map()

  const loadPagedResource = async ({ loadingKey, target, request, normalizeItem, onLoaded }) => {
    const resourceKey = loadingKey || Symbol('paged-resource')
    const requestId = (requestIds.get(resourceKey) || 0) + 1
    requestIds.set(resourceKey, requestId)
    if (loading && loadingKey) loading[loadingKey] = true
    if (errors && loadingKey) errors[loadingKey] = null

    try {
      const response = await request()
      if (!isActive() || requestIds.get(resourceKey) !== requestId) return null
      const pageData = normalizePagedResult(response, normalizeItem)
      target.value = pageData.items
      onLoaded?.(pageData)
      return pageData
    } catch (error) {
      if (!isActive() || requestIds.get(resourceKey) !== requestId) return null
      if (errors && loadingKey) errors[loadingKey] = error
      target.value = []
      return null
    } finally {
      if (loading && loadingKey && isActive() && requestIds.get(resourceKey) === requestId) {
        loading[loadingKey] = false
      }
    }
  }

  return { loadPagedResource }
}
