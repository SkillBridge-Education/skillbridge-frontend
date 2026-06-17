// src/services/api.js
import axios from 'axios'
import useAuthStore from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Remove token only on 401 (expired/invalid) — never on network errors.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

// Helper pour extraire le message d'erreur proprement
export const getApiError = (err) =>
  err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Unknown error'

// ── Auth ────────────────────────────────────────────────
export const authApi = {
  login:             (body)  => api.post('/auth/login', body).then(r => r.data),
  register:          (body)  => api.post('/auth/register', body).then(r => r.data),
  me:                ()      => api.get('/auth/me').then(r => r.data.user),
  verifyEmail:       (token) => api.get(`/auth/verify-email?token=${token}`).then(r => r.data),
  resendVerification:(email) => api.post('/auth/resend-verification', { email }).then(r => r.data),
}

// ── Matches ─────────────────────────────────────────────
export const matchApi = {
  suggestions: ()           => api.get('/matches/suggestions').then(r => r.data.suggestions ?? r.data),
  mine:        ()           => api.get('/matches/mine').then(r => r.data.matches ?? r.data),
  request:     (body)       => api.post('/matches/request', body).then(r => r.data),
  update:      (id, status) => api.patch(`/matches/${id}`, { status }).then(r => r.data),
}

// ── Conversations ────────────────────────────────────────
export const convApi = {
  list:      ()              => api.get('/conversations').then(r => r.data.conversations ?? r.data),
  messages:  (id)            => api.get(`/conversations/${id}/messages`).then(r => r.data.messages ?? r.data),
  send:      (id, body)      => api.post(`/conversations/${id}/messages`, { body }).then(r => r.data),
  sendFile:  (id, fileUrl)   => api.post(`/conversations/${id}/messages/file`, { fileUrl }).then(r => r.data),
  archive:   (id)            => api.patch(`/conversations/${id}/archive`).then(r => r.data),
  unarchive: (id)            => api.patch(`/conversations/${id}/unarchive`).then(r => r.data),
  destroy:   (id)            => api.delete(`/conversations/${id}`).then(r => r.data),
}

// ── Notifications ─────────────────────────────────────────
export const notifApi = {
  list:     ()   => api.get('/notifications').then(r => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then(r => r.data),
}

// ── Sessions ─────────────────────────────────────────────
export const sessionApi = {
  list:    ()            => api.get('/sessions/mine').then(r => r.data.sessions ?? r.data),
  get:     (id)          => api.get(`/sessions/${id}`).then(r => r.data.session ?? r.data),
  create:  (body)        => api.post('/sessions', body).then(r => r.data),
  end:     (id, s)       => api.post(`/sessions/${id}/end`, { durationSeconds: s }).then(r => r.data),
  accept:  (id)          => api.post(`/sessions/${id}/accept`).then(r => r.data),
  refuse:  (id)          => api.post(`/sessions/${id}/refuse`).then(r => r.data),
  update:  (id, body)    => api.patch(`/sessions/${id}`, body).then(r => r.data),
}

export default api
