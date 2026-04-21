import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://4znrrmbr-3000.asse.devtunnels.ms',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token from storage on startup
const stored = localStorage.getItem('urbanmove-auth')
if (stored) {
  try {
    const { state } = JSON.parse(stored)
    if (state?.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
    }
  } catch {}
}

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear auth on 401
      localStorage.removeItem('urbanmove-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
