import { ReactNode, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { authAPI } from '@/services/authAPI'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true)
      
      try {
        const token = localStorage.getItem('access_token')
        
        if (token) {
          // Validate token and get current user
          const user = await authAPI.getCurrentUser()
          setUser(user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        // Clear invalid tokens
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [setUser, setLoading])

  return <>{children}</>
}