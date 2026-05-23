import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const storage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') return localStorage.getItem(key)
    return SecureStore.getItemAsync(key)
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return }
    return SecureStore.setItemAsync(key, value)
  },
  deleteItem: async (key: string) => {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return }
    return SecureStore.deleteItemAsync(key)
  },
}
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe,
} from '../services/api'

type User = {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'user'
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const token = await storage.getItem('auth-token')
      if (!token) {
        setIsLoading(false)
        return
      }
      const data = await getMe()
      if (data.data) {
        setUser(data.data)
      }
    } catch {
      await storage.deleteItem('auth-token')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password)
    if (data.data) {
      setUser(data.data)
    }
  }, [])

  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      const data = await apiRegister(email, password, fullName)
      if (data.data) {
        setUser(data.data)
      }
    },
    []
  )

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
