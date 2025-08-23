export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  provider: 'email' | 'github' | 'google'
  workspace_id: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
  last_login_at: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  name: string
  confirmPassword: string
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface OAuthProvider {
  id: 'github' | 'google'
  name: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
}