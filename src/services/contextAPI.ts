import axios from 'axios'

const CONTEXT_API_BASE = `${import.meta.env.VITE_CONTEXT_API_URL || 'http://localhost:3005'}/api/v1/context`

// Create axios instance with auth headers
const contextAPI = axios.create({
  baseURL: CONTEXT_API_BASE,
})

// Add auth token to requests
contextAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
contextAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear tokens but let the app handle navigation
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      // Don't redirect here - let the app's auth system handle it
      console.log('Unauthorized access - tokens cleared')
    }
    return Promise.reject(error)
  }
)

export interface CredentialData {
  key: string
  value: string
  credential_type: 'oauth' | 'api_key' | 'password' | 'token'
  provider: string
  expires_at?: string
}

export interface SSHKeyData {
  key_name: string
  private_key: string
  public_key: string
  key_type: 'rsa' | 'ed25519' | 'ecdsa'
  metadata?: {
    description?: string
    allowed_hosts?: string[]
  }
}

export interface SecretListResponse {
  credentials: Array<{
    key: string
    provider: string
    type: string
    created_at: string
    expires_at?: string
  }>
  ssh_keys: Array<{
    key: string
    type: string
    fingerprint: string
    created_at: string
  }>
  certificates: Array<{
    key: string
    type: string
    common_name: string
    expires_at: string
  }>
}

export interface UserPreferences {
  default_cloud_provider?: string
  preferred_regions?: string[]
  cost_limits?: {
    daily_limit?: number
    monthly_limit?: number
    alert_threshold?: number
  }
  notification_preferences?: {
    channels?: ('email' | 'slack' | 'webhook')[]
    quiet_hours?: {
      start: string
      end: string
      timezone: string
    }
  }
  ui_preferences?: {
    theme?: 'light' | 'dark' | 'auto'
    sidebar_collapsed?: boolean
    default_view?: string
  }
}

// Secret Context API
export const secretAPI = {
  // Store encrypted credential
  async storeCredential(data: CredentialData) {
    const response = await contextAPI.post('/secret/credential', data)
    return response.data
  },

  // Get decrypted credential
  async getCredential(key: string) {
    const response = await contextAPI.get(`/secret/credential/${key}`)
    return response.data
  },

  // Store SSH key
  async storeSSHKey(data: SSHKeyData) {
    const response = await contextAPI.post('/secret/ssh-key', data)
    return response.data
  },

  // Get SSH key
  async getSSHKey(keyName: string) {
    const response = await contextAPI.get(`/secret/ssh-key/${keyName}`)
    return response.data
  },

  // List all secrets (metadata only)
  async listSecrets(): Promise<SecretListResponse> {
    const response = await contextAPI.get('/secret/list')
    return response.data.data
  },

  // Delete secret
  async deleteSecret(type: 'credential' | 'ssh_key' | 'certificate', key: string) {
    const response = await contextAPI.delete(`/secret/${type}/${key}`)
    return response.data
  }
}

// User Context API
export const userContextAPI = {
  // Get user context
  async getUserContext() {
    const response = await contextAPI.get('/user')
    return response.data
  },

  // Update user preferences
  async updatePreferences(preferences: UserPreferences) {
    const response = await contextAPI.put('/user/preferences', preferences)
    return response.data
  },

  // Add deployment pattern
  async addDeploymentPattern(pattern: {
    name: string
    pattern_type: 'infrastructure' | 'deployment' | 'hybrid'
    configuration: Record<string, any>
    success_rate: number
    usage_count?: number
  }) {
    const response = await contextAPI.post('/user/deployment-pattern', pattern)
    return response.data
  },

  // Record infrastructure event
  async recordInfrastructureEvent(event: {
    event_type: 'provision' | 'deploy' | 'scale' | 'delete' | 'update'
    resource_type: string
    provider: string
    status: 'success' | 'failed' | 'pending'
    configuration: Record<string, any>
    cost_impact?: number
    duration_ms: number
    metadata?: Record<string, any>
  }) {
    const response = await contextAPI.post('/user/infrastructure-event', event)
    return response.data
  },

  // Search deployment patterns
  async searchDeploymentPatterns(filters?: {
    pattern_type?: string
    min_success_rate?: number
    name_contains?: string
  }) {
    const response = await contextAPI.get('/user/deployment-patterns/search', {
      params: filters
    })
    return response.data
  },

  // Get infrastructure analytics
  async getAnalytics(timeRange?: {
    start_date?: string
    end_date?: string
  }) {
    const response = await contextAPI.get('/user/analytics', {
      params: timeRange
    })
    return response.data
  },

  // Get recommended patterns
  async getRecommendations(context?: string) {
    const response = await contextAPI.get('/user/recommendations', {
      params: { context }
    })
    return response.data
  },

  // Search conversation history
  async searchConversations(query: string, limit = 20) {
    const response = await contextAPI.get('/user/conversations/search', {
      params: { q: query, limit }
    })
    return response.data
  }
}

export { contextAPI }