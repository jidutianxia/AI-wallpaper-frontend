const SAFE_IMAGE_PROTOCOLS = ['http:', 'https:', 'blob:']
const SAFE_DATA_IMAGE_PATTERN = /^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml);/i

// 图片展示允许站内路径、常见图片 data URL 和安全图片协议，阻断 javascript: 等执行型地址。
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

// 外部跳转只接受 http/https，下载和新窗口打开都会复用这个边界。
export const isSafeExternalUrl = (url) => {
  if (!url || typeof url !== 'string') return false
  try {
    const parsed = new URL(url, window?.location?.origin || 'http://localhost')
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// 下载接口使用跳转方式时需要把 token 放入 URL，统一编码避免拼接污染查询串。
export const appendTokenParam = (url, token) => {
  if (!token) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}token=${encodeURIComponent(token)}`
}

// noopener,noreferrer 降低新窗口反向控制和来源泄露风险。
export const openSecureWindow = (url, target = '_blank') => {
  if (!isSafeExternalUrl(url)) return false
  window.open(url, target, 'noopener,noreferrer')
  return true
}
