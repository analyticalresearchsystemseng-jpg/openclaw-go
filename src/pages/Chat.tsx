import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, User, Bot, Wifi, WifiOff, Mic, MicOff, Volume2, VolumeX, Brain, Pause } from 'lucide-react'
import { useVoiceMode } from '../hooks/useVoiceMode'
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
  const [voiceMode, setVoiceMode] = useState(false)
  const [autoSend, setAutoSend] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { 
    listening, 
    speaking, 
    transcript, 
    error: voiceError,
    isSupported,
    startListening, 
    stopListening, 
    speak, 
    stopSpeaking 
  } = useVoiceMode({
    onTranscript: (text) => {
      setInput(text)
      if (autoSend) {
        handleSendMessage(text)
      }
    },
    onListeningChange: (isListening) => {
      if (!isListening && voiceMode && autoSend && transcript) {
        // Auto-send when user stops speaking
        handleSendMessage(transcript)
      }
    },
    continuous: false // We'll manage the loop manually
  })

  useEffect(() => {
    loadHistory()
    const unsubscribe = api.onChatMessage((msg: any) => {
      if (msg.content) {
        const assistantMsg = {
          id: msg.id || Date.now().toString(),
          role: 'assistant' as const,
          content: msg.content,
          timestamp: msg.timestamp || new Date().toISOString(),
          channel: msg.channel,
          sender: msg.sender
        }
        setMessages(prev => [...prev, assistantMsg])
        
        // In voice mode, speak the response
        if (voiceMode) {
          speak(msg.content)
        }
      }
    })
    return () => unsubscribe?.()
  }, [voiceMode, speak])

  useEffect(() => scrollToBottom(), [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadHistory() {
    try {
      const history = await api.chatList?.(50)
      if (history?.messages) setMessages(history.messages)
    } catch (e) {}
  }

  async function handleSendMessage(text?: string) {
    const messageText = text || input.trim()
    if (!messageText) return
    
    if (!text) setInput('')
    setLoading(true)

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    }])

    try {
      await api.chatSend?.(messageText)
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

  function toggleVoiceMode() {
    if (!isSupported) {
      alert('Voice mode not supported on this device. Use Safari on iOS.')
      return
    }
    
    if (voiceMode) {
      // Turn off
      stopListening()
      stopSpeaking()
      setVoiceMode(false)
      setAutoSend(false)
    } else {
      // Turn on
      setVoiceMode(true)
      setAutoSend(true)
      startListening()
    }
  }

  function toggleListening() {
    if (listening) {
      stopListening()
    } else {
      startListening()
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col bg-claw-dark">
      {/* Header with Voice Mode Toggle */}
      <div className="flex items-center justify-between p-3 border-b border-claw-accent/30">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-claw-primary" />
          <h2 className="font-semibold">{voiceMode ? '🎙️ Voice Mode' : 'Chat'}</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {voiceMode && (
            <>
              <button
                onClick={toggleListening}
                className={`p-2 rounded-full ${listening ? 'bg-red-500 animate-pulse' : 'bg-claw-accent'}`}
              >
                {listening ? <Mic size={18} className="text-white" /> : <MicOff size={18} />}
              </button>
              <button
                onClick={() => { stopSpeaking(); }}
                disabled={!speaking}
                className="p-2 rounded-full bg-claw-accent disabled:opacity-50"
              >
                {speaking ? <Volume2 size={18} className="text-green-400" /> : <VolumeX size={18} />}
              </button>
            </>
          )}
          <button
            onClick={toggleVoiceMode}
            className={`p-2 rounded-lg text-sm font-medium ${
              voiceMode 
                ? 'bg-claw-primary text-white' 
                : 'bg-claw-card text-claw-muted'
            }`}
          >
            {voiceMode ? 'Text' : '🎙️ Voice'}
          </button>
        </div>
      </div>

      {/* Voice Mode Status */}
      {voiceMode && (
        <div className="bg-claw-card/50 p-3 text-sm space-y-1">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-claw-primary" />
            <span>{listening ? 'Listening...' : speaking ? 'Speaking...' : 'Tap mic to talk'}</span>
          </div>
          {transcript && (
            <div className="text-claw-muted italic">"{transcript}"{listening && '...'}</div>
          )}
          {voiceError && (
            <div className="text-red-400 text-xs">{voiceError}</div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && !voiceMode && (
          <div className="text-center text-claw-muted py-8">
            <Bot size={48} className="mx-auto mb-3 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Tap 🎙️ Voice to chat hands-free</p>
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
            }`}
            >
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
            }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className="text-[10px] opacity-60 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
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

      {/* Text Input (hidden in voice mode) */}
      {!voiceMode && (
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
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || loading}
              className="p-3 bg-claw-primary text-white rounded-xl disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
