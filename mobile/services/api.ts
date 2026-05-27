import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { API_BASE_URL } from '../constants/api'

const TOKEN_KEY = 'auth-token'

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

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach auth token as Bearer (works for both web + native)
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem(TOKEN_KEY)
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
    } catch {
      // ignore
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: extract token from set-cookie if present;
// normalize errors so callers get a useful message
apiClient.interceptors.response.use(
  async (response) => {
    const setCookie = response.headers['set-cookie']
    if (setCookie) {
      const cookieHeader = Array.isArray(setCookie)
        ? setCookie.join('; ')
        : setCookie
      const match = cookieHeader.match(/auth-token=([^;]+)/)
      if (match && match[1]) {
        await storage.setItem(TOKEN_KEY, match[1])
      }
    }
    return response
  },
  (error) => {
    // Prefer the server's error message when available
    const serverMessage =
      error?.response?.data?.error ?? error?.response?.data?.message
    if (serverMessage) {
      const normalized = new Error(serverMessage)
      // preserve status for callers that want to branch
      ;(normalized as Error & { status?: number }).status =
        error?.response?.status
      return Promise.reject(normalized)
    }
    // No response at all → network/server unreachable
    if (!error?.response) {
      return Promise.reject(
        new Error("Can't reach the server. Check your connection.")
      )
    }
    return Promise.reject(error)
  }
)

// Auth functions
export async function login(email: string, password: string) {
  const response = await apiClient.post('/api/auth/login', { email, password })
  // Persist token from response body (Set-Cookie isn't reliably exposed on RN)
  if (response.data?.token) {
    await storage.setItem(TOKEN_KEY, response.data.token)
  }
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
  if (response.data?.token) {
    await storage.setItem(TOKEN_KEY, response.data.token)
  }
  return response.data
}

export async function logout() {
  try {
    await apiClient.post('/api/auth/logout')
  } finally {
    await storage.deleteItem(TOKEN_KEY)
  }
}

export async function getMe() {
  const response = await apiClient.get('/api/auth/me')
  return response.data
}

// Token helpers
export async function getStoredToken(): Promise<string | null> {
  return storage.getItem(TOKEN_KEY)
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearToken(): Promise<void> {
  await storage.deleteItem(TOKEN_KEY)
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

// File attachments
export async function uploadDocumentFile(
  id: string,
  file: { uri: string; name: string; mimeType?: string | null }
) {
  const form = new FormData()
  // React Native FormData accepts this RN-specific object shape
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? 'application/octet-stream',
    // RN typings are loose here
  } as unknown as Blob)
  const response = await apiClient.post(`/api/documents/${id}/file`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function deleteDocumentFile(id: string) {
  const response = await apiClient.delete(`/api/documents/${id}/file`)
  return response.data
}

export function getDocumentFileUrl(id: string): string {
  return `${API_BASE_URL}/api/documents/${id}/file`
}

// Categories
export async function getCategories() {
  const response = await apiClient.get('/api/categories')
  return response.data
}
