import { useAuthStore } from '@/stores/authStore'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      // Error handling is done in the store
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ControlVector</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-4 py-6 sm:px-0"
        >
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <div className="mx-auto h-24 w-24 bg-gradient-to-r from-primary-100 to-primary-200 rounded-full flex items-center justify-center mb-6">
              <svg className="h-12 w-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to ControlVector! 🎉
            </h2>
            
            <div className="max-w-2xl mx-auto">
              <p className="text-lg text-gray-600 mb-6">
                Authentication successful! Watson is ready for conversational infrastructure management.
              </p>
              
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-primary-900 mb-3">
                  🤖 Watson Integration Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">Authentication Service</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">Watson Orchestration (Port 3004)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">Atlas Infrastructure (Port 3003)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">Context Manager (Port 3005)</span>
                  </div>
                </div>
              </div>

              <div className="text-left bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Next Steps:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-primary-500 mr-2">1.</span>
                    Complete onboarding to configure your providers
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-500 mr-2">2.</span>
                    Set up DNS, cloud, and Git credentials
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-500 mr-2">3.</span>
                    Start conversing with Watson for infrastructure management
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-500 mr-2">4.</span>
                    Deploy your first infrastructure through AI conversation
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/onboarding"
                  className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  🚀 Complete Setup
                </Link>
                <button className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-primary-300 text-base font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
                  💬 Chat with Watson
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}