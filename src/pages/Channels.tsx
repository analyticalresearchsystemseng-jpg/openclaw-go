import { useState } from 'react'
import { useChannels } from '../hooks/useApi'
import { Radio, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react'
import TelegramWizard from './TelegramWizard'

export default function Channels() {
  const { data, loading, error, refresh } = useChannels()
  const [wizardOpen, setWizardOpen] = useState(false)

  if (wizardOpen) {
    return <TelegramWizard onClose={() => setWizardOpen(false)} onDone={() => { setWizardOpen(false); refresh() }} />
  }

  if (loading) return <div className="p-4 text-claw-muted">Loading channels...</div>
  if (error) return (
    <div className="p-4">
      <div className="card mb-4 text-claw-highlight">Error: {error}</div>
      <button className="btn-primary w-full" onClick={refresh}>Retry</button>
    </div>
  )

  const channels = data?.channels || {}
  const channelAccounts = data?.channelAccounts || {}

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Channels</h2>
        <span className="text-xs text-claw-muted">{Object.keys(channels).length} configured</span>
      </div>

      {Object.entries(channels).map(([name, ch]: [string, any]) => {
        const accounts = channelAccounts[name] || []
        const isRunning = ch?.running
        return (
          <div key={name} className="card">
            <div className="flex items-center gap-3 mb-3">
              {isRunning ? <CheckCircle size={20} className="text-green-400" /> : <XCircle size={20} className="text-red-400" />}
              <div className="flex-1">
                <div className="font-bold capitalize">{name}</div>
                <div className="text-xs text-claw-muted">{ch?.statusState || ch?.mode || (ch?.connected ? 'connected' : 'disconnected')}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${isRunning ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {isRunning ? 'Online' : 'Offline'}
              </span>
            </div>

            {accounts.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-claw-muted uppercase tracking-wider">Accounts</div>
                {accounts.map((acc: any) => (
                  <div key={acc.accountId} className="flex items-center justify-between bg-claw-dark rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      {acc.connected ? <CheckCircle size={14} className="text-green-400" /> : <AlertCircle size={14} className="text-yellow-400" />}
                      <span className="text-sm">{acc.accountId}</span>
                    </div>
                    <span className="text-xs text-claw-muted">{acc.connected ? 'Connected' : acc.running ? 'Polling' : 'Stopped'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={() => setWizardOpen(true)}>
        <Plus size={18} /> Add Telegram Bot
      </button>
    </div>
  )
}
