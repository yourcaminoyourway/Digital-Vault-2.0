export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://digitalvault2.netlify.app'

export const API_ENDPOINTS = {
  login: `${API_BASE_URL}/api/auth/login`,
  register: `${API_BASE_URL}/api/auth/register`,
  logout: `${API_BASE_URL}/api/auth/logout`,
  me: `${API_BASE_URL}/api/auth/me`,
  documents: `${API_BASE_URL}/api/documents`,
  categories: `${API_BASE_URL}/api/categories`,
}
