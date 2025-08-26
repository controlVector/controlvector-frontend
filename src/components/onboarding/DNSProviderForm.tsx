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
    description: 'Global DNS and CDN service (requires Account API token)',
    fields: [
      {
        name: 'account_id',
        label: 'Account ID',
        type: 'text',
        placeholder: 'Your Cloudflare Account ID (32-character hex)',
        required: true
      },
      {
        name: 'api_token',
        label: 'Account API Token',
        type: 'password',
        placeholder: 'Enter your Cloudflare Account API Token',
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
  const [curlCommand, setCurlCommand] = useState('')
  const [showCurlInput, setShowCurlInput] = useState(false)

  const handleProviderSelect = (provider: DNSProvider) => {
    setSelectedProvider(provider)
    setFormData({})
    setShowForm(true)
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const parseCurlCommand = (curl: string) => {
    try {
      // Extract account ID from URL pattern: /accounts/{account_id}/
      const accountIdMatch = curl.match(/\/accounts\/([a-f0-9]{32})\//i)
      // Extract Bearer token
      const tokenMatch = curl.match(/Bearer\s+([A-Za-z0-9_-]+)/i)
      
      if (accountIdMatch && tokenMatch) {
        setFormData(prev => ({
          ...prev,
          account_id: accountIdMatch[1],
          api_token: tokenMatch[1]
        }))
        toast.success('Account ID and API token extracted from curl command!')
        setShowCurlInput(false)
        setCurlCommand('')
      } else {
        toast.error('Could not extract Account ID and token from curl command. Please check the format.')
      }
    } catch (error) {
      toast.error('Failed to parse curl command')
    }
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
          key: 'cloudflare_account_id',
          value: formData.account_id,
          credential_type: 'api_key',
          provider: 'cloudflare'
        })

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
            <h4 className="text-lg font-semibold text-white">
              {selectedProvider.name}
            </h4>
            <p className="text-sm text-cv-dark-200">{selectedProvider.description}</p>
          </div>
        </div>

        {/* Cloudflare-specific guidance */}
        {selectedProvider.id === 'cloudflare' && (
          <div className="bg-cv-dark-700 border border-cv-orange-500/20 rounded-lg p-4 mb-6">
            <h5 className="text-sm font-semibold text-cv-orange-400 mb-2">📘 Cloudflare Account API Token Required</h5>
            <p className="text-xs text-cv-dark-200 mb-3">
              ControlVector requires Account API tokens, not standard API tokens. Account tokens have access to account-level operations.
            </p>
            
            <div className="space-y-2 mb-3">
              <p className="text-xs text-cv-dark-200">
                <strong>1. Find Account ID:</strong> Dashboard → Right sidebar → Account ID (32-char hex)
              </p>
              <p className="text-xs text-cv-dark-200">
                <strong>2. Create Account Token:</strong> <a 
                  href="https://dash.cloudflare.com/profile/api-tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cv-orange-400 hover:text-cv-orange-300 underline"
                >
                  Profile → API Tokens → Create Token
                </a>
              </p>
              <p className="text-xs text-cv-dark-200">
                <strong>3. Use Template:</strong> "Custom token" → Include <code className="bg-cv-dark-800 px-1 rounded text-cv-matrix-green">Account:Read</code> permission
              </p>
            </div>
            
            <div className="mt-3 pt-3 border-t border-cv-dark-600">
              <button
                type="button"
                onClick={() => setShowCurlInput(!showCurlInput)}
                className="text-xs text-cv-orange-400 hover:text-cv-orange-300 underline"
              >
                {showCurlInput ? 'Hide' : 'Show'} curl command parser
              </button>
              
              {showCurlInput && (
                <div className="mt-3 space-y-2">
                  <label className="block text-xs font-medium text-cv-dark-200">
                    Paste your working curl command:
                  </label>
                  <textarea
                    value={curlCommand}
                    onChange={(e) => setCurlCommand(e.target.value)}
                    placeholder='curl "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/tokens/verify" -H "Authorization: Bearer YOUR_TOKEN"'
                    className="w-full px-2 py-1 bg-cv-dark-800 text-cv-matrix-green border border-cv-dark-600 rounded text-xs font-mono resize-none"
                    rows={3}
                  />
                  <button
                    type="button"
                    onClick={() => parseCurlCommand(curlCommand)}
                    className="px-3 py-1 text-xs bg-cv-orange-600 text-white rounded hover:bg-cv-orange-700 transition-colors"
                  >
                    Extract Account ID & Token
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-2">
              <a 
                href="https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-cv-orange-400 hover:text-cv-orange-300 underline inline-flex items-center gap-1"
              >
                📖 Official Documentation →
              </a>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {selectedProvider.fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-cv-dark-200 mb-1">
                {field.label} {field.required && <span className="text-cv-orange-400">*</span>}
              </label>
              <input
                type={field.type}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 bg-cv-dark-700 text-white border border-cv-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cv-orange-500 focus:border-cv-orange-500 placeholder-cv-dark-400 transition-colors"
                required={field.required}
              />
            </div>
          ))}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 px-4 py-2 text-sm font-medium text-cv-dark-200 bg-cv-dark-800 border border-cv-dark-600 rounded-md hover:bg-cv-dark-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cv-orange-500 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium cv-white-glow bg-cv-orange-600 border border-transparent rounded-md hover:bg-cv-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cv-orange-500 disabled:opacity-50 transition-colors"
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
        Connect your DNS provider to enable ControlVector to manage domain records 
        and SSL certificates automatically.
      </p>

      <div className="grid gap-4">
        {DNS_PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            onClick={() => handleProviderSelect(provider)}
            className="flex items-center space-x-4 p-4 border border-cv-dark-600 rounded-lg hover:border-cv-orange-500 hover:bg-cv-dark-700 transition-colors text-left bg-cv-dark-800"
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

      <div className="border-t pt-6">
        <button
          onClick={onSkip}
          className="w-full px-4 py-2 text-sm font-medium text-cv-dark-400 hover:text-cv-orange-400 transition-colors"
        >
          Skip DNS setup for now
        </button>
      </div>
    </div>
  )
}