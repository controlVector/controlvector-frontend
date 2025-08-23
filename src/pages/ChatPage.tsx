import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'

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
      content: 'Welcome to ControlVector! I\'m Watson, your AI infrastructure assistant. I can help you deploy applications, manage cloud resources, monitor systems, and much more. What would you like to do today?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState<TypingIndicator>({ is_typing: false })
  const [conversationId, setConversationId] = useState<string | null>(null)
  
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
        console.log('Connected to Watson service')
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
        console.log('Disconnected from Watson service - attempting to reconnect in 3 seconds...')
        
        // Auto-reconnect after 3 seconds
        setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            console.log('Attempting to reconnect to Watson service')
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
    
    // Send to Watson via WebSocket
    wsRef.current.send(JSON.stringify({
      type: 'user_message',
      content: inputMessage.trim(),
      conversation_id: conversationId,
      timestamp: new Date().toISOString()
    }))
    
    setInputMessage('')
    setIsTyping({ is_typing: true, agent: 'Watson' })
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
      deploy_application: 'bg-blue-100 text-blue-800',
      create_infrastructure: 'bg-green-100 text-green-800',
      scale_resources: 'bg-purple-100 text-purple-800',
      monitor_health: 'bg-yellow-100 text-yellow-800',
      manage_costs: 'bg-orange-100 text-orange-800',
      security_scan: 'bg-red-100 text-red-800',
      general_question: 'bg-gray-100 text-gray-800'
    }
    
    const color = intentColors[intent] || 'bg-gray-100 text-gray-800'
    
    return (
      <div className="flex items-center space-x-2 mt-2">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
          {intent.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
        {confidence && (
          <span className="text-xs text-gray-500">
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Watson AI Assistant</h1>
              <p className="text-sm text-gray-500">
                {isConnected ? (
                  <span className="flex items-center">
                    <span className="h-2 w-2 bg-green-400 rounded-full mr-2"></span>
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="h-2 w-2 bg-red-400 rounded-full mr-2"></span>
                    Connecting...
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Infrastructure Management Assistant
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl px-4 py-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-primary-600 text-white'
                    : message.type === 'system'
                    ? 'bg-blue-50 border border-blue-200 text-blue-900'
                    : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-70">
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
              <div className="bg-white border border-gray-200 text-gray-900 shadow-sm max-w-2xl px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {isTyping.agent || 'Watson'} is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-4">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Watson to deploy, scale, monitor, or manage your infrastructure..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={!isConnected}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || !isConnected}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
          
          {!isConnected && (
            <div className="mt-2 text-sm text-red-600">
              Connecting to Watson service... Please wait.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}