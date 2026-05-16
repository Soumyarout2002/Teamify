import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/auth'

const api = axios.create({
  baseURL: 'https://teamify-backend-o44n.onrender.com/api/auth',
  withCredentials: true,
})

api.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().token

  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`
  }

  return cfg
})


api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    } else if (err.response?.status >= 500) {
      toast.error('Server error — please try again')
    }
    return Promise.reject(err)
  }
)

// Auth
export const authAPI = {
  register:       (d) => api.post('/register', d),
  login:          (d) => api.post('/login', d),
  logout:         ()  => api.post('/logout'),
  me:             ()  => api.get('/me'),
  forgotPassword: (e) => api.post('/forgot-password', { email: e }),
  resetPassword:  (token, password) => api.post(`/reset-password/${token}`, { password }),
  changePassword: (d) => api.put('/change-password', d),
}

// Projects
export const projectsAPI = {
  list:         (p)       => api.get('/projects',              { params: p }),
  get:          (id)      => api.get(`/projects/${id}`),
  create:       (d)       => api.post('/projects', d),
  update:       (id, d)   => api.put(`/projects/${id}`, d),
  delete:       (id)      => api.delete(`/projects/${id}`),
  addMember:    (id, d)   => api.post(`/projects/${id}/members`, d),
  removeMember: (id, uid) => api.delete(`/projects/${id}/members/${uid}`),
}

// Tasks
export const tasksAPI = {
  list:       (p)     => api.get('/tasks',              { params: p }),
  get:        (id)    => api.get(`/tasks/${id}`),
  create:     (d)     => api.post('/tasks', d),
  update:     (id, d) => api.put(`/tasks/${id}`, d),
  delete:     (id)    => api.delete(`/tasks/${id}`),
  bulkUpdate: (d)     => api.put('/tasks/bulk-update', d),
}

// Users
export const usersAPI = {
  list:       (p)     => api.get('/users',          { params: p }),
  get:        (id)    => api.get(`/users/${id}`),
  update:     (id, d) => api.put(`/users/${id}`, d),
  deactivate: (id)    => api.delete(`/users/${id}`),
}

// Files
export const filesAPI = {
  upload:   (fd) => api.post('/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  list:     (p)  => api.get('/files',         { params: p }),
  download: (id) => api.get(`/files/${id}/download`),
  delete:   (id) => api.delete(`/files/${id}`),
}

// Reports
export const reportsAPI = {
  org:     ()       => api.get('/reports/organization'),
  project: (id, p)  => api.get(`/reports/project/${id}`, { params: p }),
}

// Activity
export const activityAPI = {
  list: (p) => api.get('/activity', { params: p }),
}

// Notifications
export const notificationsAPI = {
  list:       (p)  => api.get('/notifications', { params: p }),
  markRead:   (id) => api.put(`/notifications/${id}/read`),
  markAllRead: ()  => api.put('/notifications/read-all'),
}

export default api
