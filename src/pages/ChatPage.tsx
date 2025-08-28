import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { CogIcon } from '@heroicons/react/24/outline'
import AgentStatusBar from '../components/AgentStatusBar'
import StepExecutionPanel from '../components/StepExecutionPanel'

interface Message {
  id: string
  type: 'user' | 'ai' | 'system' | 'execution_plan'
  content: string
  timestamp: Date
  intent?: string
  confidence?: number
  agent?: string
  executionPlan?: ExecutionPlan
}

interface ExecutionPlan {
  id: string
  objective: string
  steps: ExecutionStep[]
  status: 'awaiting_approval' | 'approved' | 'executing' | 'completed' | 'cancelled'
  totalEstimatedTime?: string
}

interface ExecutionStep {
  id: string
  service: string
  action: string
  description: string
  parameters: any
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'skipped'
  estimatedTime?: string
}

interface TypingIndicator {
  is_typing: boolean
  agent?: string
  operation?: string
}

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Welcome to ControlVector! I\'m Victor, your AI infrastructure assistant. I can help you deploy applications, manage cloud resources, monitor systems, and much more. What would you like to do today?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState<TypingIndicator>({ is_typing: false })
  const [conversationId, setConversationId] = useState<string | null>(() => {
    // Persist conversation ID in sessionStorage to prevent recreation
    // But clear it if we don't have a valid token
    const token = localStorage.getItem('access_token')
    if (!token) {
      sessionStorage.removeItem('current_conversation_id')
      return null
    }
    return sessionStorage.getItem('current_conversation_id')
  })
  const [currentThinkingMessage, setCurrentThinkingMessage] = useState(0)
  const [currentIntent, setCurrentIntent] = useState<string | undefined>()
  const [thinkingMessages, setThinkingMessages] = useState<string[]>(['Processing your request...'])
  
  const getContextAwareThinkingMessages = (intent?: string, agent?: string): string[] => {
    const baseMessages = [
      'Processing your request...',
      'Analyzing your requirements...',
      'Coordinating with microservices...'
    ]

    // Intent-specific thinking messages
    const intentMessages: Record<string, string[]> = {
      deploy_application: [
        'Analyzing your application requirements...',
        'Consulting with Atlas for optimal server specs...',
        'Reviewing deployment patterns...',
        'Calculating infrastructure costs...',
        'Preparing deployment strategy...',
        'Configuring SSH keys for secure access...',
        'Setting up automated deployment pipeline...',
        'Optimizing for performance and cost...'
      ],
      create_infrastructure: [
        'Evaluating cloud provider options...',
        'Calculating resource requirements...',
        'Comparing regional pricing...',
        'Consulting Atlas for infrastructure planning...',
        'Reviewing security configurations...',
        'Preparing infrastructure blueprint...',
        'Estimating monthly costs...',
        'Validating network configurations...'
      ],
      estimate_costs: [
        'Accessing real-time pricing data...',
        'Analyzing current infrastructure spend...',
        'Calculating projected monthly costs...',
        'Comparing provider pricing...',
        'Running cost optimization algorithms...',
        'Identifying potential savings...',
        'Preparing detailed cost breakdown...'
      ],
      check_status: [
        'Querying infrastructure health status...',
        'Checking service uptime metrics...',
        'Analyzing performance data...',
        'Reviewing recent deployments...',
        'Gathering system diagnostics...',
        'Compiling status report...'
      ],
      scale_infrastructure: [
        'Analyzing current resource utilization...',
        'Calculating scaling requirements...',
        'Evaluating auto-scaling policies...',
        'Consulting Atlas for scaling strategy...',
        'Estimating scaling costs...',
        'Preparing resource adjustment plan...'
      ],
      manage_costs: [
        'Analyzing current spending patterns...',
        'Identifying cost optimization opportunities...',
        'Reviewing resource utilization...',
        'Calculating potential savings...',
        'Preparing cost reduction recommendations...',
        'Evaluating right-sizing options...'
      ],
      security_review: [
        'Scanning infrastructure security posture...',
        'Reviewing access controls...',
        'Checking compliance requirements...',
        'Analyzing vulnerability reports...',
        'Consulting Sherlock for security insights...',
        'Preparing security recommendations...'
      ],
      general_question: [
        'Processing your question...',
        'Accessing knowledge base...',
        'Consulting relevant documentation...',
        'Preparing comprehensive response...'
      ]
    }

    // Operation-specific thinking messages (highest priority)
    const operationMessages: Record<string, string[]> = {
      'analyzing_infrastructure': [
        'Scanning your current infrastructure...',
        'Analyzing resource utilization patterns...',
        'Reviewing cost optimization opportunities...',
        'Checking system health metrics...'
      ],
      'consulting_atlas': [
        'Consulting with Atlas infrastructure service...',
        'Calculating optimal resource configurations...',
        'Comparing cloud provider options...',
        'Preparing infrastructure recommendations...'
      ],
      'retrieving_credentials': [
        'Securely retrieving API credentials...',
        'Accessing encrypted credential store...',
        'Validating authentication tokens...',
        'Establishing secure connections...'
      ],
      'calling_digitalocean_api': [
        'Connecting to DigitalOcean API...',
        'Fetching real-time infrastructure data...',
        'Retrieving droplet configurations...',
        'Calculating actual monthly costs...'
      ],
      'generating_ssh_keys': [
        'Generating secure SSH key pairs...',
        'Configuring deployment access...',
        'Setting up automated authentication...',
        'Preparing secure server connections...'
      ],
      'executing_plan': [
        'Executing approved infrastructure plan...',
        'Coordinating multi-step deployment...',
        'Monitoring execution progress...',
        'Ensuring deployment success...'
      ]
    }

    // Agent-specific thinking messages
    const agentMessages: Record<string, string[]> = {
      Atlas: [
        'Atlas is provisioning cloud resources...',
        'Consulting with DigitalOcean API...',
        'Calculating infrastructure costs...',
        'Configuring network topology...',
        'Setting up load balancers...',
        'Initializing database clusters...'
      ],
      Phoenix: [
        'Phoenix is analyzing deployment pipeline...',
        'Configuring CI/CD workflows...',
        'Setting up monitoring dashboards...',
        'Preparing rollback strategies...',
        'Optimizing deployment performance...'
      ],
      Sherlock: [
        'Sherlock is scanning security configurations...',
        'Analyzing access patterns...',
        'Checking compliance requirements...',
        'Reviewing audit logs...',
        'Identifying security vulnerabilities...'
      ],
      Victor: [
        'Victor is orchestrating the request...',
        'Coordinating between specialized agents...',
        'Analyzing intent and requirements...',
        'Preparing execution plan...',
        'Synchronizing with Context Manager...'
      ]
    }

    // Combine messages based on context (prioritizing operation-specific)
    let contextMessages = baseMessages

    // Check for specific operation first (highest priority)
    if (intent && operationMessages[intent]) {
      contextMessages = [...contextMessages, ...operationMessages[intent]]
    } else if (intent && intentMessages[intent]) {
      // Fall back to intent-specific messages
      contextMessages = [...contextMessages, ...intentMessages[intent]]
    }

    if (agent && agentMessages[agent]) {
      contextMessages = [...contextMessages, ...agentMessages[agent]]
    }

    // Add some general infrastructure messages if context is limited
    if (contextMessages.length <= 3) {
      contextMessages = [...contextMessages, 
        'Accessing real-time infrastructure data...',
        'Synchronizing with cloud providers...',
        'Optimizing resource allocation...',
        'Preparing detailed analysis...'
      ]
    }

    return contextMessages
  }
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    initializeWebSocket()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // Cycle through thinking messages when typing
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTyping.is_typing) {
      interval = setInterval(() => {
        setCurrentThinkingMessage(prev => (prev + 1) % thinkingMessages.length)
      }, 2000) // Change message every 2 seconds
    }
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isTyping.is_typing, thinkingMessages.length])

  const initializeWebSocket = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast.error('Please log in to start chatting')
        return
      }

      // Decode JWT to get user and workspace info
      const tokenPayload = JSON.parse(atob(token.split('.')[1]))
      const { user_id, workspace_id } = tokenPayload

      if (!user_id || !workspace_id) {
        toast.error('Invalid authentication. Please log in again.')
        return
      }

      let convId = conversationId

      // Only create a new conversation if we don't have one
      if (!convId) {
        console.log('Creating new conversation...')
        const response = await fetch('http://localhost:3004/api/conversations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user_id,
            workspace_id: workspace_id
          }),
        })

        if (!response.ok) {
          // If authentication fails, clear stored tokens and conversation
          if (response.status === 401) {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            sessionStorage.removeItem('current_conversation_id')
            toast.error('Authentication expired. Please log in again.')
            window.location.href = '/auth/login'
            return
          }
          throw new Error('Failed to create conversation')
        }

        const conversation = await response.json()
        convId = conversation.data.id
        setConversationId(convId)
        // Store in sessionStorage to persist across component remounts
        sessionStorage.setItem('current_conversation_id', convId)
      } else {
        console.log('Using existing conversation:', convId)
      }

      // Connect to WebSocket with the conversation ID
      const ws = new WebSocket(`ws://localhost:3004/ws?token=${token}&conversation_id=${convId}`)
      
      ws.onopen = () => {
        setIsConnected(true)
        console.log('Connected to Victor AI service')
        
        // Subscribe to agent status events for this conversation
        ws.send(JSON.stringify({
          type: 'subscribe',
          conversation_id: convId
        }))
        
        // Setup heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, 30000) // Ping every 30 seconds
        
        ws.heartbeatInterval = heartbeat
      }
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'ai_response':
            // Check if this is a step execution response
            const isStepResult = data.content.includes('✅ Step completed:') || 
                               data.content.includes('❌ Step failed:') ||
                               data.content.includes('Execute step:')
            
            if (isStepResult) {
              // Update step status based on response
              setMessages(prev => prev.map(message => {
                if (message.type === 'execution_plan' && message.executionPlan) {
                  const updatedSteps = message.executionPlan.steps.map(step => {
                    // If step was executing, mark it as completed or failed
                    if (step.status === 'executing') {
                      return {
                        ...step,
                        status: data.content.includes('❌') || data.content.includes('failed') 
                          ? 'failed' as const
                          : 'completed' as const
                      }
                    }
                    return step
                  })
                  
                  return {
                    ...message,
                    executionPlan: {
                      ...message.executionPlan,
                      steps: updatedSteps
                    }
                  }
                }
                return message
              }))
              
              // Add the AI response message
              setMessages(prev => [...prev, {
                id: data.timestamp || Date.now().toString(),
                type: 'ai',
                content: data.content,
                timestamp: new Date(data.timestamp),
                intent: data.intent,
                confidence: data.confidence,
                agent: data.agent
              }])
              
              setIsTyping({ is_typing: false })
              setCurrentIntent(undefined)
              break
            }
            
            // Check if this is an execution plan response
            const isExecutionPlan = data.content.includes('📋 Execution Plan:') || 
                                   data.content.includes('🤖 **Deployment Request Analyzed**') ||
                                   data.content.includes('deploy') || data.content.includes('Deployment')
            
            // Check if an execution plan already exists
            const existingExecutionPlan = messages.find(msg => msg.type === 'execution_plan')
            
            // Only create new execution plan if none exists
            let shouldCreateExecutionPlan = isExecutionPlan && !existingExecutionPlan
            
            // Create deployment steps based on the request (only if we're creating a new plan)
            const deploymentSteps: ExecutionStep[] = shouldCreateExecutionPlan ? [
              {
                id: 'step-1',
                service: 'mercury',
                action: 'analyze_repository',
                description: 'Analyze repository structure and requirements',
                parameters: {},
                status: 'pending',
                estimatedTime: '30s'
              },
              {
                id: 'step-2', 
                service: 'atlas',
                action: 'provision_infrastructure',
                description: 'Provision cloud infrastructure',
                parameters: {},
                status: 'pending',
                estimatedTime: '2-3m'
              },
              {
                id: 'step-3',
                service: 'neptune',
                action: 'create_dns_record',
                description: 'Configure DNS records',
                parameters: {},
                status: 'pending',
                estimatedTime: '1m'
              },
              {
                id: 'step-4',
                service: 'hermes',
                action: 'generate_ssh_key',
                description: 'Generate SSH keys for deployment',
                parameters: {},
                status: 'pending',
                estimatedTime: '30s'
              },
              {
                id: 'step-5',
                service: 'phoenix',
                action: 'deploy_application',
                description: 'Deploy application to infrastructure',
                parameters: {},
                status: 'pending',
                estimatedTime: '3-5m'
              }
            ] : []
            
            setMessages(prev => [...prev, {
              id: data.timestamp || Date.now().toString(),
              type: shouldCreateExecutionPlan ? 'execution_plan' : 'ai',
              content: data.content,
              timestamp: new Date(data.timestamp),
              intent: data.intent,
              confidence: data.confidence,
              agent: data.agent,
              executionPlan: shouldCreateExecutionPlan ? { 
                id: 'deployment-plan-' + Date.now(),
                objective: 'Deploy application with full infrastructure setup',
                steps: deploymentSteps,
                status: 'awaiting_approval',
                totalEstimatedTime: '7-10 minutes'
              } : undefined
            }])
            setIsTyping({ is_typing: false })
            // Clear current intent when response is received
            setCurrentIntent(undefined)
            break
            
          case 'typing_indicator':
            const newTypingState = {
              is_typing: data.is_typing,
              agent: data.agent,
              operation: data.operation
            }
            setIsTyping(newTypingState)
            
            // Update thinking messages when typing starts
            if (data.is_typing) {
              const contextMessages = getContextAwareThinkingMessages(
                data.operation || currentIntent || data.intent, 
                data.agent
              )
              setThinkingMessages(contextMessages)
              setCurrentThinkingMessage(0) // Reset to first message
            }
            break
            
          case 'step_completed':
            console.log('[WebSocket] Step completed:', data)
            // Update step status to completed
            setMessages(prev => prev.map(message => {
              if (message.type === 'execution_plan' && message.executionPlan) {
                return {
                  ...message,
                  executionPlan: {
                    ...message.executionPlan,
                    steps: message.executionPlan.steps.map(step => 
                      step.id === data.step_id 
                        ? { ...step, status: 'completed' as const }
                        : step
                    )
                  }
                }
              }
              return message
            }))
            break

          case 'step_failed':
            console.log('[WebSocket] Step failed:', data)
            // Update step status to failed
            setMessages(prev => prev.map(message => {
              if (message.type === 'execution_plan' && message.executionPlan) {
                return {
                  ...message,
                  executionPlan: {
                    ...message.executionPlan,
                    steps: message.executionPlan.steps.map(step => 
                      step.id === data.step_id 
                        ? { ...step, status: 'failed' as const }
                        : step
                    )
                  }
                }
              }
              return message
            }))
            toast.error(`Step failed: ${data.step_name}`)
            break

          case 'error':
            toast.error(data.message || 'An error occurred')
            setIsTyping({ is_typing: false })
            break

          // Error Recovery Events
          case 'recovery_started':
            console.log('[WebSocket] Recovery started:', data)
            setMessages(prev => [...prev, {
              id: data.timestamp || Date.now().toString(),
              type: 'system',
              content: data.message || `🔧 Starting intelligent error recovery for ${data.provider} ${data.operation}...`,
              timestamp: new Date(data.timestamp),
              recoveryId: data.recovery_id,
              recoveryStatus: 'started'
            }])
            break

          case 'recovery_progress':
            console.log('[WebSocket] Recovery progress:', data)
            setMessages(prev => [...prev, {
              id: data.timestamp || Date.now().toString(),
              type: 'system',
              content: data.message,
              timestamp: new Date(data.timestamp),
              recoveryId: data.recovery_id,
              recoveryStatus: 'progress',
              recoveryStep: data.step,
              recoveryTotalSteps: data.total_steps,
              recoveryAttempt: data.attempt
            }])
            break

          case 'recovery_success':
            console.log('[WebSocket] Recovery success:', data)
            setMessages(prev => [...prev, {
              id: data.timestamp || Date.now().toString(),
              type: 'system',
              content: data.message,
              timestamp: new Date(data.timestamp),
              recoveryId: data.recovery_id,
              recoveryStatus: 'success',
              recoveryAttempts: data.attempts
            }])
            break

          case 'recovery_escalated':
            console.log('[WebSocket] Recovery escalated:', data)
            setMessages(prev => [...prev, {
              id: data.timestamp || Date.now().toString(),
              type: 'system',
              content: data.message,
              timestamp: new Date(data.timestamp),
              recoveryId: data.recovery_id,
              recoveryStatus: 'escalated',
              recoveryAttempts: data.attempts,
              recoverySuggestions: data.suggestions
            }])
            break
            
          case 'conversation_created':
            console.log('New conversation created:', data.conversation_id)
            // Update the conversation ID in session storage
            sessionStorage.setItem('current_conversation_id', data.conversation_id)
            setConversationId(data.conversation_id)
            toast.success('New conversation started')
            break
            
          case 'pong':
            console.log('Received pong response - connection alive')
            break
            
          default:
            console.log('Unknown message type:', data.type)
        }
      }
      
      ws.onclose = (event) => {
        setIsConnected(false)
        console.log('WebSocket closed. Code:', event.code, 'Reason:', event.reason)
        console.log('Was clean?', event.wasClean)
        
        // Clear heartbeat interval
        if (ws.heartbeatInterval) {
          clearInterval(ws.heartbeatInterval)
        }
        
        // Only auto-reconnect if it wasn't a clean close or authentication issue
        if (event.code !== 1000 && event.code !== 1008) {
          console.log('Disconnected from Victor AI service - attempting to reconnect in 3 seconds...')
          
          setTimeout(() => {
            if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
              console.log('Attempting to reconnect to Victor AI service')
              initializeWebSocket()
            }
          }, 3000)
        } else {
          console.log('WebSocket closed normally, not reconnecting')
        }
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error details:', error)
        console.error('WebSocket readyState:', ws.readyState)
        console.error('WebSocket URL:', ws.url)
        // Don't show toast error immediately - let's debug first
        setIsConnected(false)
      }
      
      wsRef.current = ws
      
    } catch (error) {
      console.error('Failed to initialize chat:', error)
      toast.error('Failed to connect to AI assistant')
    }
  }

  // Simple intent prediction based on keywords
  const predictIntent = (message: string): string | undefined => {
    const text = message.toLowerCase()
    
    if (text.includes('deploy') || text.includes('deployment')) {
      return 'deploy_application'
    }
    if (text.includes('create') || text.includes('provision') || text.includes('setup') || text.includes('new')) {
      return 'create_infrastructure'
    }
    if (text.includes('cost') || text.includes('price') || text.includes('estimate') || text.includes('budget')) {
      return 'estimate_costs'
    }
    if (text.includes('status') || text.includes('health') || text.includes('running') || text.includes('check')) {
      return 'check_status'
    }
    if (text.includes('scale') || text.includes('resize') || text.includes('expand')) {
      return 'scale_infrastructure'
    }
    if (text.includes('optimize') || text.includes('reduce') || text.includes('save')) {
      return 'manage_costs'
    }
    if (text.includes('security') || text.includes('secure') || text.includes('vulnerability')) {
      return 'security_review'
    }
    
    return 'general_question'
  }

  const sendMessage = () => {
    if (!inputMessage.trim() || !wsRef.current || !isConnected || !conversationId) {
      return
    }

    // Predict intent from user message
    const predictedIntent = predictIntent(inputMessage.trim())
    setCurrentIntent(predictedIntent)

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    
    // Send to Victor via WebSocket
    wsRef.current.send(JSON.stringify({
      type: 'user_message',
      content: inputMessage.trim(),
      conversation_id: conversationId,
      timestamp: new Date().toISOString()
    }))
    
    setInputMessage('')
    
    // Start with context-aware thinking messages
    const contextMessages = getContextAwareThinkingMessages(predictedIntent, 'Victor')
    setThinkingMessages(contextMessages)
    setCurrentThinkingMessage(0)
    setIsTyping({ is_typing: true, agent: 'Victor' })
  }

  const sendExecutionResponse = (response: 'approve' | 'reject' | 'modify') => {
    if (!wsRef.current || !isConnected || !conversationId) {
      return
    }

    const responseText = response === 'approve' ? 'yes' : 
                        response === 'reject' ? 'no' : 
                        'modify'

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: responseText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    
    // Send to Victor via WebSocket
    wsRef.current.send(JSON.stringify({
      type: 'user_message',
      content: responseText,
      conversation_id: conversationId,
      timestamp: new Date().toISOString()
    }))
    
    setIsTyping({ is_typing: true, agent: 'Victor' })
  }

  const executeStep = (stepId: string, stepName: string) => {
    if (!wsRef.current || !isConnected || !conversationId) {
      return
    }

    // Update the step status to executing in the UI
    setMessages(prev => prev.map(message => {
      if (message.type === 'execution_plan' && message.executionPlan) {
        return {
          ...message,
          executionPlan: {
            ...message.executionPlan,
            steps: message.executionPlan.steps.map(step => 
              step.id === stepId 
                ? { ...step, status: 'executing' as const }
                : step
            )
          }
        }
      }
      return message
    }))

    // Send step execution request to Watson
    const stepMessage = `Execute step: ${stepName}`
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: stepMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    
    // Send to Victor via WebSocket with step context
    wsRef.current.send(JSON.stringify({
      type: 'user_message',
      content: stepMessage,
      conversation_id: conversationId,
      timestamp: new Date().toISOString(),
      step_execution: {
        step_id: stepId,
        step_name: stepName
      }
    }))
    
    // Simulate step completion for now (remove this once Watson properly sends step_completed events)
    setTimeout(() => {
      console.log(`[Frontend] Simulating completion for step: ${stepId}`)
      // Update step status to completed
      setMessages(prev => prev.map(message => {
        if (message.type === 'execution_plan' && message.executionPlan) {
          return {
            ...message,
            executionPlan: {
              ...message.executionPlan,
              steps: message.executionPlan.steps.map(step => 
                step.id === stepId 
                  ? { ...step, status: 'completed' as const }
                  : step
              )
            }
          }
        }
        return message
      }))
    }, 3000) // Complete after 3 seconds
    
    setIsTyping({ is_typing: true, agent: 'Victor', operation: `Executing ${stepName}...` })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getIntentBadge = (intent?: string, confidence?: number) => {
    if (!intent) return null
    
    const intentColors: Record<string, string> = {
      deploy_application: 'bg-cv-dark-600 text-cv-matrix-green border border-cv-matrix-green/30',
      create_infrastructure: 'bg-cv-dark-600 text-cv-orange-400 border border-cv-orange-400/30',
      scale_resources: 'bg-cv-dark-600 text-purple-400 border border-purple-400/30',
      monitor_health: 'bg-cv-dark-600 text-yellow-400 border border-yellow-400/30',
      manage_costs: 'bg-cv-dark-600 text-cv-orange-300 border border-cv-orange-300/30',
      security_scan: 'bg-cv-dark-600 text-red-400 border border-red-400/30',
      general_question: 'bg-cv-dark-600 text-cv-dark-200 border border-cv-dark-400/30'
    }
    
    const color = intentColors[intent] || 'bg-gray-100 text-gray-800'
    
    return (
      <div className="flex items-center space-x-2 mt-2">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
          {intent.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
        {confidence && (
          <span className="text-xs text-cv-dark-300">
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-cv-dark-900">
      {/* Header */}
      <header className="bg-cv-dark-800 shadow-sm border-b border-cv-dark-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gradient-to-r from-cv-orange-600 to-cv-orange-500 rounded-lg flex items-center justify-center cv-orange-glow">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Victor AI Assistant</h1>
              <p className="text-sm text-gray-500">
                {isConnected ? (
                  <span className="flex items-center">
                    <span className="h-2 w-2 bg-cv-matrix-green rounded-full mr-2 animate-pulse"></span>
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="h-2 w-2 bg-cv-orange-500 rounded-full mr-2 animate-pulse"></span>
                    Connecting...
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Agent Status Bar in Header */}
            <div className="flex-1 max-w-md">
              <AgentStatusBar 
                websocket={wsRef.current}
                conversationId={conversationId || ''}
                compact={true}
              />
            </div>
            
            <div className="text-sm text-cv-dark-300">
              Infrastructure Management Assistant
            </div>
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 px-3 py-2 text-sm text-cv-dark-200 hover:text-cv-orange-400 hover:bg-cv-dark-700 rounded-lg transition-colors duration-200"
              title="Go to Settings"
            >
              <CogIcon className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-cv-dark-900">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl px-4 py-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-cv-orange-600 text-white border border-cv-orange-400'
                    : message.type === 'system'
                    ? 'bg-cv-dark-700 border border-cv-orange-500/30 text-cv-orange-400'
                    : message.type === 'execution_plan'
                    ? 'bg-cv-dark-800 border-2 border-cv-orange-500 text-cv-dark-100 shadow-lg cv-orange-glow'
                    : 'bg-cv-dark-800 border border-cv-dark-600 text-cv-dark-100 shadow-lg'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Step-by-Step Execution Panel */}
                {message.type === 'execution_plan' && message.executionPlan && (
                  <StepExecutionPanel
                    steps={message.executionPlan.steps}
                    onStepExecute={executeStep}
                  />
                )}
                
                {/* Legacy Execution Plan Confirmation Buttons - Only for non-deployment plans */}
                {message.type === 'execution_plan' && 
                 message.executionPlan?.status === 'awaiting_approval' && 
                 !message.content.toLowerCase().includes('deploy') && (
                  <div className="mt-4 pt-4 border-t border-cv-dark-600">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => sendExecutionResponse('approve')}
                        className="flex-1 px-4 py-2 bg-cv-matrix-green text-cv-dark-900 rounded-lg font-medium hover:bg-green-400 transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <span className="text-lg">✅</span>
                        Execute Plan
                      </button>
                      <button
                        onClick={() => sendExecutionResponse('reject')}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <span className="text-lg">❌</span>
                        Cancel
                      </button>
                      <button
                        onClick={() => sendExecutionResponse('modify')}
                        className="flex-1 px-4 py-2 bg-cv-orange-600 text-white rounded-lg font-medium hover:bg-cv-orange-700 transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <span className="text-lg">🔧</span>
                        Modify
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-cv-dark-400 text-center">
                      ⚠️ This plan will make real changes to your infrastructure
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${
                    message.type === 'user' 
                      ? 'text-white opacity-90' 
                      : 'text-cv-dark-400 opacity-90'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                    {message.agent && ` • ${message.agent}`}
                  </span>
                </div>
                {getIntentBadge(message.intent, message.confidence)}
              </div>
            </div>
          ))}
          
          {isTyping.is_typing && (
            <div className="flex justify-start">
              <div className="bg-cv-dark-800 border border-cv-dark-600 text-cv-dark-100 shadow-lg max-w-2xl px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-cv-orange-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-cv-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-cv-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-cv-dark-300">
                    Victor: {thinkingMessages[currentThinkingMessage]}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-cv-dark-800 border-t border-cv-dark-600 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-4">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Victor to deploy, scale, monitor, or manage your infrastructure..."
              className="flex-1 px-4 py-3 bg-cv-dark-700 text-white border border-cv-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cv-orange-500 focus:border-cv-orange-500 placeholder-cv-dark-300"
              disabled={!isConnected}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || !isConnected}
              className="px-6 py-3 bg-cv-orange-600 text-white rounded-lg hover:bg-cv-orange-700 focus:outline-none focus:ring-2 focus:ring-cv-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cv-button"
            >
              Send
            </button>
          </div>
          
          {!isConnected && (
            <div className="mt-2 text-sm text-cv-orange-400">
              Connecting to Victor AI service... Please wait.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}