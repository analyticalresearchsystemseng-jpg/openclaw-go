import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2, Edit3, Save, X, Play, Pause, FileText, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '../api/gateway'

interface CronJob {
  id: string
  schedule: string
  command: string
  enabled: boolean
  lastRun?: string
  nextRun?: string
  description?: string
  sensorTrigger?: string
}

export default function CronEditor() {
  const [crons, setCrons] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [newJob, setNewJob] = useState({ schedule: '', command: '', description: '' })
  const [showNewForm, setShowNewForm] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadCrons()
    const interval = setInterval(loadCrons, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadCrons() {
    try {
      const result = await api.cronList()
      setCrons(result || [])
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function enableCron(id: string) {
    setLoading(true)
    try {
      await api.cronEnable(id)
      loadCrons()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function disableCron(id: string) {
    setLoading(true)
    try {
      await api.cronDisable(id)
      loadCrons()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function removeCron(id: string) {
    if (!confirm('Delete this cron job?')) return
    setLoading(true)
    try {
      await api.cronRemove(id)
      loadCrons()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function runCron(id: string, sensorData?: any) {
    setLoading(true)
    try {
      await api.triggerCron(id, sensorData)
      alert('Cron triggered!')
      loadCrons()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function addCron() {
    if (!newJob.schedule || !newJob.command) {
      alert('Schedule and command required')
      return
    }
    
    setLoading(true)
    try {
      await api.cronEdit('new', {
        schedule: newJob.schedule,
        command: newJob.command,
        description: newJob.description,
        enabled: true
      })
      setNewJob({ schedule: '', command: '', description: '' })
      setShowNewForm(false)
      loadCrons()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function updateCron(id: string, updates: Partial<CronJob>) {
    setLoading(true)
    try {
      await api.cronEdit(id, updates)
      setEditing(null)
      loadCrons()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={24} className="text-claw-primary" />
          <h2 className="text-xl font-bold">Cron Jobs</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={loadCrons} className="p-2 text-claw-muted">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setShowNewForm(!showNewForm)}
            className="p-2 bg-claw-primary text-white rounded-lg"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="card bg-red-50 text-red-600 text-sm p-3">{error}</div>
      )}

      {/* New Job Form */}
      {showNewForm && (
        <div className="card space-y-3">
          <h3 className="font-semibold">New Cron Job</h3>
          <input
            placeholder="Schedule (e.g. 0 9 * * 1-5)"
            value={newJob.schedule}
            onChange={e => setNewJob({...newJob, schedule: e.target.value})}
            className="input"
          />
          <input
            placeholder="Command (e.g. curl http://localhost:18789/api/action)"
            value={newJob.command}
            onChange={e => setNewJob({...newJob, command: e.target.value})}
            className="input"
          />
          <input
            placeholder="Description"
            value={newJob.description}
            onChange={e => setNewJob({...newJob, description: e.target.value})}
            className="input"
          />
          <div className="flex gap-2">
            <button onClick={addCron} className="btn-primary flex-1">
              <Save size={16} /> Add Job
            </button>
            <button onClick={() => setShowNewForm(false)} className="btn-secondary">
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cron List */}
      <div className="space-y-2">
        {crons.map(job => (
          <div key={job.id} className={`card ${!job.enabled ? 'opacity-60' : ''}`}>
            {editing === job.id ? (
              <EditForm 
                job={job} 
                onSave={(updates) => updateCron(job.id, updates)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${job.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="font-semibold text-sm">{job.description || job.id}</span>
                      {job.sensorTrigger && <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">📱 Sensor</span>}
                    </div>
                    <p className="text-xs font-mono text-claw-muted mt-1">{job.schedule}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => runCron(job.id)} className="p-1.5 text-blue-600" title="Run now">
                      <Play size={16} />
                    </button>
                    <button 
                      onClick={() => job.enabled ? disableCron(job.id) : enableCron(job.id)}
                      className="p-1.5 text-yellow-600"
                      title={job.enabled ? 'Disable' : 'Enable'}
                    >
                      {job.enabled ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button onClick={() => setEditing(job.id)} className="p-1.5 text-claw-muted" title="Edit">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => removeCron(job.id)} className="p-1.5 text-red-600" title="Delete">
                      <Trash2 size={16} />
                    </button>
                    <button onClick={() => toggleExpand(job.id)} className="p-1.5 text-claw-muted">
                      {expanded.has(job.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {expanded.has(job.id) && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-sm">
                    <p><span className="text-claw-muted">Command: </span><span className="font-mono text-xs">{job.command}</span></p>
                    {job.lastRun && <p><span className="text-claw-muted">Last run: </span>{job.lastRun}</p>}
                    {job.nextRun && <p><span className="text-claw-muted">Next run: </span>{job.nextRun}</p>}
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {crons.length === 0 && !loading && (
          <div className="card text-center text-claw-muted py-8">
            No cron jobs configured
          </div>
        )}
      </div>
    </div>
  )
}

function EditForm({ job, onSave, onCancel }: { job: CronJob; onSave: (u: any) => void; onCancel: () => void }) {
  const [schedule, setSchedule] = useState(job.schedule)
  const [command, setCommand] = useState(job.command)
  const [description, setDescription] = useState(job.description || '')

  return (
    <div className="space-y-2">
      <input value={schedule} onChange={e => setSchedule(e.target.value)} className="input" placeholder="Schedule" />
      <input value={command} onChange={e => setCommand(e.target.value)} className="input" placeholder="Command" />
      <input value={description} onChange={e => setDescription(e.target.value)} className="input" placeholder="Description" />
      <div className="flex gap-2">
        <button 
          onClick={() => onSave({ schedule, command, description })}
          className="btn-primary flex-1"
        >
          <Save size={16} /> Save
        </button>
        <button onClick={onCancel} className="btn-secondary">
          <X size={16} /> Cancel
        </button>
      </div>
    </div>
  )
}
