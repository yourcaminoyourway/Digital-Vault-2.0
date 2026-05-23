import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { API_BASE_URL } from '../constants/api'

const TOKEN_KEY = 'auth-token'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY)
      if (token) {
        config.headers.Cookie = `auth-token=${token}`
        config.headers['Authorization'] = `Bearer ${token}`
      }
    } catch {
      // ignore
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: extract token from set-cookie if present
apiClient.interceptors.response.use(
  async (response) => {
    const setCookie = response.headers['set-cookie']
    if (setCookie) {
      const cookieHeader = Array.isArray(setCookie)
        ? setCookie.join('; ')
        : setCookie
      const match = cookieHeader.match(/auth-token=([^;]+)/)
      if (match && match[1]) {
        await SecureStore.setItemAsync(TOKEN_KEY, match[1])
      }
    }
    return response
  },
  (error) => Promise.reject(error)
)

// Auth functions
export async function login(email: string, password: string) {
  const response = await apiClient.post('/api/auth/login', { email, password })
  return response.data
}

export async function register(
  email: string,
  password: string,
  fullName: string
) {
  const response = await apiClient.post('/api/auth/register', {
    email,
    password,
    fullName,
  })
  return response.data
}

export async function logout() {
  try {
    await apiClient.post('/api/auth/logout')
  } finally {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
  }
}

export async function getMe() {
  const response = await apiClient.get('/api/auth/me')
  return response.data
}

// Token helpers
export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

// Documents
export async function getDocuments(
  page = 1,
  limit = 20,
  search?: string,
  categoryId?: string
) {
  const params: Record<string, string> = {
    page: page.toString(),
    limit: limit.toString(),
  }
  if (search) params.search = search
  if (categoryId) params.categoryId = categoryId

  const response = await apiClient.get('/api/documents', { params })
  return response.data
}

export async function getDocument(id: string) {
  const response = await apiClient.get(`/api/documents/${id}`)
  return response.data
}

export async function createDocument(data: {
  title: string
  description?: string
  categoryId?: string
  isPublic?: boolean
  tags?: string[]
}) {
  const response = await apiClient.post('/api/documents', data)
  return response.data
}

export async function updateDocument(
  id: string,
  data: Partial<{
    title: string
    description: string
    categoryId: string
    isPublic: boolean
    tags: string[]
  }>
) {
  const response = await apiClient.patch(`/api/documents/${id}`, data)
  return response.data
}

export async function deleteDocument(id: string) {
  const response = await apiClient.delete(`/api/documents/${id}`)
  return response.data
}

// Categories
export async function getCategories() {
  const response = await apiClient.get('/api/categories')
  return response.data
}
