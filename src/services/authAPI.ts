import axios from 'axios'
import { LoginCredentials, SignUpCredentials, AuthResponse } from '@/types/auth'

const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3002'

const authClient = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
authClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for token refresh
authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Don't retry refresh endpoint to avoid infinite loop
    if (originalRequest.url?.includes('/refresh')) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const response = await authAPI.refreshToken(refreshToken)
          localStorage.setItem('access_token', response.access_token)
          localStorage.setItem('refresh_token', response.refresh_token)
          
          originalRequest.headers.Authorization = `Bearer ${response.access_token}`
          return authClient(originalRequest)
        } catch (refreshError) {
          // Refresh failed, clear tokens and don't redirect automatically
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          // Don't redirect here - let the app handle it
          return Promise.reject(refreshError)
        }
      }
    }

    return Promise.reject(error)
  }
)

export const authAPI = {
  // Email/password authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await authClient.post('/login', credentials)
    return response.data.data // Extract from wrapper object
  },

  async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    const response = await authClient.post('/signup', credentials)
    return response.data.data // Extract from wrapper object
  },

  // OAuth authentication
  async getOAuthUrl(provider: 'github' | 'google'): Promise<string> {
    const response = await authClient.get(`/oauth/${provider}/url`)
    return response.data.url
  },

  async handleOAuthCallback(provider: 'github' | 'google', code: string, state?: string): Promise<AuthResponse> {
    const response = await authClient.post(`/oauth/${provider}/callback`, {
      code,
      state,
    })
    return response.data
  },

  // Token management
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await authClient.post('/refresh', {
      refresh_token: refreshToken,
    })
    return response.data.data // Extract from wrapper object
  },

  async logout(): Promise<void> {
    await authClient.post('/logout')
  },

  // User management
  async getCurrentUser() {
    const response = await authClient.get('/me')
    return response.data.data // Extract from wrapper object
  },

  async updateProfile(data: { name?: string; email?: string }) {
    const response = await authClient.patch('/me', data)
    return response.data.data // Extract from wrapper object
  },

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const response = await authClient.patch('/me/password', data)
    return response.data
  },

  // Password reset
  async requestPasswordReset(email: string): Promise<void> {
    await authClient.post('/password/reset-request', { email })
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await authClient.post('/password/reset', { token, password: newPassword })
  },

  // Email verification
  async resendVerificationEmail(): Promise<void> {
    await authClient.post('/verify/resend')
  },

  async verifyEmail(token: string): Promise<void> {
    await authClient.post('/verify', { token })
  },
}