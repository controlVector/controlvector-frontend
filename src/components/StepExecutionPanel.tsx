import React from 'react'

interface ExecutionStep {
  id: string
  service: string
  action: string
  description: string
  parameters: any
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'skipped'
  estimatedTime?: string
}

interface StepExecutionPanelProps {
  steps: ExecutionStep[]
  onStepExecute: (stepId: string, stepName: string) => void
  className?: string
}

const getStepDisplayName = (step: ExecutionStep): string => {
  // Convert service/action combinations to user-friendly names
  const serviceActionMap: Record<string, string> = {
    'mercury_analyze_repository': 'Analyze Repo',
    'mercury_get_repository': 'Get Repo',
    'atlas_provision_infrastructure': 'Provision',
    'atlas_get_infrastructure_overview': 'Check Infra',
    'neptune_create_dns_record': 'Config DNS',
    'neptune_configure_domain_ssl': 'Setup SSL',
    'hermes_generate_ssh_key': 'SSH Keys',
    'phoenix_deploy_application': 'Deploy App',
    'context_create_deployment_session': 'Create Session',
    'context_get_deployment_session': 'Get Session'
  }

  // Try exact match first
  const key = `${step.service}_${step.action}`.toLowerCase()
  if (serviceActionMap[key]) {
    return serviceActionMap[key]
  }

  // Try service-based mapping
  const serviceMap: Record<string, string> = {
    'mercury': 'Repo',
    'atlas': 'Provision',
    'neptune': 'DNS',
    'hermes': 'SSH',
    'phoenix': 'Deploy',
    'context': 'Session'
  }

  if (serviceMap[step.service.toLowerCase()]) {
    return serviceMap[step.service.toLowerCase()]
  }

  // Fallback to service name
  return step.service.charAt(0).toUpperCase() + step.service.slice(1)
}

const getStepIcon = (step: ExecutionStep): string => {
  const service = step.service.toLowerCase()
  const action = step.action.toLowerCase()
  
  if (service.includes('mercury') || action.includes('repository') || action.includes('analyze')) return '📊'
  if (service.includes('atlas') || action.includes('provision') || action.includes('infrastructure')) return '🏗️'
  if (service.includes('neptune') || action.includes('dns') || action.includes('domain')) return '🌐'
  if (service.includes('hermes') || action.includes('ssh') || action.includes('key')) return '🔑'
  if (service.includes('phoenix') || action.includes('deploy') || action.includes('application')) return '🚀'
  if (service.includes('context') || action.includes('session')) return '📋'
  
  return '⚙️'
}

const getStatusColor = (status: ExecutionStep['status']): string => {
  switch (status) {
    case 'pending':
      return 'bg-cv-dark-700 border-cv-dark-500 text-cv-dark-200'
    case 'approved':
      return 'bg-cv-orange-600 border-cv-orange-500 text-white hover:bg-cv-orange-700'
    case 'executing':
      return 'bg-blue-600 border-blue-500 text-white animate-pulse'
    case 'completed':
      return 'bg-green-600 border-green-500 text-white'
    case 'failed':
      return 'bg-red-600 border-red-500 text-white'
    case 'skipped':
      return 'bg-cv-dark-600 border-cv-dark-500 text-cv-dark-300'
    default:
      return 'bg-cv-dark-700 border-cv-dark-500 text-cv-dark-200'
  }
}

const getButtonText = (step: ExecutionStep): string => {
  switch (step.status) {
    case 'pending':
      return getStepDisplayName(step)
    case 'approved':
      return 'Execute'
    case 'executing':
      return 'Running...'
    case 'completed':
      return '✓ Done'
    case 'failed':
      return '✗ Failed'
    case 'skipped':
      return '− Skipped'
    default:
      return getStepDisplayName(step)
  }
}

export default function StepExecutionPanel({ steps, onStepExecute, className = '' }: StepExecutionPanelProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-cv-dark-600 ${className}`}>
      <h4 className="text-sm font-medium text-cv-dark-300 mb-3">Execute Steps:</h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => onStepExecute(step.id, getStepDisplayName(step))}
            disabled={step.status === 'executing' || step.status === 'completed' || step.status === 'failed'}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200
              flex items-center gap-1.5 min-h-[2.5rem] w-full
              ${getStatusColor(step.status)}
              disabled:cursor-not-allowed
            `}
            title={getButtonText(step)}
          >
            <span className="text-base flex-shrink-0">{getStepIcon(step)}</span>
            <span className="text-left flex-1 overflow-hidden">
              <span className="block truncate">{getButtonText(step)}</span>
            </span>
            {step.estimatedTime && step.status === 'pending' && (
              <span className="text-xs text-cv-dark-400 ml-1">
                ({step.estimatedTime})
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Progress indicator */}
      {steps.length > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-cv-dark-400 mb-1">
            <span>Progress</span>
            <span>
              {steps.filter(s => s.status === 'completed').length} / {steps.length} steps
            </span>
          </div>
          <div className="w-full bg-cv-dark-700 rounded-full h-2">
            <div 
              className="bg-cv-orange-500 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}