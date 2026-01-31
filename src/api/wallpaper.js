import request, { unwrap } from './request'

// Wallpapers
export const getWallpapers = (params) => request.get('/wallpapers', { params }).then(unwrap)
export const getWallpaper = (id) => request.get(`/wallpapers/${id}`).then(unwrap)
export const updateWallpaperTags = (id, tags) => request.put(`/wallpapers/${id}/tags`, { tags }).then(unwrap) // Added missing API

// Wallpaper Interactions
export const likeWallpaper = (id) => request.post(`/wallpapers/${id}/like`)
export const favoriteWallpaper = (id) => request.post(`/wallpapers/${id}/favorite`)

// Submission
export const submitWallpaperFromPost = (payload) => request.post('/wallpapers/submit-from-post', payload).then(unwrap)
export const uploadWallpaper = (formData) => request.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(unwrap)

// Categories
export const getCategories = () => request.get('/categories').then(unwrap)
