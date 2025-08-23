import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { secretAPI } from '@/services/contextAPI'

interface DNSProviderFormProps {
  onComplete: () => void
  onSkip: () => void
}

interface DNSProvider {
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
  }[]
}

const DNS_PROVIDERS: DNSProvider[] = [
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    logo: '☁️',
    description: 'Global DNS and CDN service',
    fields: [
      {
        name: 'api_token',
        label: 'API Token',
        type: 'password',
        placeholder: 'Enter your Cloudflare API Token',
        required: true
      },
      {
        name: 'zone_id',
        label: 'Zone ID (Optional)',
        type: 'text',
        placeholder: 'Default zone ID for operations',
        required: false
      }
    ]
  },
  {
    id: 'route53',
    name: 'AWS Route 53',
    logo: '🅰️',
    description: 'Amazon Web Services DNS',
    fields: [
      {
        name: 'access_key_id',
        label: 'Access Key ID',
        type: 'text',
        placeholder: 'AWS Access Key ID',
        required: true
      },
      {
        name: 'secret_access_key',
        label: 'Secret Access Key',
        type: 'password',
        placeholder: 'AWS Secret Access Key',
        required: true
      },
      {
        name: 'region',
        label: 'Default Region',
        type: 'text',
        placeholder: 'us-east-1',
        required: false
      }
    ]
  },
  {
    id: 'digitalocean',
    name: 'DigitalOcean DNS',
    logo: '🌊',
    description: 'DigitalOcean DNS management',
    fields: [
      {
        name: 'api_token',
        label: 'Personal Access Token',
        type: 'password',
        placeholder: 'Enter your DigitalOcean API Token',
        required: true
      }
    ]
  }
]

export function DNSProviderForm({ onComplete, onSkip }: DNSProviderFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<DNSProvider | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleProviderSelect = (provider: DNSProvider) => {
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

      // Store credentials in Context Manager
      if (selectedProvider.id === 'cloudflare') {
        await secretAPI.storeCredential({
          key: 'cloudflare_api_token',
          value: formData.api_token,
          credential_type: 'api_key',
          provider: 'cloudflare'
        })

        if (formData.zone_id) {
          await secretAPI.storeCredential({
            key: 'cloudflare_zone_id',
            value: formData.zone_id,
            credential_type: 'api_key',
            provider: 'cloudflare'
          })
        }
      } else if (selectedProvider.id === 'route53') {
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

        if (formData.region) {
          await secretAPI.storeCredential({
            key: 'aws_default_region',
            value: formData.region,
            credential_type: 'api_key',
            provider: 'aws'
          })
        }
      } else if (selectedProvider.id === 'digitalocean') {
        await secretAPI.storeCredential({
          key: 'digitalocean_api_token',
          value: formData.api_token,
          credential_type: 'api_key',
          provider: 'digitalocean'
        })
      }

      toast.success(`${selectedProvider.name} DNS credentials stored securely!`)
      onComplete()
    } catch (error) {
      console.error('Error storing DNS credentials:', error)
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
              <input
                type={field.type}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required={field.required}
              />
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
        Connect your DNS provider to enable ControlVector to manage domain records 
        and SSL certificates automatically.
      </p>

      <div className="grid gap-4">
        {DNS_PROVIDERS.map((provider) => (
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
          Skip DNS setup for now
        </button>
      </div>
    </div>
  )
}