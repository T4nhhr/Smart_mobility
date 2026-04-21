import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

interface User {
  userId: string
  email: string
  name: string
  role: 'Admin' | 'Operator' | 'Viewer'
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setTokens: (token: string, refreshToken: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,

      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password })
        const { accessToken, refreshToken, user } = response.data
        set({ token: accessToken, refreshToken, user })
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      },

      logout: () => {
        set({ token: null, refreshToken: null, user: null })
        delete api.defaults.headers.common['Authorization']
      },

      setTokens: (token, refreshToken) => {
        set({ token, refreshToken })
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      },
    }),
    {
      name: 'urbanmove-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
)
