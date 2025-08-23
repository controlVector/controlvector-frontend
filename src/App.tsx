import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignUpPage } from '@/pages/auth/SignUpPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { useAuthStore } from '@/stores/authStore'
import { useEffect } from 'react'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppContent() {
  const { isAuthenticated, setLoading } = useAuthStore()

  useEffect(() => {
    // Check for existing token and validate it
    const token = localStorage.getItem('access_token')
    if (token) {
      // You could validate the token here
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [setLoading])

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignUpPage />} />
          
          {/* Protected routes */}
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
          {/* Redirect routes */}
          <Route path="/" element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/auth/login"} replace />
          } />
          <Route path="/auth" element={
            <Navigate to="/auth/login" replace />
          } />
          
          {/* 404 - redirect to appropriate page */}
          <Route path="*" element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/auth/login"} replace />
          } />
        </Routes>
      </div>
      
      {/* Global toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#374151',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            border: '1px solid #e5e7eb',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </Router>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App