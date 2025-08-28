import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { secretAPI } from '@/services/contextAPI'
import { MatrixRain } from '@/components/ui/MatrixRain'
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
            <div className="mx-auto h-24 w-24 bg-gradient-to-r from-cv-matrix-green to-cv-orange-500 rounded-full flex items-center justify-center mb-6 cv-orange-glow">
              <span className="text-4xl">🎉</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              You're all set!
            </h3>
            <p className="text-lg text-cv-dark-200 mb-8 max-w-md mx-auto">
              Your ControlVector is now configured and ready to help you manage your infrastructure through conversational AI.
            </p>
            
            {/* Show configured services */}
            <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
              {steps.slice(0, -1).filter(step => step.completed).map(step => (
                <div key={step.id} className="flex items-center space-x-2 p-3 bg-cv-dark-700 rounded-lg border border-cv-matrix-green">
                  <span className="text-cv-matrix-green text-lg">{step.icon}</span>
                  <span className="text-sm font-medium text-cv-matrix-green">{step.title}</span>
                  <span className="text-cv-matrix-green">✓</span>
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => navigate('/chat')}
                className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md cv-white-glow bg-gradient-to-r from-cv-orange-600 to-cv-orange-500 hover:from-cv-orange-700 hover:to-cv-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cv-orange-500 shadow-lg transition-all duration-200"
              >
                🚀 Start Chatting with Victor AI
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full inline-flex justify-center items-center px-6 py-3 border border-cv-orange-500 text-base font-medium rounded-md text-cv-orange-400 bg-cv-dark-800 hover:bg-cv-dark-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cv-orange-500 transition-colors"
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
      <div className="min-h-screen bg-cv-dark-900 relative overflow-hidden flex items-center justify-center">
        <MatrixRain intensity="low" color="orange" className="opacity-10" />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cv-orange-500 mx-auto mb-4"></div>
          <p className="text-cv-dark-200">Loading your setup progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cv-dark-900 relative overflow-hidden">
      <MatrixRain intensity="low" color="orange" className="opacity-10" />
      {/* Header */}
      <header className="bg-cv-dark-800 shadow-sm border-b border-cv-dark-600 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-cv-orange-600 to-cv-orange-500 rounded-lg flex items-center justify-center mr-3 cv-orange-glow">
                <div className="text-sm font-black text-white">CV</div>
              </div>
              <h1 className="text-2xl font-bold text-white">ControlVector Setup</h1>
            </div>
            
            <button
              onClick={skipOnboarding}
              className="text-sm text-cv-dark-300 hover:text-cv-orange-400 transition-colors"
            >
              Skip setup
            </button>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-cv-dark-800 border-b border-cv-dark-600 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Step {currentStep + 1} of {steps.length}
              </h2>
              <span className="text-sm text-cv-dark-300">
                {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-cv-dark-700 rounded-full h-2">
              <div 
                className="bg-cv-orange-500 h-2 rounded-full transition-all duration-300 cv-orange-glow"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            
            {/* Steps */}
            <div className="flex justify-between mt-6">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    index <= currentStep ? 'text-cv-orange-400' : 'text-cv-dark-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2 ${
                      step.completed
                        ? 'bg-cv-dark-700 text-cv-matrix-green border border-cv-matrix-green'
                        : index === currentStep
                        ? 'bg-cv-dark-700 text-cv-orange-400 border border-cv-orange-400 cv-orange-glow'
                        : 'bg-cv-dark-700 text-cv-dark-400 border border-cv-dark-600'
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
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-cv-dark-800 rounded-lg shadow-lg border border-cv-dark-600 p-8"
          >
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                {steps[currentStep].title}
              </h3>
              <p className="text-cv-dark-200">
                {steps[currentStep].description}
              </p>
            </div>

            {renderStepContent()}

            {/* Navigation buttons (except for complete step) */}
            {steps[currentStep].id !== 'complete' && (
              <div className="flex justify-between mt-8 pt-6 border-t border-cv-dark-600">
                <button
                  onClick={previousStep}
                  disabled={currentStep === 0}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-cv-dark-200 bg-cv-dark-800 border border-cv-dark-600 rounded-md hover:bg-cv-dark-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cv-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <div className="text-sm text-cv-dark-300">
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