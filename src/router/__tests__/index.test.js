import { afterEach, describe, expect, it, vi } from 'vitest'

const loadRouter = async (storeOverrides = {}) => {
  vi.resetModules()

  let guard
  const router = {
    beforeEach: vi.fn((handler) => {
      guard = handler
    })
  }
  const userStore = {
    isAuthenticated: false,
    token: '',
    info: null,
    fetchUser: vi.fn(),
    ...storeOverrides
  }
  const requestAuth = vi.fn()

  vi.doMock('vue-router', () => ({
    createRouter: vi.fn(() => router),
    createWebHistory: vi.fn(() => 'history')
  }))
  vi.doMock('@/store/user', () => ({
    useUserStore: () => userStore
  }))
  vi.doMock('@/utils/authEvents', () => ({
    requestAuth
  }))

  await import('../index')

  return { guard, requestAuth, router, userStore }
}

describe('router auth guard', () => {
  afterEach(() => {
    vi.doUnmock('vue-router')
    vi.doUnmock('@/store/user')
    vi.doUnmock('@/utils/authEvents')
    vi.resetModules()
  })

  it('allows public routes without auth checks', async () => {
    const { guard, requestAuth, userStore } = await loadRouter()

    await expect(guard({ meta: {}, fullPath: '/' })).resolves.toBe(true)

    expect(userStore.fetchUser).not.toHaveBeenCalled()
    expect(requestAuth).not.toHaveBeenCalled()
  })

  it('allows authenticated routes when the user store is already authenticated', async () => {
    const { guard, requestAuth, userStore } = await loadRouter({
      isAuthenticated: true,
      token: 'token',
      info: { id: 1 }
    })

    await expect(guard({ meta: { requiresAuth: true }, fullPath: '/user' })).resolves.toBe(true)

    expect(userStore.fetchUser).not.toHaveBeenCalled()
    expect(requestAuth).not.toHaveBeenCalled()
  })

  it('refreshes user info from an existing token before allowing a protected route', async () => {
    const userStore = {
      isAuthenticated: false,
      token: 'token',
      info: null,
      fetchUser: vi.fn(async function () {
        this.info = { id: 1 }
        this.isAuthenticated = true
      })
    }
    const { guard, requestAuth } = await loadRouter(userStore)

    await expect(guard({ meta: { requiresAuth: true }, fullPath: '/user' })).resolves.toBe(true)

    expect(userStore.fetchUser).toHaveBeenCalledOnce()
    expect(requestAuth).not.toHaveBeenCalled()
  })

  it('requests auth and returns fallback when protected route cannot be entered', async () => {
    const { guard, requestAuth } = await loadRouter({
      token: 'expired',
      fetchUser: vi.fn().mockRejectedValue(new Error('expired'))
    })

    await expect(
      guard({
        meta: { requiresAuth: true, authFallback: '/community' },
        fullPath: '/community/compose'
      })
    ).resolves.toBe('/community')

    expect(requestAuth).toHaveBeenCalledWith({
      reason: 'route',
      redirect: '/community/compose'
    })
  })
})
