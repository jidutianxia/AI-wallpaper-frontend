import request, { unwrap } from './request'

export const getNotifications = (params) => request.get('/notifications', { params }).then(unwrap)
export const markNotificationRead = (id) => request.post(`/notifications/${id}/read`).then(unwrap)
export const markAllNotificationsRead = () => request.post('/notifications/read-all').then(unwrap)
