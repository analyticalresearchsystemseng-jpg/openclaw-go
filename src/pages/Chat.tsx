import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, User, Bot, Wifi, WifiOff, MoreVertical } from 'lucide-react'
import { api } from '../api/gateway'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  channel?: string
  sender?: string
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(true)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load chat history
    loadHistory()
    
    // Set up WebSocket listener for incoming messages
    const unsubscribe = api.chatStream((msg: any) => {
      if (msg.content) {
        setMessages(prev => [...prev, {
          id: msg.id || Date.now().toString(),
          role: msg.role || 'assistant',
          content: msg.content,
          timestamp: msg.timestamp || new Date().toISOString(),
          channel: msg.channel,
          sender: msg.sender
        }])
      }
    })

    return () => {
      unsubscribe?.()
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadHistory() {
    try {
      const history = await api.chatList()
      if (history && history.messages) {
        setMessages(history.messages)
      }
    } catch (e) {
      console.log('Could not load chat history')
    }
  }

  async function sendMessage() {
    if (!input.trim()) return
    
    const userMsg = input.trim()
    setInput('')
    setLoading(true)

    // Add user message immediately
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: userMsg,
      timestamp: new Date().toISOString()
    }])

    try {
      await api.chatSend(userMsg)
    } catch (e: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: `Error: ${e.message}`,
        timestamp: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col bg-claw-dark">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-claw-accent/30">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-claw-primary" />
          <h2 className="font-semibold">Chat</h2>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <Wifi size={16} className="text-green-500" />
          ) : (
            <WifiOff size={16} className="text-red-500" />
          )}
          <button className="p-1 text-claw-muted">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-claw-muted py-8">
            <Bot size={48} className="mx-auto mb-3 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start chatting with your agents</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' 
                ? 'bg-claw-primary' 
                : msg.role === 'system'
                ? 'bg-yellow-500'
                : 'bg-claw-accent'
            }`}>
              {msg.role === 'user' ? (
                <User size={16} className="text-white" />
              ) : msg.role === 'system' ? (
                <WifiOff size={14} className="text-white" />
              ) : (
                <Bot size={16} className="text-white" />
              )}
            </div>
            
            <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
              msg.role === 'user'
                ? 'bg-claw-primary text-white'
                : msg.role === 'system'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-claw-card'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className="text-[10px] opacity-60 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
                {msg.channel && ` · ${msg.channel}`}
              </p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-claw-accent flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-claw-card rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-claw-muted rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-claw-muted rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="w-2 h-2 bg-claw-muted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-claw-accent/30">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-claw-card rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-claw-primary"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '100px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="p-3 bg-claw-primary text-white rounded-xl disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-claw-muted mt-1 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
