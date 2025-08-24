import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { secretAPI } from '@/services/contextAPI'

interface GitProviderFormProps {
  onComplete: () => void
  onSkip: () => void
}

interface GitProvider {
  id: string
  name: string
  logo: string
  description: string
  authType: 'token' | 'ssh' | 'oauth'
  fields: {
    name: string
    label: string
    type: 'text' | 'password' | 'textarea'
    placeholder: string
    required: boolean
    help?: string
  }[]
}

const GIT_PROVIDERS: GitProvider[] = [
  {
    id: 'github',
    name: 'GitHub',
    logo: '🐙',
    description: 'GitHub repositories and actions',
    authType: 'token',
    fields: [
      {
        name: 'personal_access_token',
        label: 'Personal Access Token',
        type: 'password',
        placeholder: 'ghp_...',
        required: true,
        help: 'Create a token with repo, workflow, and admin:org permissions'
      },
      {
        name: 'default_org',
        label: 'Default Organization (Optional)',
        type: 'text',
        placeholder: 'your-organization',
        required: false
      }
    ]
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    logo: '🦊',
    description: 'GitLab repositories and CI/CD',
    authType: 'token',
    fields: [
      {
        name: 'personal_access_token',
        label: 'Personal Access Token',
        type: 'password',
        placeholder: 'glpat-...',
        required: true,
        help: 'Create a token with api, read_repository, and write_repository scopes'
      },
      {
        name: 'gitlab_url',
        label: 'GitLab URL',
        type: 'text',
        placeholder: 'https://gitlab.com',
        required: true
      },
      {
        name: 'default_group',
        label: 'Default Group (Optional)',
        type: 'text',
        placeholder: 'your-group',
        required: false
      }
    ]
  },
  {
    id: 'ssh_key',
    name: 'SSH Key',
    logo: '🔑',
    description: 'SSH key for Git operations',
    authType: 'ssh',
    fields: [
      {
        name: 'ssh_private_key',
        label: 'Private SSH Key',
        type: 'textarea',
        placeholder: '-----BEGIN OPENSSH PRIVATE KEY-----\n...',
        required: true,
        help: 'Paste your private SSH key (keep this secure!)'
      },
      {
        name: 'ssh_public_key',
        label: 'Public SSH Key',
        type: 'textarea',
        placeholder: 'ssh-rsa AAAAB3NzaC1yc2E...',
        required: true
      },
      {
        name: 'key_name',
        label: 'Key Name',
        type: 'text',
        placeholder: 'my-deployment-key',
        required: true
      }
    ]
  }
]

export function GitProviderForm({ onComplete, onSkip }: GitProviderFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<GitProvider | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleProviderSelect = (provider: GitProvider) => {
    setSelectedProvider(provider)
    setFormData(provider.id === 'gitlab' ? { gitlab_url: 'https://gitlab.com' } : {})
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

      // Store credentials based on provider
      if (selectedProvider.id === 'github') {
        await secretAPI.storeCredential({
          key: 'github_personal_access_token',
          value: formData.personal_access_token,
          credential_type: 'token',
          provider: 'github'
        })

        if (formData.default_org) {
          await secretAPI.storeCredential({
            key: 'github_default_org',
            value: formData.default_org,
            credential_type: 'api_key',
            provider: 'github'
          })
        }
      } else if (selectedProvider.id === 'gitlab') {
        await secretAPI.storeCredential({
          key: 'gitlab_personal_access_token',
          value: formData.personal_access_token,
          credential_type: 'token',
          provider: 'gitlab'
        })

        await secretAPI.storeCredential({
          key: 'gitlab_url',
          value: formData.gitlab_url,
          credential_type: 'api_key',
          provider: 'gitlab'
        })

        if (formData.default_group) {
          await secretAPI.storeCredential({
            key: 'gitlab_default_group',
            value: formData.default_group,
            credential_type: 'api_key',
            provider: 'gitlab'
          })
        }
      } else if (selectedProvider.id === 'ssh_key') {
        await secretAPI.storeSSHKey({
          key_name: formData.key_name,
          private_key: formData.ssh_private_key,
          public_key: formData.ssh_public_key,
          key_type: 'rsa', // Default to RSA, could be detected
          metadata: {
            description: `SSH key for Git operations: ${formData.key_name}`
          }
        })
      }

      toast.success(`${selectedProvider.name} credentials stored securely!`)
      onComplete()
    } catch (error) {
      console.error('Error storing git credentials:', error)
      toast.error('Failed to store credentials. Please try again.')
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
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {selectedProvider.fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-white mb-1">
                {field.label} {field.required && <span className="text-cv-orange-400">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={field.name.includes('key') ? 6 : 3}
                  className="w-full px-3 py-2 bg-cv-dark-700 border border-cv-dark-600 rounded-md shadow-sm text-white placeholder-cv-dark-400 focus:outline-none focus:ring-2 focus:ring-cv-orange-500 focus:border-cv-orange-500 font-mono text-sm"
                  required={field.required}
                />
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

          {selectedProvider.id === 'ssh_key' && (
            <div className="bg-cv-dark-800 border border-cv-orange-500/30 rounded-md p-3"
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-cv-orange-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-cv-orange-100">
                    <strong>Security Note:</strong> SSH private keys are highly sensitive. 
                    They will be encrypted and stored securely in your context manager.
                  </p>
                </div>
              </div>
            </div>
          )}

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
              {isLoading ? 'Storing...' : 'Save & Continue'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-cv-dark-200 mb-6">
        Connect your Git repositories to enable ControlVector to deploy applications 
        and manage infrastructure as code.
      </p>

      <div className="grid gap-4">
        {GIT_PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            onClick={() => handleProviderSelect(provider)}
            className="flex items-center space-x-4 p-4 bg-cv-dark-800 border border-cv-dark-600 rounded-lg hover:border-cv-orange-500 hover:bg-cv-dark-700 transition-colors text-left"
          >
            <span className="text-3xl">{provider.logo}</span>
            <div className="flex-1">
              <h4 className="font-semibold text-white">{provider.name}</h4>
              <p className="text-sm text-cv-dark-200">{provider.description}</p>
              <p className="text-xs text-cv-dark-300 mt-1 capitalize">
                {provider.authType} authentication
              </p>
            </div>
            <svg className="w-5 h-5 text-cv-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      <div className="border-t border-cv-dark-600 pt-6">
        <button
          onClick={onSkip}
          className="w-full px-4 py-2 text-sm font-medium text-cv-dark-400 hover:text-cv-dark-200 transition-colors"
        >
          Skip Git setup for now
        </button>
      </div>
    </div>
  )
}