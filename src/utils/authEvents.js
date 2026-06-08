export const AUTH_REQUIRED_EVENT = 'auth-required'
export const AUTH_CHANGED_EVENT = 'auth-changed'

const emitWindowEvent = (name, detail = {}) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(name, { detail }))
}

export const requestAuth = (detail = {}) => {
  emitWindowEvent(AUTH_REQUIRED_EVENT, detail)
}

export const notifyAuthChanged = (detail = {}) => {
  emitWindowEvent(AUTH_CHANGED_EVENT, detail)
}
