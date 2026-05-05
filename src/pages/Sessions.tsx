import { useSessions } from '../hooks/useApi'
import { Activity, Clock, Zap } from 'lucide-react'

export default function Sessions() {
  const { data, loading, error, refresh } = useSessions()

  if (loading) return <div className="p-4 text-claw-muted">Loading sessions...</div>
  if (error) return (
    <div className="p-4">
      <div className="card mb-4 text-claw-highlight">Error: {error}</div>
      <button className="btn-primary w-full" onClick={refresh}>Retry</button>
    </div>
  )

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Sessions</h2>
        <span className="text-xs text-claw-muted">{data.length} active</span>
      </div>

      {data.map((sess: any) => (
        <div key={sess.key || sess.id} className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-claw-highlight" />
              <span className="font-bold text-sm">{sess.agentId || sess.kind || 'Session'}</span>
            </div>
            <span className="text-xs text-claw-muted">{sess.age || sess.lastActivity || 'recent'}</span>
          </div>

          <div className="text-xs space-y-1 text-claw-muted">
            <div className="flex items-center gap-2">
              <Clock size={12} />
              <span>{sess.model || 'unknown model'}</span>
            </div>
            {sess.tokens && (
              <div className="flex items-center gap-2">
                <Activity size={12} />
                <span>{sess.tokens}</span>
              </div>
            )}
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div className="card text-center text-claw-muted py-8">No active sessions</div>
      )}
    </div>
  )
}
