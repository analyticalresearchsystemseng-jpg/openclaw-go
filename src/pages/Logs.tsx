import { useLogs } from '../hooks/useApi'
import { FileText, RefreshCw } from 'lucide-react'

export default function Logs() {
  const { data, loading, error, refresh } = useLogs()

  const logEntries = Array.isArray(data) ? data.filter((e: any) => e.type === 'log') : []

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Logs</h2>
        <button onClick={refresh} className="text-claw-highlight">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <div className="card text-claw-highlight">{error}</div>}

      <div className="space-y-2">
        {logEntries.slice(-20).map((entry: any, i: number) => (
          <div key={i} className="card py-2 px-3">
            <div className="flex items-center gap-2 text-xs mb-1">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                entry.level === 'error' ? 'bg-red-500/20 text-red-400' :
                entry.level === 'warn' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {entry.level || 'info'}
              </span>
              <span className="text-claw-muted">{entry.time?.split('T')[1]?.slice(0, 8) || '?'}</span>
              <span className="text-claw-muted truncate">{entry.subsystem || ''}</span>
            </div>
            <div className="text-xs text-claw-text/80 break-words">
              {typeof entry.message === 'string' ? entry.message : JSON.stringify(entry.message)?.slice(0, 200)}
            </div>
          </div>
        ))}
      </div>

      {logEntries.length === 0 && !loading && (
        <div className="card text-center text-claw-muted py-8">No logs available</div>
      )}
    </div>
  )
}
