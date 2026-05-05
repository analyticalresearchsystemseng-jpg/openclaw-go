import { useState } from 'react'
import { Wifi, Lock, Eye, EyeOff, Save, CheckCircle } from 'lucide-react'
import { Preferences } from '@capacitor/preferences'

interface LoginProps {
  onLogin: (url: string, token: string) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [url, setUrl] = useState('ws://100.100.242.71:18789')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function testConnection() {
    setTesting(true)
    setError(null)
    
    try {
      // Convert ws:// to http:// for testing
      const testUrl = url.replace('ws://', 'http://').replace('wss://', 'https://')
      
      const response = await fetch(`${testUrl}/api/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: AbortSignal.timeout(5000)
      })
      
      if (response.ok) {
        setSaved(true)
        // Save credentials
        await Preferences.set({ key: 'gatewayUrl', value: url })
        await Preferences.set({ key: 'authToken', value: token })
        
        setTimeout(() => {
          onLogin(url, token)
        }, 500)
      } else {
        setError(`Server returned ${response.status}`)
      }
    } catch (e: any) {
      setError(e.message || 'Connection failed. Check URL and token.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-claw-dark to-claw-card">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-claw-primary rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-claw-primary/20">
            <Wifi size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">OpenClaw Go</h1>
          <p className="text-sm text-claw-muted">Your gateway, in your pocket</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-claw-muted">Gateway URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 bg-claw-dark border border-claw-accent/30 rounded-lg text-white placeholder-claw-muted focus:outline-none focus:border-claw-primary text-sm"
              placeholder="ws://your-gateway:18789"
            />
            <p className="text-xs text-claw-muted">Your Tailscale IP or local IP</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-claw-muted">Auth Token</label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-3 bg-claw-dark border border-claw-accent/30 rounded-lg text-white placeholder-claw-muted focus:outline-none focus:border-claw-primary text-sm pr-12"
                placeholder="Paste your auth token"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-claw-muted"
              >
                {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-claw-muted">Find in ~/.openclaw/openclaw.json</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={testConnection}
            disabled={testing || !url || !token}
            className="w-full py-4 bg-claw-primary text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {saved ? (
              <>
                <CheckCircle size={20} />
                Connected!
              </>
            ) : testing ? (
              <>
                <Wifi size={20} className="animate-pulse" />
                Connecting...
              </>
            ) : (
              <>
                <Lock size={20} />
                Connect to Gateway
              </>
            )}
          </button>
        </div>

        {/* Help */}
        <div className="text-center text-xs text-claw-muted space-y-2">
          <p>Don't have a token? Run this on your server:</p>
          <code className="block bg-claw-dark rounded p-2 text-[10px] font-mono text-claw-highlight">
            openclaw config get gateway.auth.token
          </code>
        </div>
      </div>
    </div>
  )
}
