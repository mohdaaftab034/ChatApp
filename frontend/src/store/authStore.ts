import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '../types/user.types'
import { clearUnlockedKeys } from '../lib/e2ee'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (user: User, token: string, refresh: string) => void
  logout: () => void
  updateUser: (partial: Partial<User>) => void
  setLoading: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user, token, refreshToken) => 
        set({ user, token, refreshToken, isAuthenticated: true }),
        
      logout: () => 
        set(() => {
          clearUnlockedKeys()
          return { user: null, token: null, refreshToken: null, isAuthenticated: false }
        }),
        
      updateUser: (partial) => 
        set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),
        
      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
