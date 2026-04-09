import axios from 'axios'
import { getToken } from './auth'

const BASE_URL = 'https://carebridge-backend-dns0.onrender.com'

const api = axios.create({
  baseURL: BASE_URL,
})

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto logout on 401 — skip login requests
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error?.config?.url?.includes('/login')
    if (error?.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('cb_hospital_token')
      localStorage.removeItem('cb_hospital')
      localStorage.removeItem('cb_selected_role')
      window.location.href = '/select-role'
    }
    return Promise.reject(error)
  }
)

export const HospitalAPI = {
  login: (email: string, password: string) =>
    api.post('/api/hospital/login', { email, password }),

  loginAs: (role: string, email: string, password: string) =>
    api.post(`/api/${role}/login`, { email, password }),

  getDashboard: () => api.get('/api/hospital/dashboard'),
  getBookings: () => api.get('/api/hospital/bookings'),
  getAnalytics: (period: string) => api.get(`/api/hospital/analytics?period=${period}`),
  getAds: () => api.get('/api/hospital/ads'),
  postAd: (data: object) => api.post('/api/hospital/ads', data),
  getProfile: () => api.get('/api/hospital/me'),
  updateProfile: (data: object) => api.put('/api/hospital/profile', data),
}

export default api