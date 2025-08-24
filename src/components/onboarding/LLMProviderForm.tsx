import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { secretAPI } from '@/services/contextAPI'

interface LLMProviderFormProps {
  onComplete: () => void
  onSkip: () => void
}

interface LLMProvider {
  id: string
  name: string
  logo: string
  description: string
  category: 'cloud' | 'local' | 'controlvector'
  fields: {
    name: string
    label: string
    type: 'text' | 'password' | 'select'
    placeholder: string
    required: boolean
    help?: string
    options?: { value: string; label: string }[]
  }[]
}

const LLM_PROVIDERS: LLMProvider[] = [
  {
    id: 'controlvector',
    name: 'ControlVector AI',
    logo: '⚡',
    description: 'Specialized infrastructure-focused AI models hosted by ControlVector',
    category: 'controlvector',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'cv-...',
        required: true,
        help: 'Get your API key from your ControlVector account dashboard'
      },
      {
        name: 'default_model',
        label: 'Default Model',
        type: 'select',
        placeholder: 'Select default model',
        required: true,
        options: [
          { value: 'cv-infra-pro', label: 'CV Infra Pro (Infrastructure specialist)' },
          { value: 'cv-devops-expert', label: 'CV DevOps Expert (Deployment & scaling)' },
          { value: 'cv-cost-optimizer', label: 'CV Cost Optimizer (Resource efficiency)' }
        ]
      }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    logo: '🤖',
    description: 'GPT-4, GPT-3.5 Turbo and other OpenAI models',
    category: 'cloud',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'sk-...',
        required: true,
        help: 'Get your API key from OpenAI dashboard'
      },
      {
        name: 'default_model',
        label: 'Default Model',
        type: 'select',
        placeholder: 'Select default model',
        required: true,
        options: [
          { value: 'gpt-4', label: 'GPT-4 (Best quality)' },
          { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo (Latest)' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Fast & affordable)' }
        ]
      },
      {
        name: 'organization_id',
        label: 'Organization ID (Optional)',
        type: 'text',
        placeholder: 'org-...',
        required: false,
        help: 'Only needed if you belong to multiple organizations'
      }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    logo: '🧠',
    description: 'Claude 3 (Opus, Sonnet, Haiku) models',
    category: 'cloud',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'sk-ant-api...',
        required: true,
        help: 'Get your API key from Anthropic console'
      },
      {
        name: 'default_model',
        label: 'Default Model',
        type: 'select',
        placeholder: 'Select default model',
        required: true,
        options: [
          { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Highest intelligence)' },
          { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet (Balanced)' },
          { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fastest)' }
        ]
      }
    ]
  },
  {
    id: 'google',
    name: 'Google Gemini',
    logo: '💎',
    description: 'Gemini Pro and Ultra models',
    category: 'cloud',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'AIza...',
        required: true,
        help: 'Get your API key from Google AI Studio'
      },
      {
        name: 'default_model',
        label: 'Default Model',
        type: 'select',
        placeholder: 'Select default model',
        required: true,
        options: [
          { value: 'gemini-pro', label: 'Gemini Pro (Best for complex tasks)' },
          { value: 'gemini-pro-vision', label: 'Gemini Pro Vision (With vision)' }
        ]
      }
    ]
  },
  {
    id: 'local',
    name: 'Local Models',
    logo: '🏠',
    description: 'Ollama or local model servers',
    category: 'local',
    fields: [
      {
        name: 'base_url',
        label: 'Server URL',
        type: 'text',
        placeholder: 'http://localhost:11434',
        required: true,
        help: 'URL where your local model server is running'
      },
      {
        name: 'model_name',
        label: 'Model Name',
        type: 'text',
        placeholder: 'llama2, mistral, codellama',
        required: true,
        help: 'Name of the model to use (e.g., llama2:7b, mistral:latest)'
      },
      {
        name: 'api_key',
        label: 'API Key (Optional)',
        type: 'password',
        placeholder: 'If your server requires authentication',
        required: false
      }
    ]
  }
]

export function LLMProviderForm({ onComplete, onSkip }: LLMProviderFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleProviderSelect = (provider: LLMProvider) => {
    setSelectedProvider(provider)
    // Set default values
    const defaults: Record<string, string> = {}
    if (provider.id === 'controlvector') {
      defaults.default_model = 'cv-infra-pro'
    } else if (provider.id === 'openai') {
      defaults.default_model = 'gpt-4'
    } else if (provider.id === 'anthropic') {
      defaults.default_model = 'claude-3-sonnet-20240229'
    } else if (provider.id === 'google') {
      defaults.default_model = 'gemini-pro'
    } else if (provider.id === 'local') {
      defaults.base_url = 'http://localhost:11434'
    }
    setFormData(defaults)
    setShowForm(true)
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProvider) return

    // Validate required fields
    const missingFields = selectedProvider.fields
      .filter(field => field.required && !formData[field.name])
      .map(field => field.label)

    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`)
      return
    }

    try {
      setIsLoading(true)

      // Store LLM configuration in Context Manager
      if (selectedProvider.id === 'controlvector') {
        await secretAPI.storeCredential({
          key: 'controlvector_api_key',
          value: formData.api_key,
          credential_type: 'api_key',
          provider: 'controlvector'
        })

        await secretAPI.storeCredential({
          key: 'controlvector_default_model',
          value: formData.default_model,
          credential_type: 'api_key',
          provider: 'controlvector'
        })
      } else if (selectedProvider.id === 'openai') {
        await secretAPI.storeCredential({
          key: 'openai_api_key',
          value: formData.api_key,
          credential_type: 'api_key',
          provider: 'openai'
        })

        await secretAPI.storeCredential({
          key: 'openai_default_model',
          value: formData.default_model,
          credential_type: 'api_key',
          provider: 'openai'
        })

        if (formData.organization_id) {
          await secretAPI.storeCredential({
            key: 'openai_organization_id',
            value: formData.organization_id,
            credential_type: 'api_key',
            provider: 'openai'
          })
        }
      } else if (selectedProvider.id === 'anthropic') {
        await secretAPI.storeCredential({
          key: 'anthropic_api_key',
          value: formData.api_key,
          credential_type: 'api_key',
          provider: 'anthropic'
        })

        await secretAPI.storeCredential({
          key: 'anthropic_default_model',
          value: formData.default_model,
          credential_type: 'api_key',
          provider: 'anthropic'
        })
      } else if (selectedProvider.id === 'google') {
        await secretAPI.storeCredential({
          key: 'google_api_key',
          value: formData.api_key,
          credential_type: 'api_key',
          provider: 'google'
        })

        await secretAPI.storeCredential({
          key: 'google_default_model',
          value: formData.default_model,
          credential_type: 'api_key',
          provider: 'google'
        })
      } else if (selectedProvider.id === 'local') {
        await secretAPI.storeCredential({
          key: 'local_llm_base_url',
          value: formData.base_url,
          credential_type: 'api_key',
          provider: 'local_llm'
        })

        await secretAPI.storeCredential({
          key: 'local_llm_model_name',
          value: formData.model_name,
          credential_type: 'api_key',
          provider: 'local_llm'
        })

        if (formData.api_key) {
          await secretAPI.storeCredential({
            key: 'local_llm_api_key',
            value: formData.api_key,
            credential_type: 'api_key',
            provider: 'local_llm'
          })
        }
      }

      // Store the selected LLM provider preference
      await secretAPI.storeCredential({
        key: 'preferred_llm_provider',
        value: selectedProvider.id,
        credential_type: 'api_key',
        provider: 'system'
      })

      toast.success(`${selectedProvider.name} configured successfully!`)
      onComplete()
    } catch (error: any) {
      console.error('Error storing LLM configuration:', error)
      
      // Handle authentication errors specifically
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.')
        // Clear tokens and redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/auth/login'
        return
      }
      
      toast.error('Failed to store LLM configuration. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setShowForm(false)
    setSelectedProvider(null)
    setFormData({})
  }

  if (showForm && selectedProvider) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <span className="text-2xl">{selectedProvider.logo}</span>
          <div>
            <h4 className="text-lg font-semibold text-white">
              {selectedProvider.name}
            </h4>
            <p className="text-sm text-cv-dark-200">{selectedProvider.description}</p>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
              selectedProvider.category === 'controlvector' ? 'bg-cv-orange-500/20 text-cv-orange-400' :
              selectedProvider.category === 'cloud' ? 'bg-blue-500/20 text-blue-400' : 'bg-cv-dark-600 text-cv-dark-200'
            }`}>
              {selectedProvider.category === 'controlvector' ? '⚡ ControlVector' : 
               selectedProvider.category === 'cloud' ? '☁️ Cloud' : '🏠 Local'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {selectedProvider.fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-white mb-1">
                {field.label} {field.required && <span className="text-cv-orange-400">*</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className="w-full px-3 py-2 bg-cv-dark-700 border border-cv-dark-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-cv-orange-500 focus:border-cv-orange-500"
                  required={field.required}
                >
                  <option value="" className="bg-cv-dark-700 text-cv-dark-400">{field.placeholder}</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value} className="bg-cv-dark-700 text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 bg-cv-dark-700 border border-cv-dark-600 rounded-md shadow-sm text-white placeholder-cv-dark-400 focus:outline-none focus:ring-2 focus:ring-cv-orange-500 focus:border-cv-orange-500"
                  required={field.required}
                />
              )}
              {field.help && (
                <p className="text-xs text-cv-dark-300 mt-1">{field.help}</p>
              )}
            </div>
          ))}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 px-4 py-2 text-sm font-medium text-cv-dark-200 bg-cv-dark-800 border border-cv-dark-600 rounded-md hover:bg-cv-dark-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cv-orange-500"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-cv-orange-500 cv-orange-glow border border-transparent rounded-md hover:bg-cv-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cv-orange-500 disabled:opacity-50"
            >
              {isLoading ? 'Configuring...' : 'Save & Continue'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-cv-dark-200 mb-6">
        Choose your AI assistant provider. Victor will use this to understand and execute 
        your infrastructure requests through natural language.
      </p>

      <div className="space-y-4">
        <h4 className="font-medium text-white text-sm uppercase tracking-wide">ControlVector AI</h4>
        <div className="grid gap-4">
          {LLM_PROVIDERS.filter(p => p.category === 'controlvector').map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleProviderSelect(provider)}
              className="flex items-center space-x-4 p-4 border-2 border-cv-orange-500/30 bg-gradient-to-r from-cv-orange-500/10 to-cv-orange-500/20 rounded-lg hover:border-cv-orange-500 hover:from-cv-orange-500/20 hover:to-cv-orange-500/30 transition-all text-left"
            >
              <span className="text-3xl">{provider.logo}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-white">{provider.name}</h4>
                <p className="text-sm text-cv-dark-200">{provider.description}</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cv-orange-500/20 text-cv-orange-400 mt-1">
                  ⚡ Recommended
                </span>
              </div>
              <svg className="w-5 h-5 text-cv-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        <h4 className="font-medium text-white text-sm uppercase tracking-wide mt-8">Cloud Providers</h4>
        <div className="grid gap-4">
          {LLM_PROVIDERS.filter(p => p.category === 'cloud').map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleProviderSelect(provider)}
              className="flex items-center space-x-4 p-4 bg-cv-dark-800 border border-cv-dark-600 rounded-lg hover:border-cv-orange-500 hover:bg-cv-dark-700 transition-colors text-left"
            >
              <span className="text-3xl">{provider.logo}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-white">{provider.name}</h4>
                <p className="text-sm text-cv-dark-200">{provider.description}</p>
              </div>
              <svg className="w-5 h-5 text-cv-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        <h4 className="font-medium text-white text-sm uppercase tracking-wide mt-8">Local Models</h4>
        <div className="grid gap-4">
          {LLM_PROVIDERS.filter(p => p.category === 'local').map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleProviderSelect(provider)}
              className="flex items-center space-x-4 p-4 bg-cv-dark-800 border border-cv-dark-600 rounded-lg hover:border-cv-orange-500 hover:bg-cv-dark-700 transition-colors text-left"
            >
              <span className="text-3xl">{provider.logo}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-white">{provider.name}</h4>
                <p className="text-sm text-cv-dark-200">{provider.description}</p>
              </div>
              <svg className="w-5 h-5 text-cv-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-cv-dark-600 pt-6">
        <button
          onClick={onSkip}
          className="w-full px-4 py-2 text-sm font-medium text-cv-dark-400 hover:text-cv-dark-200 transition-colors"
        >
          Skip LLM setup for now
        </button>
      </div>
    </div>
  )
}