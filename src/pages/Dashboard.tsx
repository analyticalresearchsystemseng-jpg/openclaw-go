import { useState } from 'react'
import { useStatus } from '../hooks/useApi'
import { Wifi, WifiOff, Server, Cpu, Clock, RefreshCw, Zap } from 'lucide-react'

export default function Dashboard() {
  const { data, loading, error, refresh } = useStatus()
  const [restarting, setRestarting] = useState(false)

  if (loading) return <div className="p-4 text-claw-muted">Loading status...</div>
  if (error) return (
    <div className="p-4">
      <div className="card mb-4 text-claw-highlight">Error: {error}</div>
      <button className="btn-primary w-full" onClick={refresh}>Retry</button>
    </div>
  )

  const service = data?.gatewayService
  const isRunning = service?.runtime?.status === 'running'
  const version = data?.runtimeVersion || data?.gateway?.self?.version || 'unknown'
  const url = data?.gateway?.url || 'unknown'
  const latency = data?.gateway?.connectLatencyMs
  const agents = data?.agents?.agents || []
  const sessions = data?.sessions?.recent || []

  return (
    <div className="p-4 space-y-4">
      {/* Status card */}
      <div className="card">
        <div className="flex items-center gap-3 mb-3">
          {isRunning ? <Wifi size={24} className="text-green-400" /> : <WifiOff size={24} className="text-red-400" />}
          <div>
            <h2 className="font-bold text-lg">{isRunning ? 'Gateway Online' : 'Gateway Offline'}</h2>
            <p className="text-sm text-claw-muted">Version {version}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-claw-dark rounded-lg p-2">
            <div className="text-claw-muted">URL</div>
            <div className="font-mono text-xs truncate">{url}</div>
          </div>
          <div className="bg-claw-dark rounded-lg p-2">
            <div className="text-claw-muted">Latency</div>
            <div className="font-mono">{latency ? `${latency}ms` : '?'}</div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card flex items-center gap-3">
          <Server size={20} className="text-claw-highlight" />
          <div>
            <div className="text-2xl font-bold">{agents.length}</div>
            <div className="text-xs text-claw-muted">Agents</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <Cpu size={20} className="text-claw-highlight" />
          <div>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <div className="text-xs text-claw-muted">Sessions</div>
          </div>
        </div>
      </div>

      {/* Agents summary */}
      <div className="card">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <Zap size={16} /> Active Agents
        </h3>
        {agents.slice(0, 5).map((agent: any) => (
          <div key={agent.id} className="flex items-center justify-between py-2 border-b border-claw-accent/20 last:border-0">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${agent.sessionsCount > 0 ? 'bg-green-400' : 'bg-claw-muted'}`} />
              <span className="capitalize">{agent.name || agent.id}</span>
            </div>
            <span className="text-xs text-claw-muted">{agent.sessionsCount} sessions</span>
          </div>
        ))}
        {agents.length === 0 && <div className="text-sm text-claw-muted">No agents configured</div>}
      </div>

      {/* Recent sessions */}
      <div className="card">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <Clock size={16} /> Recent Sessions
        </h3>
        {sessions.slice(0, 3).map((sess: any) => (
          <div key={sess.sessionId} className="flex items-center justify-between py-2 border-b border-claw-accent/20 last:border-0 text-xs">
            <span className="truncate max-w-[60%]">{sess.agentId} — {sess.kind}</span>
            <span className="text-claw-muted">{sess.percentUsed !== null ? `${sess.percentUsed}%` : '?'}</span>
          </div>
        ))}
        {sessions.length === 0 && <div className="text-sm text-claw-muted">No recent sessions</div>}
      </div>

      {/* Restart button */}
      <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={() => {
        if (confirm('Restart the gateway? All agents will briefly disconnect.')) {
          setRestarting(true)
          fetch('/api/gateway/restart', { method: 'POST' }).then(() => {
            setTimeout(() => { refresh(); setRestarting(false) }, 5000)
          })
        }
      }} disabled={restarting}>
        <RefreshCw size={18} className={restarting ? 'animate-spin' : ''} />
        {restarting ? 'Restarting...' : 'Restart Gateway'}
      </button>
    </div>
  )
}
