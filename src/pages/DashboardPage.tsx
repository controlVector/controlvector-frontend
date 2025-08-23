import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { secretAPI } from '@/services/contextAPI'

export function DashboardPage() {
  const { user, logout } = useAuthStore()
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false)
  const [completedProviders, setCompletedProviders] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCredentialWarning, setShowCredentialWarning] = useState(false)
  const [missingProviders, setMissingProviders] = useState<string[]>([])

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const secrets = await secretAPI.listSecrets()
      const providers: string[] = []
      const missing: string[] = []
      
      // Check LLM providers
      const hasLLM = secrets.credentials.some(cred => ['openai', 'anthropic', 'google'].includes(cred.provider))
      if (hasLLM) {
        providers.push('AI Assistant')
      } else {
        missing.push('AI Assistant')
      }
      
      // Check DNS providers
      const hasDNS = secrets.credentials.some(cred => 
        ['cloudflare', 'aws', 'digitalocean'].includes(cred.provider) &&
        (cred.key.includes('api_token') || cred.key.includes('access_key'))
      )
      if (hasDNS) {
        providers.push('DNS Provider')
      } else {
        missing.push('DNS Provider')
      }
      
      // Check Cloud providers
      const hasCloud = secrets.credentials.some(cred => 
        ['digitalocean', 'aws', 'gcp', 'azure'].includes(cred.provider) &&
        (cred.key.includes('api_token') || cred.key.includes('access_key') || cred.key.includes('subscription_id'))
      )
      if (hasCloud) {
        providers.push('Cloud Provider')
      } else {
        missing.push('Cloud Provider')
      }
      
      // Check Git providers
      const hasGit = secrets.credentials.some(cred => 
        ['github', 'gitlab'].includes(cred.provider)
      ) || secrets.ssh_keys.length > 0
      if (hasGit) {
        providers.push('Git Repositories')
      } else {
        missing.push('Git Repositories')
      }
      
      setCompletedProviders(providers)
      setMissingProviders(missing)
      setIsOnboardingComplete(providers.length >= 2)
      
      // Show warning if we have no credentials at all but localStorage might indicate previous setup
      const totalCredentials = secrets.credentials.length + secrets.ssh_keys.length
      const hasStoredCompletionStatus = localStorage.getItem('onboarding_complete') === 'true'
      setShowCredentialWarning(totalCredentials === 0 && (hasStoredCompletionStatus || providers.length === 0))
      
    } catch (error) {
      console.error('Failed to check onboarding status:', error)
      setIsOnboardingComplete(false)
      setShowCredentialWarning(true)
    } finally {
      setIsLoading(false)
    }
  }

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
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking your setup status...</p>
            </div>
          ) : (
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <div className="mx-auto h-24 w-24 bg-gradient-to-r from-primary-100 to-primary-200 rounded-full flex items-center justify-center mb-6">
                {isOnboardingComplete ? (
                  <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-12 w-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {isOnboardingComplete ? 'Ready to Go! 🚀' : 'Welcome to ControlVector! 🎉'}
              </h2>
              
              <div className="max-w-2xl mx-auto">
                <p className="text-lg text-gray-600 mb-6">
                  {isOnboardingComplete 
                    ? 'Your ControlVector is configured and ready for AI-driven infrastructure management!' 
                    : 'Authentication successful! Complete setup to start managing your infrastructure with Watson.'}
                </p>
                
                {/* Credential Loss Warning */}
                {showCredentialWarning && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">⚠️ Configuration Reset Detected</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Your stored credentials may have been lost due to service restart in development mode. This is normal for in-memory database mode.</p>
                          <p className="mt-1 font-medium">Please re-configure your providers below to restore full functionality.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Onboarding Status */}
                <div className={`border rounded-lg p-6 mb-6 ${
                  isOnboardingComplete 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-primary-50 border-primary-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-3 ${
                    isOnboardingComplete ? 'text-green-900' : 'text-primary-900'
                  }`}>
                    {isOnboardingComplete ? '✅ Setup Complete' : '⚙️ Setup Status'}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Configured Providers */}
                    {completedProviders.length > 0 && (
                      <div className="text-left">
                        <h4 className="text-sm font-medium text-green-700 mb-2">✅ Configured:</h4>
                        <div className="space-y-1">
                          {completedProviders.map((provider) => (
                            <div key={provider} className="flex items-center">
                              <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                              <span className="text-sm text-gray-700">{provider}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Missing Providers */}
                    {missingProviders.length > 0 && (
                      <div className="text-left">
                        <h4 className="text-sm font-medium text-yellow-700 mb-2">
                          {completedProviders.length > 0 ? '⚠️ Missing:' : '🔧 Need to Configure:'}
                        </h4>
                        <div className="space-y-1">
                          {missingProviders.map((provider) => (
                            <div key={provider} className="flex items-center">
                              <div className="h-2 w-2 bg-yellow-500 rounded-full mr-3"></div>
                              <span className="text-sm text-gray-600">{provider}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {missingProviders.length > 0 && (
                    <div className="mt-4 text-sm text-gray-600">
                      <p className="font-medium text-primary-700">Required for full functionality:</p>
                      <ul className="mt-1 space-y-1 ml-4">
                        {missingProviders.includes('Cloud Provider') && <li>• Cloud Provider for infrastructure management</li>}
                        {missingProviders.includes('AI Assistant') && <li>• AI Assistant for intelligent responses</li>}
                        {missingProviders.includes('DNS Provider') && <li>• DNS Provider for domain management</li>}
                        {missingProviders.includes('Git Repositories') && <li>• Git access for deployment operations</li>}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Service Status */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">🤖 Service Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-700">Authentication Service</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-700">Watson AI (Port 3004)</span>
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

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {isOnboardingComplete ? (
                    <>
                      <Link
                        to="/chat"
                        className="flex-1 inline-flex justify-center items-center px-6 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-lg"
                      >
                        🚀 Start Chatting with Watson
                      </Link>
                      <Link
                        to="/onboarding"
                        className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-primary-300 text-base font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                      >
                        ⚙️ Manage Providers
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/onboarding"
                        className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                      >
                        🚀 Complete Setup
                      </Link>
                      <div className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed">
                        💬 Chat with Watson (Complete setup first)
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}