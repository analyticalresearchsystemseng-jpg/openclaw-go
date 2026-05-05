import { useState } from 'react'
import { Settings, Shield, Eye, EyeOff, HelpCircle } from 'lucide-react'

function SettingRow({ label, value, help, children }: { label: string; value?: string; help?: string; children?: React.ReactNode }) {
  const [showHelp, setShowHelp] = useState(false)
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">{label}</div>
        {help && (
          <button onClick={() => setShowHelp(!showHelp)} className="text-claw-muted">
            <HelpCircle size={16} />
          </button>
        )}
      </div>
      {showHelp && help && (
        <div className="text-xs text-claw-muted mb-2 bg-claw-dark rounded-lg p-2">
          {help}
        </div>
      )}
      {value && <div className="text-sm text-claw-muted font-mono">{value}</div>}
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [advanced, setAdvanced] = useState(false)
  const [gatewayUrl, setGatewayUrl] = useState(localStorage.getItem('gatewayUrl') || 'ws://127.0.0.1:18789')
  const [token, setToken] = useState(localStorage.getItem('gatewayToken') || '')
  const [showToken, setShowToken] = useState(false)

  const save = () => {
    localStorage.setItem('gatewayUrl', gatewayUrl)
    localStorage.setItem('gatewayToken', token)
    alert('Settings saved')
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Settings</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-claw-muted">Basic</span>
          <button
            onClick={() => setAdvanced(!advanced)}
            className={`w-12 h-6 rounded-full transition-colors ${advanced ? 'bg-claw-highlight' : 'bg-claw-accent'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${advanced ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-xs text-claw-muted">Advanced</span>
        </div>
      </div>

      <SettingRow
        label="Gateway URL"
        help="The WebSocket URL of your OpenClaw gateway. Default is ws://127.0.0.1:18789. If using Tailscale, use your WSL tailnet IP."
      >
        <input
          type="text"
          value={gatewayUrl}
          onChange={(e) => setGatewayUrl(e.target.value)}
          className="input mt-2"
          placeholder="ws://127.0.0.1:18789"
        />
      </SettingRow>

      <SettingRow
        label="Auth Token"
        help="Your gateway authentication token. Found in ~/.openclaw/openclaw.json under gateway.auth.token. Keep this secret."
      >
        <div className="flex gap-2 mt-2">
          <input
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="input flex-1"
            placeholder="Enter token..."
          />
          <button onClick={() => setShowToken(!showToken)} className="btn-secondary">
            {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </SettingRow>

      {advanced && (
        <>
          <SettingRow
            label="CLI Proxy Mode"
            help="When enabled, the PWA uses a local CLI proxy server to handle protected config paths that can't be changed via the API."
          >
            <div className="mt-2 text-sm text-claw-muted">
              Required for: adding Telegram bots, changing bindings, modifying agents
            </div>
          </SettingRow>

          <SettingRow
            label="Cache Settings"
            help="Clear local cache if you're seeing stale data."
          >
            <button
              className="btn-secondary w-full mt-2"
              onClick={() => {
                localStorage.clear()
                alert('Cache cleared. Reload the app.')
              }}
            >
              Clear All Cache
            </button>
          </SettingRow>

          <SettingRow
            label="About"
            value="OpenClaw Mobile v0.1.0"
          />
        </>
      )}

      <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={save}>
        <Shield size={18} />
        Save Settings
      </button>
    </div>
  )
}
