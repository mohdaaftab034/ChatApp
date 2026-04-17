import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (!refreshToken) {
          throw new Error('Missing refresh token')
        }

        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken })
        
        const authData = res.data?.data
        if (!authData?.token || !authData?.refreshToken || !authData?.user) {
          throw new Error('Invalid refresh response')
        }

        useAuthStore.getState().login(authData.user, authData.token, authData.refreshToken)
        originalRequest.headers.Authorization = `Bearer ${authData.token}`
        return api(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().logout()
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    const message = error.response?.data?.message || 'An unexpected error occurred'
    toast.error(message)

    return Promise.reject(error)
  }
)
