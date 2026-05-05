import { useState } from 'react'
import { useStatus } from '../hooks/useApi'
import { Wifi, WifiOff, Server, Activity, RefreshCw, Zap, Clock, ChevronRight } from 'lucide-react'

export default function HomePage() {
  const { data, loading, error, refresh } = useStatus()
  const [restarting, setRestarting] = useState(false)

  if (loading) return <div className="p-4 text-claw-muted">Loading...</div>
  if (error) return (
    <div className="p-4">
      <div className="card mb-4 text-claw-highlight">{error}</div>
      <button className="btn-primary w-full" onClick={refresh}>Retry</button>
    </div>
  )

  const service = data?.gatewayService
  const isRunning = service?.runtime?.status === 'running'
  const version = data?.runtimeVersion || 'unknown'
  const agents = data?.agents?.agents || []
  const sessions = data?.sessions?.recent || []
  const tasks = data?.tasks || {}

  return (
    <div className="p-4 space-y-4">
      {/* Gateway Status */}
      <div className="card">
        <div className="flex items-center gap-3 mb-3">
          {isRunning ? <Wifi size={28} className="text-green-400" /> : <WifiOff size={28} className="text-red-400" />}
          <div>
            <h2 className="font-bold text-lg">{isRunning ? 'Online' : 'Offline'}</h2>
            <p className="text-xs text-claw-muted">v{version}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="bg-claw-dark rounded-lg p-2">
            <div className="text-lg font-bold text-claw-highlight">{agents.length}</div>
            <div className="text-xs text-claw-muted">Agents</div>
          </div>
          <div className="bg-claw-dark rounded-lg p-2">
            <div className="text-lg font-bold text-claw-highlight">{sessions.length}</div>
            <div className="text-xs text-claw-muted">Sessions</div>
          </div>
          <div className="bg-claw-dark rounded-lg p-2">
            <div className="text-lg font-bold text-claw-highlight">{tasks.active || 0}</div>
            <div className="text-xs text-claw-muted">Tasks</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-primary flex items-center justify-center gap-2" onClick={() => {
          if (confirm('Restart gateway? Agents will briefly disconnect.')) {
            setRestarting(true)
            fetch('/api/gateway/restart', { method: 'POST' }).then(() => setTimeout(() => { refresh(); setRestarting(false) }, 5000))
          }
        }} disabled={restarting}>
          <RefreshCw size={16} className={restarting ? 'animate-spin' : ''} />
          {restarting ? '...' : 'Restart'}
        </button>
        <button className="btn-secondary" onClick={refresh}>
          Refresh
        </button>
      </div>

      {/* Active Agents */}
      <div className="card">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Zap size={16} className="text-claw-highlight" /> Active Agents
        </h3>
        {agents.slice(0, 5).map((a: any) => (
          <div key={a.id} className="flex items-center justify-between py-2 border-b border-claw-accent/20 last:border-0">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${a.sessionsCount > 0 ? 'bg-green-400' : 'bg-claw-muted'}`} />
              <span className="capitalize">{a.name || a.id}</span>
            </div>
            <span className="text-xs text-claw-muted">{a.sessionsCount} sessions</span>
          </div>
        ))}
      </div>

      {/* Recent Sessions */}
      <div className="card">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Activity size={16} className="text-claw-highlight" /> Recent Sessions
        </h3>
        {sessions.slice(0, 3).map((s: any) => (
          <div key={s.sessionId} className="flex items-center justify-between py-2 border-b border-claw-accent/20 last:border-0 text-sm">
            <span className="truncate max-w-[60%]">{s.agentId}</span>
            <span className="text-xs text-claw-muted">{s.percentUsed != null ? `${s.percentUsed}%` : '?'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
