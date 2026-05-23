export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.3:3000'

export const API_ENDPOINTS = {
  login: `${API_BASE_URL}/api/auth/login`,
  register: `${API_BASE_URL}/api/auth/register`,
  logout: `${API_BASE_URL}/api/auth/logout`,
  me: `${API_BASE_URL}/api/auth/me`,
  documents: `${API_BASE_URL}/api/documents`,
  categories: `${API_BASE_URL}/api/categories`,
}
