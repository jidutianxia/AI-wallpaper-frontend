import request, { unwrap } from './request'

// Posts
export const getCommunityPosts = (params) => request.get('/community/posts', { params }).then(unwrap)
export const getCommunityPost = (id) => request.get(`/community/posts/${id}`).then(unwrap)
export const createCommunityPost = (payload) => request.post('/community/posts', payload).then(unwrap)
export const updateCommunityPost = (id, payload) => request.put(`/community/posts/${id}`, payload).then(unwrap)
export const deleteCommunityPost = (id) => request.delete(`/community/posts/${id}`).then(unwrap)
export const reportContent = (payload) => request.post('/reports', payload).then(unwrap)

// Post Interactions
export const likeCommunityPost = (id) => request.post(`/community/posts/${id}/like`).then(unwrap)
export const favoriteCommunityPost = (id) => request.post(`/community/posts/${id}/favorite`).then(unwrap)

// Comments
export const getCommunityPostComments = (id, params) => request.get(`/community/posts/${id}/comments`, { params }).then(unwrap)
export const commentCommunityPost = (id, content) => request.post(`/community/posts/${id}/comments`, { content }).then(unwrap)

// Image Level Interactions
export const getCommunityPostImageMeta = (postId, index) => request.get(`/community/posts/${postId}/images/${index}`).then(unwrap)
export const likeCommunityPostImage = (postId, index) => request.post(`/community/posts/${postId}/images/${index}/like`).then(unwrap)
export const favoriteCommunityPostImage = (postId, index) => request.post(`/community/posts/${postId}/images/${index}/favorite`).then(unwrap)
export const downloadCommunityPostImage = (postId, index) => request.post(`/community/posts/${postId}/images/${index}/download`).then(unwrap)

// General Community
export const getCommunityTags = () => request.get('/community/tags').then(unwrap)
export const getCommunityRecentUsers = () => request.get('/community/recent-users').then(unwrap)
export const getMyFavoriteCommunityImages = (params) => request.get('/community/my/favorite-images', { params }).then(unwrap)
export const uploadCommunityImage = (formData, config = {}) => request.post('/upload', formData, {
  ...config,
  headers: { 'Content-Type': 'multipart/form-data', ...(config.headers || {}) }
}).then(unwrap)
