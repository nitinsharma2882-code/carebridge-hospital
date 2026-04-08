import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://carebridge-backend-dns0.onrender.com';

export const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((cfg) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cb_hospital_token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('cb_hospital_token');
      localStorage.removeItem('cb_hospital');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const HospitalAPI = {
  login: (email: string, password: string) =>
    api.post('/api/hospital/login', { email, password }),

  getMe: () =>
    api.get('/api/hospital/me'),

  getDashboard: () =>
    api.get('/api/hospital/dashboard'),

  getBookings: () =>
    api.get('/api/hospital/bookings'),

  getAds: () =>
    api.get('/api/hospital/ads'),

  postAd: (data: Record<string, unknown>) =>
    api.post('/api/hospital/ads', data),

  updateProfile: (data: Record<string, unknown>) =>
    api.put('/api/hospital/profile', data),
};