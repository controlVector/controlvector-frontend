import React, { useState, useEffect } from 'react'

interface AgentStatusData {
  agent: string
  status: 'idle' | 'executing_tools' | 'processing_results' | 'error'
  activity: string
  details?: Array<{
    tool: string
    status: 'starting' | 'completed' | 'failed'
    result?: string
    execution_time?: string
  }>
  progress?: {
    current: number
    total: number
    percentage: number
  }
  timestamp: string
}

interface AgentStatusBarProps {
  websocket: WebSocket | null
  conversationId: string
  compact?: boolean
}

const AgentStatusBar: React.FC<AgentStatusBarProps> = ({ websocket, conversationId, compact = false }) => {
  const [agentStatus, setAgentStatus] = useState<AgentStatusData | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!websocket) return

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        console.log('[AgentStatusBar] WebSocket message received:', data.type, data)
        
        if (data.type === 'agent_status' && data.conversation_id === conversationId) {
          console.log('[AgentStatusBar] Agent status event matched, showing status bar')
          setAgentStatus(data)
          setIsVisible(true)
          
          // Keep visible for debugging - don't auto-hide
          // TODO: Add manual close button for debugging
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    websocket.addEventListener('message', handleMessage)
    
    return () => {
      websocket.removeEventListener('message', handleMessage)
    }
  }, [websocket, conversationId])

  if (!isVisible || !agentStatus) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executing_tools': return 'bg-cv-orange-500'
      case 'processing_results': return 'bg-cv-matrix-green' 
      case 'error': return 'bg-red-500'
      default: return 'bg-cv-dark-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executing_tools': return '⚙️'
      case 'processing_results': return '🧠'
      case 'error': return '❌'
      default: return '🤖'
    }
  }

  if (compact) {
    // Compact header layout
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-cv-dark-700 border border-cv-dark-600 rounded-md text-xs h-8">
        <div className={`w-2 h-2 rounded-full ${getStatusColor(agentStatus.status)} animate-pulse flex-shrink-0`}></div>
        <span className="text-xs">{getStatusIcon(agentStatus.status)}</span>
        <span className="font-medium text-white text-xs truncate">{agentStatus.agent}</span>
        <span className="text-cv-dark-300 text-xs truncate flex-1">{agentStatus.activity}</span>
        {agentStatus.progress && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-12 bg-cv-dark-600 rounded-full h-1">
              <div 
                className={`h-1 rounded-full transition-all duration-300 ${getStatusColor(agentStatus.status)}`}
                style={{ width: `${agentStatus.progress.percentage}%` }}
              ></div>
            </div>
            <span className="text-xs text-cv-dark-300">{agentStatus.progress.percentage}%</span>
          </div>
        )}
        <button 
          onClick={() => setIsVisible(false)}
          className="text-cv-dark-400 hover:text-cv-orange-400 text-xs flex-shrink-0"
          title="Hide status"
        >
          ✕
        </button>
      </div>
    )
  }

  // Full layout (original)
  return (
    <div className="bg-cv-dark-700 border border-cv-dark-600 rounded-lg shadow-lg p-2 mx-6 mt-2 cv-orange-glow text-xs">
      {/* Agent Header */}
      <div className="flex items-center gap-2 mb-2">
        <button 
          onClick={() => setIsVisible(false)}
          className="text-cv-dark-400 hover:text-cv-orange-400 text-xs ml-auto"
          title="Close debug panel"
        >
          ✕
        </button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor(agentStatus.status)} animate-pulse`}></div>
        <div className="flex-1">
          <h4 className="font-medium text-white flex items-center gap-1 text-xs">
            <span className="text-xs">{getStatusIcon(agentStatus.status)}</span>
            {agentStatus.agent}
          </h4>
          <p className="text-xs text-cv-dark-200">{agentStatus.activity}</p>
        </div>
      </div>

      {/* Progress Bar */}
      {agentStatus.progress && (
        <div className="mb-1">
          <div className="flex justify-between text-xs text-cv-dark-300 mb-1">
            <span>Progress</span>
            <span>{agentStatus.progress.current}/{agentStatus.progress.total} ({agentStatus.progress.percentage}%)</span>
          </div>
          <div className="w-full bg-cv-dark-600 rounded-full h-1">
            <div 
              className={`h-1 rounded-full transition-all duration-300 ${getStatusColor(agentStatus.status)}`}
              style={{ width: `${agentStatus.progress.percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Tool Details */}
      {agentStatus.details && agentStatus.details.length > 0 && (
        <div className="space-y-1">
          <h5 className="font-medium text-cv-dark-100 text-xs">Tools:</h5>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {agentStatus.details.map((detail, index) => (
              <div key={index} className="flex items-center gap-1 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  detail.status === 'completed' ? 'bg-cv-matrix-green' :
                  detail.status === 'failed' ? 'bg-red-400' : 'bg-cv-orange-400'
                }`}></div>
                <span className="font-mono text-xs text-cv-dark-200 truncate">{detail.tool}</span>
                <span className="text-xs text-cv-dark-300 flex-1 truncate">
                  {detail.result || detail.status}
                </span>
                {detail.execution_time && (
                  <span className="text-xs text-cv-dark-400">{detail.execution_time}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="text-xs text-cv-dark-400 mt-1 text-right">
        {new Date(agentStatus.timestamp).toLocaleTimeString()}
      </div>
    </div>
  )
}

export default AgentStatusBar