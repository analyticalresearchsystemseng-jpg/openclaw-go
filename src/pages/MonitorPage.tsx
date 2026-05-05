import { useChannels, useSessions, useLogs } from '../hooks/useApi'
import { Activity, Radio, FileText, RefreshCw, Wifi, WifiOff, CheckCircle, AlertCircle, Clock } from 'lucide-react'

export default function MonitorPage() {
  const channels = useChannels()
  const sessions = useSessions()
  const logs = useLogs()

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Monitor</h2>

      {/* Channels */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center gap-2"><Radio size={16} /> Channels</h3>
          <button onClick={channels.refresh} className="text-claw-highlight"><RefreshCw size={16} className={channels.loading ? 'animate-spin' : ''} /></button>
        </div>
        {channels.error && <div className="text-claw-highlight text-sm">{channels.error}</div>}
        {Object.entries(channels.data?.channels || {}).map(([name, ch]: [string, any]) => (
          <div key={name} className="flex items-center justify-between py-2 border-b border-claw-accent/20 last:border-0">
            <div className="flex items-center gap-2">
              {ch?.running ? <Wifi size={16} className="text-green-400" /> : <WifiOff size={16} className="text-red-400" />}
              <span className="capitalize">{name}</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${ch?.running ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {ch?.running ? 'Online' : 'Offline'}
            </span>
          </div>
        ))}
      </div>

      {/* Channel Accounts */}
      {channels.data?.channelAccounts && Object.entries(channels.data.channelAccounts).map(([chName, accounts]: [string, any]) => (
        <div key={chName} className="card">
          <div className="text-xs text-claw-muted uppercase tracking-wider mb-2">{chName} Accounts</div>
          {accounts.map((acc: any) => (
            <div key={acc.accountId} className="flex items-center justify-between py-2 border-b border-claw-accent/20 last:border-0">
              <div className="flex items-center gap-2">
                {acc.connected ? <CheckCircle size={14} className="text-green-400" /> : acc.running ? <AlertCircle size={14} className="text-yellow-400" /> : <WifiOff size={14} className="text-red-400" />}
                <span className="text-sm">{acc.accountId}</span>
              </div>
              <span className="text-xs text-claw-muted">{acc.connected ? 'Connected' : acc.running ? 'Polling' : 'Stopped'}</span>
            </div>
          ))}
        </div>
      ))}

      {/* Sessions */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center gap-2"><Activity size={16} /> Sessions</h3>
          <button onClick={sessions.refresh} className="text-claw-highlight"><RefreshCw size={16} className={sessions.loading ? 'animate-spin' : ''} /></button>
        </div>
        {sessions.error && <div className="text-claw-highlight text-sm">{sessions.error}</div>}
        {sessions.data.slice(0, 5).map((s: any) => (
          <div key={s.sessionId || s.key} className="flex items-center justify-between py-2 border-b border-claw-accent/20 last:border-0 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${s.percentUsed > 80 ? 'bg-red-400' : s.percentUsed > 50 ? 'bg-yellow-400' : 'bg-green-400'}`} />
              <span className="truncate max-w-[40%]">{s.agentId}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-claw-muted">
              <span>{s.model?.split('/').pop() || '?'}</span>
              <span>{s.percentUsed != null ? `${s.percentUsed}%` : '?'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Logs */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center gap-2"><FileText size={16} /> Logs</h3>
          <button onClick={logs.refresh} className="text-claw-highlight"><RefreshCw size={16} className={logs.loading ? 'animate-spin' : ''} /></button>
        </div>
        {logs.error && <div className="text-claw-highlight text-sm">{logs.error}</div>}
        <div className="space-y-2">
          {logs.data.slice(-10).map((entry: any, i: number) => (
            <div key={i} className="bg-claw-dark rounded-lg p-2">
              <div className="flex items-center gap-2 text-xs mb-1">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  entry.level === 'error' ? 'bg-red-500/20 text-red-400' :
                  entry.level === 'warn' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {entry.level || 'info'}
                </span>
                <span className="text-claw-muted">{entry.time?.split('T')[1]?.slice(0, 8) || '?'}</span>
              </div>
              <div className="text-xs text-claw-text/80 break-words">
                {typeof entry.message === 'string' ? entry.message.slice(0, 200) : JSON.stringify(entry.message)?.slice(0, 200)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
