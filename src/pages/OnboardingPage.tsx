import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { secretAPI } from '@/services/contextAPI'
import { LLMProviderForm } from '@/components/onboarding/LLMProviderForm'
import { DNSProviderForm } from '@/components/onboarding/DNSProviderForm'
import { CloudProviderForm } from '@/components/onboarding/CloudProviderForm'
import { GitProviderForm } from '@/components/onboarding/GitProviderForm'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: string
  completed: boolean
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'llm',
      title: 'AI Assistant',
      description: 'Configure your preferred AI provider (OpenAI, Claude, Gemini, etc.)',
      icon: '🤖',
      completed: false
    },
    {
      id: 'dns',
      title: 'DNS Provider',
      description: 'Connect your DNS service (Cloudflare, Route 53, etc.)',
      icon: '🌐',
      completed: false
    },
    {
      id: 'cloud',
      title: 'Cloud Provider', 
      description: 'Add your cloud infrastructure credentials',
      icon: '☁️',
      completed: false
    },
    {
      id: 'git',
      title: 'Git Repositories',
      description: 'Connect GitHub, GitLab for code deployment',
      icon: '🔗',
      completed: false
    },
    {
      id: 'complete',
      title: 'All Set!',
      description: 'Your ControlVector is ready to manage infrastructure',
      icon: '🎉',
      completed: false
    }
  ])

  // Initialize completion state on page load
  const initializeCompletionState = async () => {
    try {
      const secrets = await secretAPI.listSecrets()
      
      const updatedSteps = steps.map(step => {
        let completed = false
        
        switch (step.id) {
          case 'llm':
            completed = secrets.credentials.some(cred => 
              ['openai', 'anthropic', 'google'].includes(cred.provider)
            )
            break
          case 'dns':
            completed = secrets.credentials.some(cred => 
              ['cloudflare', 'aws', 'digitalocean'].includes(cred.provider) &&
              (cred.key.includes('api_token') || cred.key.includes('access_key'))
            )
            break
          case 'cloud':
            completed = secrets.credentials.some(cred => 
              ['digitalocean', 'aws', 'gcp', 'azure'].includes(cred.provider) &&
              (cred.key.includes('api_token') || cred.key.includes('access_key') || cred.key.includes('subscription_id'))
            )
            break
          case 'git':
            completed = secrets.credentials.some(cred => 
              ['github', 'gitlab'].includes(cred.provider)
            ) || secrets.ssh_keys.length > 0
            break
        }
        
        return { ...step, completed }
      })
      
      setSteps(updatedSteps)
      
      // Find the first incomplete step or go to complete
      const firstIncompleteIndex = updatedSteps.findIndex(step => !step.completed && step.id !== 'complete')
      if (firstIncompleteIndex === -1) {
        // All steps completed, go to final step
        setCurrentStep(updatedSteps.length - 1)
      } else {
        setCurrentStep(firstIncompleteIndex)
      }
    } catch (error) {
      console.error('Failed to check completion state:', error)
      // Continue with default state
    } finally {
      setInitializing(false)
    }
  }

  // Initialize on mount
  React.useEffect(() => {
    initializeCompletionState()
  }, [])

  const completeStep = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ))
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipOnboarding = () => {
    navigate('/dashboard')
  }

  const finishOnboarding = async () => {
    try {
      setIsLoading(true)
      // Mark onboarding as completed in user preferences
      toast.success('Onboarding completed! Welcome to ControlVector.')
      navigate('/dashboard')
    } catch (error) {
      toast.error('Failed to complete onboarding')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    const step = steps[currentStep]
    
    switch (step.id) {
      case 'llm':
        return (
          <LLMProviderForm 
            onComplete={() => {
              completeStep('llm')
              nextStep()
            }}
            onSkip={nextStep}
          />
        )
      case 'dns':
        return (
          <DNSProviderForm 
            onComplete={() => {
              completeStep('dns')
              nextStep()
            }}
            onSkip={nextStep}
          />
        )
      case 'cloud':
        return (
          <CloudProviderForm 
            onComplete={() => {
              completeStep('cloud')
              nextStep()
            }}
            onSkip={nextStep}
          />
        )
      case 'git':
        return (
          <GitProviderForm 
            onComplete={() => {
              completeStep('git')
              nextStep()
            }}
            onSkip={nextStep}
          />
        )
      case 'complete':
        return (
          <div className="text-center py-8">
            <div className="mx-auto h-24 w-24 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">🎉</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              You're all set!
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Your ControlVector is now configured and ready to help you manage your infrastructure through conversational AI.
            </p>
            
            {/* Show configured services */}
            <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
              {steps.slice(0, -1).filter(step => step.completed).map(step => (
                <div key={step.id} className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-green-600 text-lg">{step.icon}</span>
                  <span className="text-sm font-medium text-green-800">{step.title}</span>
                  <span className="text-green-600">✓</span>
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => navigate('/chat')}
                className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-lg transition-all duration-200"
              >
                🚀 Start Chatting with AI Infrastructure Assistant
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                View Dashboard
              </button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your setup progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ControlVector Setup</h1>
            </div>
            
            <button
              onClick={skipOnboarding}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip setup
            </button>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Step {currentStep + 1} of {steps.length}
              </h2>
              <span className="text-sm text-gray-500">
                {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            
            {/* Steps */}
            <div className="flex justify-between mt-6">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    index <= currentStep ? 'text-primary-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2 ${
                      step.completed
                        ? 'bg-green-100 text-green-600'
                        : index === currentStep
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step.completed ? '✓' : step.icon}
                  </div>
                  <span className="text-xs font-medium text-center">
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-8"
          >
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {steps[currentStep].title}
              </h3>
              <p className="text-gray-600">
                {steps[currentStep].description}
              </p>
            </div>

            {renderStepContent()}

            {/* Navigation buttons (except for complete step) */}
            {steps[currentStep].id !== 'complete' && (
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={previousStep}
                  disabled={currentStep === 0}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="text-sm text-gray-500">
                  Step {currentStep + 1} of {steps.length}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}