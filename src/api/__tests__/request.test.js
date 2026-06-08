import { afterEach, describe, expect, it, vi } from 'vitest'

const loadRequestModule = async ({ token = '' } = {}) => {
  vi.resetModules()

  const requestHandlers = []
  const responseHandlers = []
  const mockRequest = {
    interceptors: {
      request: {
        use: vi.fn((fulfilled, rejected) => {
          requestHandlers.push({ fulfilled, rejected })
        })
      },
      response: {
        use: vi.fn((fulfilled, rejected) => {
          responseHandlers.push({ fulfilled, rejected })
        })
      }
    }
  }
  const axiosCreate = vi.fn(() => mockRequest)
  const messageError = vi.fn()
  const messageWarning = vi.fn()
  const getLocalStorageItem = vi.fn(() => token)
  const removeLocalStorageItem = vi.fn()
  const requestAuth = vi.fn()

  vi.doMock('axios', () => ({
    default: {
      create: axiosCreate
    }
  }))
  vi.doMock('element-plus', () => ({
    ElMessage: {
      error: messageError,
      warning: messageWarning
    }
  }))
  vi.doMock('@/utils/storage', () => ({
    getLocalStorageItem,
    removeLocalStorageItem
  }))
  vi.doMock('@/utils/authEvents', () => ({
    requestAuth
  }))

  const module = await import('../request')

  return {
    module,
    axiosCreate,
    getLocalStorageItem,
    messageError,
    messageWarning,
    mockRequest,
    removeLocalStorageItem,
    requestAuth,
    requestHandlers,
    responseHandlers
  }
}

describe('request api client', () => {
  afterEach(() => {
    vi.doUnmock('axios')
    vi.doUnmock('element-plus')
    vi.doUnmock('@/utils/storage')
    vi.doUnmock('@/utils/authEvents')
    vi.resetModules()
  })

  it('creates the axios client and injects a bearer token when present', async () => {
    const { axiosCreate, getLocalStorageItem, requestHandlers } = await loadRequestModule({
      token: 'session-token'
    })

    expect(axiosCreate).toHaveBeenCalledWith({
      baseURL: 'http://localhost:8080/api'
    })

    const config = requestHandlers[0].fulfilled({ headers: {} })

    expect(getLocalStorageItem).toHaveBeenCalledWith('token')
    expect(config.headers.Authorization).toBe('Bearer session-token')
  })

  it('leaves authorization unset when no token exists', async () => {
    const { requestHandlers } = await loadRequestModule()

    const config = requestHandlers[0].fulfilled({ headers: {} })

    expect(config.headers.Authorization).toBeUndefined()
  })

  it('rejects non-200 business codes with the backend message', async () => {
    const { messageError, responseHandlers } = await loadRequestModule()

    await expect(
      responseHandlers[0].fulfilled({ data: { code: 500, message: 'bad request' } })
    ).rejects.toThrow('bad request')

    expect(messageError).toHaveBeenCalledWith('bad request')
  })

  it('passes through successful responses and unwraps nested data', async () => {
    const { module, responseHandlers } = await loadRequestModule()
    const response = { data: { code: 200, data: { id: 1 } } }

    expect(responseHandlers[0].fulfilled(response)).toBe(response)
    expect(module.unwrap(response)).toEqual({ id: 1 })
    expect(module.unwrap({ data: { id: 2 } })).toEqual({ id: 2 })
  })

  it('clears local token and emits auth-required on 401 responses', async () => {
    const {
      messageWarning,
      removeLocalStorageItem,
      requestAuth,
      responseHandlers
    } = await loadRequestModule({ token: 'expired' })
    const error = { response: { status: 401 } }

    await expect(responseHandlers[0].rejected(error)).rejects.toBe(error)

    expect(removeLocalStorageItem).toHaveBeenCalledWith('token')
    expect(messageWarning).toHaveBeenCalled()
    expect(requestAuth).toHaveBeenCalledWith({ reason: 'unauthorized' })
  })
})
