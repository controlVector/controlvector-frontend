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

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const secrets = await secretAPI.listSecrets()
      const providers: string[] = []
      
      // Check LLM providers
      if (secrets.credentials.some(cred => ['openai', 'anthropic', 'google'].includes(cred.provider))) {
        providers.push('AI Assistant')
      }
      
      // Check DNS providers
      if (secrets.credentials.some(cred => 
        ['cloudflare', 'aws', 'digitalocean'].includes(cred.provider) &&
        (cred.key.includes('api_token') || cred.key.includes('access_key'))
      )) {
        providers.push('DNS Provider')
      }
      
      // Check Cloud providers
      if (secrets.credentials.some(cred => 
        ['digitalocean', 'aws', 'gcp', 'azure'].includes(cred.provider) &&
        (cred.key.includes('api_token') || cred.key.includes('access_key') || cred.key.includes('subscription_id'))
      )) {
        providers.push('Cloud Provider')
      }
      
      // Check Git providers
      if (secrets.credentials.some(cred => 
        ['github', 'gitlab'].includes(cred.provider)
      ) || secrets.ssh_keys.length > 0) {
        providers.push('Git Repositories')
      }
      
      setCompletedProviders(providers)
      setIsOnboardingComplete(providers.length >= 2) // Complete if at least 2 providers configured
    } catch (error) {
      console.error('Failed to check onboarding status:', error)
      setIsOnboardingComplete(false)
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
                  
                  {completedProviders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                      {completedProviders.map((provider) => (
                        <div key={provider} className="flex items-center">
                          <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                          <span className="text-sm text-gray-700">{provider}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 text-left">
                      <p>No providers configured yet. Complete onboarding to set up:</p>
                      <ul className="mt-2 space-y-1 ml-4">
                        <li>• AI Assistant (OpenAI, Anthropic, etc.)</li>
                        <li>• DNS Provider (Cloudflare, Route53, etc.)</li>
                        <li>• Cloud Provider (DigitalOcean, AWS, etc.)</li>
                        <li>• Git Repositories (GitHub, GitLab, SSH)</li>
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