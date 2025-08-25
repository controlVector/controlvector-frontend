import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { CogIcon } from '@heroicons/react/24/outline'

interface Message {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: Date
  intent?: string
  confidence?: number
  agent?: string
}

interface TypingIndicator {
  is_typing: boolean
  agent?: string
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
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [currentThinkingMessage, setCurrentThinkingMessage] = useState(0)
  
  const thinkingMessages = [
    'Analyzing your infrastructure needs...',
    'Consulting with Atlas for deployment options...',
    'Optimizing cost and performance...',
    'Checking cloud provider availability...',
    'Reviewing security configurations...',
    'Calculating resource requirements...',
    'Coordinating with microservices...',
    'Planning deployment strategy...',
    'Accessing real-time infrastructure data...',
    'Running cost optimization algorithms...',
    'Synchronizing with Context Manager...',
    'Preparing deployment recommendations...'
  ]
  
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
      // First, create a new conversation
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
        throw new Error('Failed to create conversation')
      }

      const conversation = await response.json()
      setConversationId(conversation.data.id)

      // Connect to WebSocket
      const ws = new WebSocket(`ws://localhost:3004/ws?token=${token}&conversation_id=${conversation.data.id}`)
      
      ws.onopen = () => {
        setIsConnected(true)
        console.log('Connected to Victor AI service')
      }
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'ai_response':
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
            break
            
          case 'typing_indicator':
            setIsTyping({
              is_typing: data.is_typing,
              agent: data.agent
            })
            break
            
          case 'error':
            toast.error(data.message || 'An error occurred')
            setIsTyping({ is_typing: false })
            break
            
          default:
            console.log('Unknown message type:', data.type)
        }
      }
      
      ws.onclose = () => {
        setIsConnected(false)
        console.log('Disconnected from Victor AI service - attempting to reconnect in 3 seconds...')
        
        // Auto-reconnect after 3 seconds
        setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            console.log('Attempting to reconnect to Victor AI service')
            initializeWebSocket()
          }
        }, 3000)
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        toast.error('Connection error occurred')
        setIsConnected(false)
      }
      
      wsRef.current = ws
      
    } catch (error) {
      console.error('Failed to initialize chat:', error)
      toast.error('Failed to connect to AI assistant')
    }
  }

  const sendMessage = () => {
    if (!inputMessage.trim() || !wsRef.current || !isConnected || !conversationId) {
      return
    }

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
    setIsTyping({ is_typing: true, agent: 'Victor' })
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
                    ? 'bg-cv-dark-700 border border-cv-orange-500/30 text-cv-matrix-green'
                    : 'bg-cv-dark-800 border border-cv-dark-600 text-cv-dark-100 shadow-lg'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
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