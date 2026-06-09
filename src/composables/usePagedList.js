import { computed, ref } from 'vue'
import { normalizePagedResult } from '@/utils/normalizers'

const STALE_REQUEST_CODE = 'STALE_REQUEST'

export const createStaleRequestError = () => {
  const error = new Error('Stale request ignored')
  error.code = STALE_REQUEST_CODE
  return error
}

export const isStaleRequestError = (error) => error?.code === STALE_REQUEST_CODE

export const useCancelableRequest = () => {
  const loading = ref(false)
  let requestId = 0

  const run = async (task) => {
    const currentRequestId = ++requestId
    loading.value = true

    try {
      const result = await task()
      if (currentRequestId !== requestId) throw createStaleRequestError()
      return result
    } catch (error) {
      if (currentRequestId !== requestId) throw createStaleRequestError()
      throw error
    } finally {
      if (currentRequestId === requestId) loading.value = false
    }
  }

  const cancel = () => {
    requestId += 1
    loading.value = false
  }

  return {
    loading,
    run,
    cancel
  }
}

export const usePagedList = ({
  fetcher,
  getParams = () => ({}),
  normalizeItem = (item) => item,
  initialPage = 1,
  initialPageSize = 10
} = {}) => {
  if (typeof fetcher !== 'function') {
    throw new TypeError('usePagedList requires a fetcher function')
  }

  const items = ref([])
  const total = ref(0)
  const page = ref(initialPage)
  const pageSize = ref(initialPageSize)
  const error = ref(null)
  const { loading, run, cancel } = useCancelableRequest()

  const hasMore = computed(() => items.value.length < total.value)

  const load = async (options = {}) => {
    const nextPage = options.page ?? page.value
    const nextPageSize = options.pageSize ?? pageSize.value
    const shouldAppend = Boolean(options.append)

    page.value = nextPage
    pageSize.value = nextPageSize
    error.value = null

    try {
      const params = {
        ...getParams({ page: nextPage, pageSize: nextPageSize }),
        page: nextPage,
        size: nextPageSize
      }
      const result = await run(() => fetcher(params))
      const pageData = normalizePagedResult(result, normalizeItem)

      items.value = shouldAppend ? [...items.value, ...pageData.items] : pageData.items
      total.value = pageData.total
      page.value = pageData.page || nextPage
      pageSize.value = pageData.size || nextPageSize

      return pageData
    } catch (loadError) {
      if (!isStaleRequestError(loadError)) error.value = loadError
      throw loadError
    }
  }

  const reset = () => {
    cancel()
    items.value = []
    total.value = 0
    page.value = initialPage
    pageSize.value = initialPageSize
    error.value = null
  }

  return {
    items,
    total,
    page,
    pageSize,
    loading,
    error,
    hasMore,
    load,
    reset,
    cancel
  }
}
