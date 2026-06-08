import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '../user'
import { getMe, login as loginApi, register as registerApi } from '@/api/user'
import { notifyAuthChanged } from '@/utils/authEvents'
import {
  getLocalStorageItem,
  getLocalStorageKeys,
  removeLocalStorageItem,
  setLocalStorageItem
} from '@/utils/storage'

vi.mock('@/api/user', () => ({
  getMe: vi.fn(),
  login: vi.fn(),
  register: vi.fn()
}))

vi.mock('@/utils/authEvents', () => ({
  notifyAuthChanged: vi.fn()
}))

vi.mock('@/utils/storage', () => ({
  getLocalStorageItem: vi.fn(),
  getLocalStorageKeys: vi.fn(),
  removeLocalStorageItem: vi.fn(),
  setLocalStorageItem: vi.fn()
}))

describe('user store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getLocalStorageItem).mockReturnValue('')
    vi.mocked(getLocalStorageKeys).mockReturnValue([])
  })

  it('logs in, stores the token, refreshes user info, and emits auth change', async () => {
    vi.mocked(loginApi).mockResolvedValue({
      token: 'token-1',
      userInfo: { id: 1, username: 'from-login' }
    })
    vi.mocked(getMe).mockResolvedValue({ id: 1, username: 'fresh-user' })
    const store = useUserStore()

    const result = await store.login({ username: 'alice', password: 'secret' })

    expect(result.token).toBe('token-1')
    expect(store.token).toBe('token-1')
    expect(store.info).toEqual({ id: 1, username: 'fresh-user' })
    expect(store.isLoggedIn).toBe(true)
    expect(setLocalStorageItem).toHaveBeenCalledWith('token', 'token-1')
    expect(getMe).toHaveBeenCalledOnce()
    expect(notifyAuthChanged).toHaveBeenCalledWith({ type: 'login' })
  })

  it('throws when login response has no token', async () => {
    vi.mocked(loginApi).mockResolvedValue({ userInfo: { id: 1 } })
    const store = useUserStore()

    await expect(store.login({ username: 'alice' })).rejects.toThrow()

    expect(setLocalStorageItem).not.toHaveBeenCalled()
    expect(notifyAuthChanged).not.toHaveBeenCalled()
  })

  it('proxies registration to the user api', async () => {
    vi.mocked(registerApi).mockResolvedValue({ id: 2 })
    const store = useUserStore()

    await expect(store.register({ username: 'bob' })).resolves.toEqual({ id: 2 })
  })

  it('deduplicates concurrent fetchUser requests and resets fetchPromise', async () => {
    let resolveUser
    vi.mocked(getMe).mockReturnValue(new Promise((resolve) => {
      resolveUser = resolve
    }))
    const store = useUserStore()

    const first = store.fetchUser()
    const second = store.fetchUser()
    resolveUser({ id: 3, username: 'deduped' })

    await expect(first).resolves.toEqual({ id: 3, username: 'deduped' })
    await expect(second).resolves.toEqual({ id: 3, username: 'deduped' })
    expect(getMe).toHaveBeenCalledOnce()
    expect(store.fetchPromise).toBeNull()
  })

  it('clears session state, token storage, and cached community interactions', () => {
    vi.mocked(getLocalStorageKeys).mockReturnValue([
      'token',
      'community_interactions_post_1',
      'theme'
    ])
    const store = useUserStore()
    store.token = 'token-2'
    store.info = { id: 4 }
    store.isLoggedIn = true

    store.clearSession({ type: 'manual' })

    expect(store.token).toBe('')
    expect(store.info).toBeNull()
    expect(store.isLoggedIn).toBe(false)
    expect(removeLocalStorageItem).toHaveBeenCalledWith('token')
    expect(removeLocalStorageItem).toHaveBeenCalledWith('community_interactions_post_1')
    expect(removeLocalStorageItem).not.toHaveBeenCalledWith('theme')
    expect(notifyAuthChanged).toHaveBeenCalledWith({ type: 'manual' })
  })

  it('initializes auth from an existing token and clears invalid 401 sessions', async () => {
    vi.mocked(getLocalStorageItem).mockReturnValue('stored-token')
    vi.mocked(getMe).mockRejectedValue({ response: { status: 401 } })
    const store = useUserStore()

    await store.initAuth()

    expect(store.token).toBe('')
    expect(store.info).toBeNull()
    expect(store.isLoggedIn).toBe(false)
    expect(notifyAuthChanged).not.toHaveBeenCalled()
  })
})
