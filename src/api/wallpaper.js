import request, { unwrap } from './request'

// Wallpapers
export const getWallpapers = (params) => request.get('/wallpapers', { params }).then(unwrap)
export const getWallpaper = (id) => request.get(`/wallpapers/${id}`).then(unwrap)
export const updateWallpaperTags = (id, tags) => request.put(`/wallpapers/${id}/tags`, { tags }).then(unwrap)
export const updateWallpaper = (id, payload) => request.put(`/wallpapers/${id}`, payload).then(unwrap)
export const deleteWallpaper = (id) => request.delete(`/wallpapers/${id}`).then(unwrap)
export const downloadWallpaperApi = (id) => request.get(`/wallpapers/${id}/download`).then(unwrap)


// Wallpaper Interactions
export const likeWallpaper = (id) => request.post(`/wallpapers/${id}/like`).then(unwrap)
export const favoriteWallpaper = (id) => request.post(`/wallpapers/${id}/favorite`).then(unwrap)

// Submission
export const submitWallpaperFromPost = (payload) => request.post('/wallpapers/submit-from-post', payload).then(unwrap)
export const uploadWallpaper = (formData) => request.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(unwrap)

// Categories
export const getCategories = () => request.get('/categories').then(unwrap)
