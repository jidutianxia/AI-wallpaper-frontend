/**
 * Helper utility to handle image data structures
 * Handles both legacy string URLs and new object-based image structures
 */

import { isSafeImageUrl } from './urlSecurity'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
// Extract origin from API_BASE_URL (e.g. http://localhost:8080/api -> http://localhost:8080)
const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')

/**
 * Get the full URL for an image/avatar path
 * @param {string} url - The relative or absolute URL
 * @returns {string} The full URL
 */
export const getFullUrl = (url) => {
  if (!url) return ''
  const normalized = String(url).trim()
  if (!isSafeImageUrl(normalized)) return ''
  if (normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('blob:') || normalized.startsWith('data:image/')) return normalized
  // If url starts with /, append to server origin
  if (normalized.startsWith('/')) return `${SERVER_ORIGIN}${normalized}`
  // Otherwise assume it's relative to server origin as well (or handle edge cases)
  return `${SERVER_ORIGIN}/${normalized}`
}

/**
 * Get the valid URL string from an image data item
 * @param {string|Object} image - The image data (URL string or object with url property)
 * @returns {string} The valid image URL or empty string
 */
export const getImageUrl = (image) => {
  if (!image) return ''
  let url = ''
  if (typeof image === 'string') url = image
  else url = image.url || image.src || image.path || ''
  
  return getFullUrl(url)
}

/**
 * Get avatar URL with fallback
 * @param {string} url - The avatar URL
 * @param {string} type - 'user' or 'default'
 * @returns {string} The valid avatar URL
 */
export const getAvatarUrl = (url) => {
  if (!url) return 'https://i.pravatar.cc/150?u=default' // Default placeholder
  return getFullUrl(url)
}

/**
 * Get a list of image URLs from an array of image data
 * @param {Array<string|Object>} images - Array of image data
 * @returns {Array<string>} Array of valid image URLs
 */
export const getImageUrls = (images) => {
  if (!Array.isArray(images)) return []
  return images.map(getImageUrl).filter(Boolean)
}

/**
 * Normalize a post object to ensure its images property contains strings
 * (Useful if you want to mutate the object state directly)
 * @param {Object} post - The post object
 * @returns {Object} The normalized post object
 */
export const normalizePostImages = (post) => {
  if (!post) return post
  if (post.images && Array.isArray(post.images)) {
    // We keep the original structure if needed, but for display we often need simple URLs.
    // However, if the app logic relies on the object structure (e.g. for wallpaperId),
    // we should not mutate it to strings destructively unless we are sure.
    // For view components, it's safer to use getImageUrl in the template.
  }
  return post
}
