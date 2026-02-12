import axios from 'axios'
import { useAuthStore } from './store'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

// Auth interceptor
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// ─── API Functions ───
export const authApi = {
  signup: (data: { email: string; password: string; org_name?: string }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

export const topicsApi = {
  list: (params: Record<string, any>) => api.get('/topics', { params }),
  get: (id: string) => api.get(`/topics/${id}`),
  timeseries: (id: string, params?: Record<string, any>) =>
    api.get(`/topics/${id}/timeseries`, { params }),
  forecast: (id: string) => api.get(`/topics/${id}/forecast`),
  competition: (id: string) => api.get(`/topics/${id}/competition`),
  reviewsSummary: (id: string) => api.get(`/topics/${id}/reviews/summary`),
  genNext: (id: string) => api.get(`/topics/${id}/gen-next`),
}

export const watchlistApi = {
  list: () => api.get('/watchlist'),
  add: (topic_id: string) => api.post('/watchlist', { topic_id }),
  remove: (topic_id: string) => api.delete(`/watchlist/${topic_id}`),
}

export const alertsApi = {
  list: () => api.get('/alerts'),
  create: (data: any) => api.post('/alerts', data),
  delete: (id: string) => api.delete(`/alerts/${id}`),
  events: (id: string) => api.get(`/alerts/${id}/events`),
}

export const exportsApi = {
  topicsCsv: (params: Record<string, any>) =>
    api.get('/exports/topics.csv', { params, responseType: 'blob' }),
}
