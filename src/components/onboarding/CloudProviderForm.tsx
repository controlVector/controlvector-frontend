import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { secretAPI } from '@/services/contextAPI'

interface CloudProviderFormProps {
  onComplete: () => void
  onSkip: () => void
}

interface CloudProvider {
  id: string
  name: string
  logo: string
  description: string
  fields: {
    name: string
    label: string
    type: 'text' | 'password'
    placeholder: string
    required: boolean
    help?: string
  }[]
}

const CLOUD_PROVIDERS: CloudProvider[] = [
  {
    id: 'digitalocean',
    name: 'DigitalOcean',
    logo: '🌊',
    description: 'Simple cloud infrastructure',
    fields: [
      {
        name: 'api_token',
        label: 'Personal Access Token',
        type: 'password',
        placeholder: 'dop_v1_...',
        required: true,
        help: 'Generate a token with read/write access in DigitalOcean API settings'
      }
    ]
  },
  {
    id: 'aws',
    name: 'Amazon Web Services',
    logo: '🅰️',
    description: 'Comprehensive cloud platform',
    fields: [
      {
        name: 'access_key_id',
        label: 'Access Key ID',
        type: 'text',
        placeholder: 'AKIA...',
        required: true
      },
      {
        name: 'secret_access_key',
        label: 'Secret Access Key',
        type: 'password',
        placeholder: 'Enter AWS Secret Access Key',
        required: true
      },
      {
        name: 'default_region',
        label: 'Default Region',
        type: 'text',
        placeholder: 'us-east-1',
        required: true
      }
    ]
  },
  {
    id: 'gcp',
    name: 'Google Cloud Platform',
    logo: '☁️',
    description: 'Google\'s cloud infrastructure',
    fields: [
      {
        name: 'project_id',
        label: 'Project ID',
        type: 'text',
        placeholder: 'my-gcp-project',
        required: true
      },
      {
        name: 'service_account_key',
        label: 'Service Account Key (JSON)',
        type: 'password',
        placeholder: 'Paste your service account JSON key',
        required: true,
        help: 'Download the JSON key file from GCP Console > IAM & Admin > Service Accounts'
      }
    ]
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    logo: '🔷',
    description: 'Microsoft cloud services',
    fields: [
      {
        name: 'subscription_id',
        label: 'Subscription ID',
        type: 'text',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        required: true
      },
      {
        name: 'client_id',
        label: 'Application (Client) ID',
        type: 'text',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        required: true
      },
      {
        name: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'Enter client secret',
        required: true
      },
      {
        name: 'tenant_id',
        label: 'Directory (Tenant) ID',
        type: 'text',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        required: true
      }
    ]
  }
]

export function CloudProviderForm({ onComplete, onSkip }: CloudProviderFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleProviderSelect = (provider: CloudProvider) => {
    setSelectedProvider(provider)
    setFormData({})
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
      if (selectedProvider.id === 'digitalocean') {
        await secretAPI.storeCredential({
          key: 'digitalocean_api_token',
          value: formData.api_token,
          credential_type: 'api_key',
          provider: 'digitalocean'
        })
      } else if (selectedProvider.id === 'aws') {
        await secretAPI.storeCredential({
          key: 'aws_access_key_id',
          value: formData.access_key_id,
          credential_type: 'api_key',
          provider: 'aws'
        })

        await secretAPI.storeCredential({
          key: 'aws_secret_access_key',
          value: formData.secret_access_key,
          credential_type: 'api_key',
          provider: 'aws'
        })

        await secretAPI.storeCredential({
          key: 'aws_default_region',
          value: formData.default_region,
          credential_type: 'api_key',
          provider: 'aws'
        })
      } else if (selectedProvider.id === 'gcp') {
        await secretAPI.storeCredential({
          key: 'gcp_project_id',
          value: formData.project_id,
          credential_type: 'api_key',
          provider: 'gcp'
        })

        await secretAPI.storeCredential({
          key: 'gcp_service_account_key',
          value: formData.service_account_key,
          credential_type: 'api_key',
          provider: 'gcp'
        })
      } else if (selectedProvider.id === 'azure') {
        await secretAPI.storeCredential({
          key: 'azure_subscription_id',
          value: formData.subscription_id,
          credential_type: 'api_key',
          provider: 'azure'
        })

        await secretAPI.storeCredential({
          key: 'azure_client_id',
          value: formData.client_id,
          credential_type: 'api_key',
          provider: 'azure'
        })

        await secretAPI.storeCredential({
          key: 'azure_client_secret',
          value: formData.client_secret,
          credential_type: 'api_key',
          provider: 'azure'
        })

        await secretAPI.storeCredential({
          key: 'azure_tenant_id',
          value: formData.tenant_id,
          credential_type: 'api_key',
          provider: 'azure'
        })
      }

      toast.success(`${selectedProvider.name} credentials stored securely!`)
      onComplete()
    } catch (error) {
      console.error('Error storing cloud credentials:', error)
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
            <h4 className="text-lg font-semibold text-gray-900">
              {selectedProvider.name}
            </h4>
            <p className="text-sm text-gray-600">{selectedProvider.description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {selectedProvider.fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.name === 'service_account_key' ? (
                <textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                  required={field.required}
                />
              ) : (
                <input
                  type={field.type}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required={field.required}
                />
              )}
              {field.help && (
                <p className="text-xs text-gray-500 mt-1">{field.help}</p>
              )}
            </div>
          ))}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
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
      <p className="text-gray-600 mb-6">
        Connect your cloud provider to enable ControlVector to provision and manage 
        infrastructure resources automatically.
      </p>

      <div className="grid gap-4">
        {CLOUD_PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            onClick={() => handleProviderSelect(provider)}
            className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
          >
            <span className="text-3xl">{provider.logo}</span>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{provider.name}</h4>
              <p className="text-sm text-gray-600">{provider.description}</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      <div className="border-t pt-6">
        <button
          onClick={onSkip}
          className="w-full px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          Skip cloud provider setup for now
        </button>
      </div>
    </div>
  )
}