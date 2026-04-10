// lib/api.ts — Central API client for all CareBridge admin panels
import axios from 'axios'
import { getToken } from './auth'

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://carebridge-backend-dns0.onrender.com',
  timeout: 15000,
})

// Inject JWT token on every request
api.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401 (except login endpoints)
api.interceptors.response.use(
  res => res,
  err => {
    if (err?.response?.status === 401 && !err?.config?.url?.includes('/login')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cb_hospital_token')
        localStorage.removeItem('cb_hospital')
        localStorage.removeItem('cb_selected_role')
        window.location.href = '/select-role'
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ── Hospital API ──────────────────────────────────────────────────────────────
export const HospitalAPI = {
  // Login methods — used by app/login/page.tsx
  login:        (email: string, password: string) =>
    api.post('/api/hospital/login', { email, password }),
  loginAs:      (role: string, email: string, password: string) =>
    api.post(`/api/${role}/login`, { email, password }),

  // Data methods
  getMe:        () => api.get('/api/hospital/me'),
  updateProfile:(data: Record<string,unknown>) => api.put('/api/hospital/profile', data),
  getDashboard: () => api.get('/api/hospital/dashboard'),
  getBookings:  () => api.get('/api/hospital/bookings'),
  getAds:       () => api.get('/api/hospital/ads'),
  postAd:       (data: Record<string,unknown>) => api.post('/api/hospital/ads', data),
  getSupport:   () => api.get('/api/hospital/support'),
  postSupport:  (data: Record<string,unknown>) => api.post('/api/hospital/support', data),
}

// ── Corporate API ─────────────────────────────────────────────────────────────
export const CorporateAPI = {
  getMe:            () => api.get('/api/corporate/me'),
  updateProfile:    (data: Record<string,unknown>) => api.put('/api/corporate/profile', data),
  getDashboard:     () => api.get('/api/corporate/dashboard'),
  getEmployees:     () => api.get('/api/corporate/employees'),
  addEmployee:      (data: Record<string,unknown>) => api.post('/api/corporate/employees', data),
  deleteEmployee:   (id: string) => api.delete(`/api/corporate/employees/${id}`),
  getBookings:      () => api.get('/api/corporate/bookings'),
  getEvents:        () => api.get('/api/corporate/events'),
  createEvent:      (data: Record<string,unknown>) => api.post('/api/corporate/events', data),
  getBilling:       () => api.get('/api/corporate/billing'),
  getAnalytics:     (period?: string) => api.get(`/api/corporate/analytics${period ? `?period=${period}` : ''}`),
  getNotifications: () => api.get('/api/corporate/notifications'),
  markNotifRead:    (id: string) => api.put(`/api/corporate/notifications/${id}/read`),
  getSupport:       () => api.get('/api/corporate/support'),
  postSupport:      (data: Record<string,unknown>) => api.post('/api/corporate/support', data),
  getMessages:      () => api.get('/api/corporate/messages'),
  sendMessage:      (data: Record<string,unknown>) => api.post('/api/corporate/messages', data),
}

// ── Clinic API ────────────────────────────────────────────────────────────────
export const ClinicAPI = {
  getMe:         () => api.get('/api/clinic/me'),
  updateProfile: (data: Record<string,unknown>) => api.put('/api/clinic/profile', data),
  getDashboard:  () => api.get('/api/clinic/dashboard'),
  getBookings:   () => api.get('/api/clinic/bookings'),
  getAnalytics:  (period?: string) => api.get(`/api/clinic/analytics${period ? `?period=${period}` : ''}`),
  getAds:        () => api.get('/api/clinic/ads'),
  postAd:        (data: Record<string,unknown>) => api.post('/api/clinic/ads', data),
  getSupport:    () => api.get('/api/clinic/support'),
  postSupport:   (data: Record<string,unknown>) => api.post('/api/clinic/support', data),
}

// ── Pharmaceutical API ────────────────────────────────────────────────────────
export const PharmaAPI = {
  getMe:         () => api.get('/api/pharmaceutical/me'),
  updateProfile: (data: Record<string,unknown>) => api.put('/api/pharmaceutical/profile', data),
  getDashboard:  () => api.get('/api/pharmaceutical/dashboard'),
  getOrders:     () => api.get('/api/pharmaceutical/orders'),
  getAnalytics:  (period?: string) => api.get(`/api/pharmaceutical/analytics${period ? `?period=${period}` : ''}`),
  getAds:        () => api.get('/api/pharmaceutical/ads'),
  postAd:        (data: Record<string,unknown>) => api.post('/api/pharmaceutical/ads', data),
  getSupport:    () => api.get('/api/pharmaceutical/support'),
  postSupport:   (data: Record<string,unknown>) => api.post('/api/pharmaceutical/support', data),
}
