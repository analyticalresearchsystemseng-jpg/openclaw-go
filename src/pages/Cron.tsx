import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2, HelpCircle, Play, Pause, Edit3, Save, X, AlertCircle } from 'lucide-react'
import { api, connect, disconnect } from '../api/gateway'

interface CronJob {
  id: string
  name: string
  schedule: string
  next?: string
  last?: string
  status: string
}

const SCHEDULE_PRESETS = [
  { label: 'Every 30 min', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Daily at 9am', value: '0 9 * * *' },
  { label: 'Daily at 6pm', value: '0 18 * * *' },
  { label: 'Weekly (Mon)', value: '0 9 * * 1' },
  { label: 'Custom', value: 'custom' },
]

export default function Cron() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', schedule: '' })

  // Load jobs on mount
  useEffect(() => {
    loadJobs()
  }, [])

  async function loadJobs() {
    setLoading(true)
    setError(null)
    try {
      const result = await api.cronList()
      setJobs(result || [])
    } catch (e: any) {
      setError(e.message || 'Failed to load cron jobs')
    } finally {
      setLoading(false)
    }
  }

  async function toggleJob(id: string, currentStatus: string) {
    try {
      if (currentStatus === 'idle' || currentStatus === 'ok') {
        await api.cronDisable(id)
      } else {
        await api.cronEnable(id)
      }
      loadJobs() // Refresh
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function runJobNow(id: string) {
    try {
      await api.cronRun(id)
      setError(null)
      alert('Job triggered successfully!')
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function deleteJob(id: string) {
    if (!confirm('Are you sure you want to delete this job?')) return
    try {
      await api.cronRemove(id)
      loadJobs()
    } catch (e: any) {
      setError(e.message)
    }
  }

  function startEdit(job: CronJob) {
    setEditingId(job.id)
    setEditForm({ name: job.name, schedule: job.schedule })
  }

  async function saveEdit(id: string) {
    try {
      await api.cronEdit(id, { name: editForm.name, schedule: editForm.schedule })
      setEditingId(null)
      loadJobs()
    } catch (e: any) {
      setError(e.message)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'ok': return 'bg-green-500'
      case 'idle': return 'bg-gray-500'
      case 'error': return 'bg-red-500'
      case 'running': return 'bg-yellow-500 animate-pulse'
      default: return 'bg-gray-400'
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Cron Jobs</h2>
        <button onClick={() => alert('Cron jobs run scheduled tasks. Click the play button to run immediately, or toggle to enable/disable.')}
                className="text-gray-500 hover:text-gray-700">
          <HelpCircle size={18} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <button onClick={loadJobs} disabled={loading}
              className="w-full py-2 px-4 bg-claw-primary text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
        <Clock size={18} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Loading...' : 'Refresh Jobs'}
      </button>

      <div className="space-y-3">
        {jobs.length === 0 && !loading && (
          <div className="card text-center text-claw-muted py-8">
            No cron jobs found.
            <br />
            <span className="text-xs">Use the CLI to create jobs: openclaw cron add</span>
          </div>
        )}

        {jobs.map((job) => (
          <div key={job.id} className="card space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              {editingId === job.id ? (
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-2 py-1 text-sm border rounded"
                    placeholder="Job name"
                  />
                  <input
                    type="text"
                    value={editForm.schedule}
                    onChange={(e) => setEditForm({ ...editForm, schedule: e.target.value })}
                    className="w-full px-2 py-1 text-xs font-mono border rounded"
                    placeholder="0 9 * * *"
                  />
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{job.name}</h3>
                  <p className="text-xs font-mono text-gray-500 truncate">{job.schedule}</p>
                </div>
              )}

              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(job.status)}`} />
              </div>
            </div>

            {/* Schedule info */}
            {!editingId && (
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div>
                  <span className="text-gray-400">Next:</span>
                  <br />{job.next || 'N/A'}
                </div>
                <div>
                  <span className="text-gray-400">Last:</span>
                  <br />{job.last || 'Never'}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t">
              {editingId === job.id ? (
                <>
                  <button onClick={() => saveEdit(job.id)}
                          className="flex-1 py-1 px-2 bg-green-600 text-white text-xs rounded flex items-center justify-center gap-1">
                    <Save size={14} /> Save
                  </button>
                  <button onClick={() => setEditingId(null)}
                          className="flex-1 py-1 px-2 bg-gray-500 text-white text-xs rounded flex items-center justify-center gap-1">
                    <X size={14} /> Cancel
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => runJobNow(job.id)}
                          className="flex-1 py-1 px-2 bg-blue-600 text-white text-xs rounded flex items-center justify-center gap-1">
                    <Play size={14} /> Run Now
                  </button>
                  <button onClick={() => startEdit(job)}
                          className="flex-1 py-1 px-2 bg-purple-600 text-white text-xs rounded flex items-center justify-center gap-1">
                    <Edit3 size={14} /> Edit
                  </button>
                  <button onClick={() => deleteJob(job.id)}
                          className="py-1 px-2 bg-red-600 text-white text-xs rounded flex items-center justify-center">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card bg-gray-50 text-xs text-gray-600">
        <p className="font-semibold mb-1">Cron Schedule Format:</p>
        <code className="block font-mono bg-gray-100 p-2 rounded">* * * * *</code>
        <p className="mt-1">Min Hour Day Month DayOfWeek</p>
        <p className="text-gray-400">Examples: 0 9 * * * (9am daily), */30 * * * * (every 30min)</p>
      </div>
    </div>
  )
}
