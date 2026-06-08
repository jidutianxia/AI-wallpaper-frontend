const SAFE_IMAGE_PROTOCOLS = ['http:', 'https:', 'blob:']
const SAFE_DATA_IMAGE_PATTERN = /^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml);/i

export const isSafeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false
  const value = url.trim()
  if (!value) return false
  if (value.startsWith('/')) return true
  if (SAFE_DATA_IMAGE_PATTERN.test(value)) return true

  try {
    const parsed = new URL(value, window?.location?.origin || 'http://localhost')
    return SAFE_IMAGE_PROTOCOLS.includes(parsed.protocol)
  } catch {
    return false
  }
}

export const isSafeExternalUrl = (url) => {
  if (!url || typeof url !== 'string') return false
  try {
    const parsed = new URL(url, window?.location?.origin || 'http://localhost')
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export const appendTokenParam = (url, token) => {
  if (!token) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}token=${encodeURIComponent(token)}`
}

export const openSecureWindow = (url, target = '_blank') => {
  if (!isSafeExternalUrl(url)) return false
  window.open(url, target, 'noopener,noreferrer')
  return true
}
