const getStorage = () => {
  try {
    if (typeof localStorage !== 'undefined') return localStorage
  } catch {}
  return null
}

export const getLocalStorageItem = (key, fallback = '') => {
  try {
    return getStorage()?.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

export const setLocalStorageItem = (key, value) => {
  try {
    getStorage()?.setItem(key, value)
  } catch {}
}

export const removeLocalStorageItem = (key) => {
  try {
    getStorage()?.removeItem(key)
  } catch {}
}

export const getLocalStorageKeys = () => {
  try {
    const storage = getStorage()
    return storage ? Object.keys(storage) : []
  } catch {
    return []
  }
}
