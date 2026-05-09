import { useState, useEffect } from 'react'
import { Shield, RotateCcw, Power, CheckCircle, XCircle, AlertTriangle, Activity, Zap, ChevronDown, ChevronUp, FileText, Save, X, Edit3 } from 'lucide-react'
import { api } from '../api/gateway'

interface Agent {
  id: string
  name: string
  status: string
  model?: string
  lastActivity?: string
  error?: string
  configPath?: string
}

interface Skill {
  id: string
  name: string
  enabled: boolean
  description?: string
}

interface AgentFile {
  name: string
  path: string
  label: string
}

const CORE_FILES: Record<string, AgentFile[]> = {
  default: [
    { name: 'SOUL.md', path: '~/.openclaw/workspace/SOUL.md', label: 'Personality' },
    { name: 'AGENTS.md', path: '~/.openclaw/workspace/AGENTS.md', label: 'Agent Rules' },
    { name: 'MEMORY.md', path: '~/.openclaw/workspace/MEMORY.md', label: 'Long-term Memory' },
    { name: 'IDENTITY.md', path: '~/.openclaw/workspace/IDENTITY.md', label: 'Identity' },
    { name: 'USER.md', path: '~/.openclaw/workspace/USER.md', label: 'User Info' },
  ]
}

export default function Admin() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentSkills, setAgentSkills] = useState<Record<string, Skill[]>>({})
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  
  // File editing state
  const [editingFile, setEditingFile] = useState<{ agentId: string; file: AgentFile; content: string } | null>(null)
  const [savingFile, setSavingFile] = useState(false)

  useEffect(() => {
    loadAgents()
  }, [])

  async function loadAgents() {
    setLoading(true)
    setError(null)
    try {
      const result = await api.agentList()
      setAgents(result || [])
      for (const agent of result || []) {
        loadSkills(agent.id)
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load agents')
    } finally {
      setLoading(false)
    }
  }

  async function loadSkills(agentId: string) {
    try {
      const skills = await api.skillsList(agentId)
      setAgentSkills(prev => ({ ...prev, [agentId]: skills || [] }))
    } catch (e) {
      console.log(`Could not load skills for ${agentId}`)
    }
  }

  async function toggleSkill(agentId: string, skillId: string, enable: boolean) {
    try {
      if (enable) {
        await api.skillEnable(agentId, skillId)
      } else {
        await api.skillDisable(agentId, skillId)
      }
      loadSkills(agentId)
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function editAgentFile(agentId: string, file: AgentFile) {
    try {
      const content = await api.fileRead(file.path)
      setEditingFile({ agentId, file, content })
    } catch (e: any) {
      setError(`Could not load ${file.name}: ${e.message}`)
    }
  }

  async function saveAgentFile() {
    if (!editingFile) return
    
    setSavingFile(true)
    try {
      await api.fileWrite(editingFile.file.path, editingFile.content)
      alert(`${editingFile.file.name} saved!`)
      setEditingFile(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSavingFile(false)
    }
  }

  async function restartAgent(agentId: string) {
    setActionInProgress(agentId)
    try {
      await api.agentRestart(agentId)
      alert(`Agent ${agentId} restarted successfully`)
      loadAgents()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionInProgress(null)
    }
  }

  async function stopAgent(agentId: string) {
    setActionInProgress(agentId)
    try {
      await api.agentStop(agentId)
      alert(`Agent ${agentId} stopped`)
      loadAgents()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionInProgress(null)
    }
  }

  async function restartGateway() {
    if (!confirm('WARNING: This will restart the entire OpenClaw gateway. All agents will be briefly interrupted. Continue?')) {
      return
    }
    
    setActionInProgress('gateway')
    try {
      await api.gatewayRestart('Admin restart from OpenClaw Go app')
      alert('Gateway restart initiated. This may take 30-60 seconds.')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionInProgress(null)
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'running': return <CheckCircle size={16} className="text-green-500" />
      case 'stopped': return <XCircle size={16} className="text-gray-400" />
      case 'error': return <AlertTriangle size={16} className="text-red-500" />
      default: return <Activity size={16} className="text-yellow-500" />
    }
  }

  function toggleExpand(agentId: string) {
    setExpandedAgent(prev => prev === agentId ? null : agentId)
    if (expandedAgent !== agentId) {
      loadSkills(agentId)
    }
  }

  function getAgentFiles(agentId: string): AgentFile[] {
    return CORE_FILES[agentId] || CORE_FILES.default
  }

  // File editor overlay
  if (editingFile) {
    return (
      <div className="h-full flex flex-col bg-claw-dark">
        <div className="flex items-center justify-between p-3 border-b border-claw-accent/30">
          <div className="flex items-center gap-2">
            <button onClick={() => setEditingFile(null)} className="p-2">
              <X size={20} />
            </button>
            <div>
              <h3 className="font-semibold text-sm">{editingFile.file.name}</h3>
              <p className="text-xs text-claw-muted">{editingFile.file.label}</p>
            </div>
          </div>
          <button
            onClick={saveAgentFile}
            disabled={savingFile}
            className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Save size={16} />
            {savingFile ? 'Saving...' : 'Save'}
          </button>
        </div>
        
        <textarea
          value={editingFile.content}
          onChange={e => setEditingFile({ ...editingFile, content: e.target.value })}
          className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none bg-claw-dark text-white"
          spellCheck={false}
        />
        
        <div className="p-3 border-t border-claw-accent/30 text-xs text-claw-muted">
          Path: {editingFile.file.path}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Admin Panel</h2>
        <button 
          onClick={loadAgents}
          disabled={loading}
          className="text-sm text-gray-500"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Gateway Control */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-claw-primary" />
          <h3 className="font-semibold">Gateway Control</h3>
        </div>
        
        <button
          onClick={restartGateway}
          disabled={actionInProgress === 'gateway'}
          className="w-full py-3 bg-orange-600 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <RotateCcw size={18} className={actionInProgress === 'gateway' ? 'animate-spin' : ''} />
          {actionInProgress === 'gateway' ? 'Restarting...' : 'Restart Gateway'}
        </button>
        
        <p className="text-xs text-gray-500">
          Restarts all agents with latest config. Use if an agent is stuck with wrong model.
        </p>
      </div>

      {/* Agents List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">Agents, Skills & Files</h3>
        
        {agents.length === 0 && !loading && (
          <div className="card text-center text-gray-400 py-4">
            No agents found or API not available
          </div>
        )}

        {agents.map((agent) => (
          <div key={agent.id} className="card space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(agent.status)}
                <div>
                  <h4 className="font-semibold text-sm">{agent.name || agent.id}</h4>
                  <p className="text-xs text-gray-500">Model: {agent.model || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-2 py-1 rounded ${
                  agent.status === 'running' ? 'bg-green-100 text-green-700' :
                  agent.status === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {agent.status}
                </span>
                <button
                  onClick={() => toggleExpand(agent.id)}
                  className="p-1 text-claw-muted"
                >
                  {expandedAgent === agent.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {agent.error && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                {agent.error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => restartAgent(agent.id)}
                disabled={actionInProgress === agent.id}
                className="flex-1 py-2 bg-blue-600 text-white text-sm rounded flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <RotateCcw size={14} />
                Restart
              </button>
              
              <button
                onClick={() => stopAgent(agent.id)}
                disabled={actionInProgress === agent.id}
                className="flex-1 py-2 bg-red-600 text-white text-sm rounded flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Power size={14} />
                Stop
              </button>
            </div>

            {/* Expanded Section: Skills + Config Files */}
            {expandedAgent === agent.id && (
              <div className="pt-3 border-t border-gray-200 space-y-4">
                
                {/* Skills */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-claw-muted">
                    <Zap size={14} className="text-yellow-500" />
                    Skills
                  </div>
                  
                  {agentSkills[agent.id]?.length === 0 && (
                    <p className="text-sm text-gray-400">No skills configured</p>
                  )}

                  {agentSkills[agent.id]?.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${skill.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <span className="text-sm font-medium">{skill.name || skill.id}</span>
                          {skill.description && (
                            <p className="text-xs text-gray-400">{skill.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => toggleSkill(agent.id, skill.id, !skill.enabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          skill.enabled ? 'bg-claw-primary' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            skill.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}

                  {!agentSkills[agent.id] && (
                    <p className="text-sm text-gray-400">Loading skills...</p>
                  )}
                </div>

                {/* Core Files */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-claw-muted">
                    <FileText size={14} className="text-blue-500" />
                    Core Files
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {getAgentFiles(agent.id).map((file) => (
                      <button
                        key={file.path}
                        onClick={() => editAgentFile(agent.id, file)}
                        className="flex items-center gap-2 p-2 bg-claw-dark rounded-lg text-left hover:bg-claw-accent/30 transition-colors"
                      >
                        <Edit3 size={14} className="text-claw-muted" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{file.name}</div>
                          <div className="text-[10px] text-claw-muted">{file.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <p className="text-xs text-claw-muted">
                    Tap any file to edit. Changes are live — restart agent to apply.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card bg-yellow-50 border-yellow-200 text-sm text-yellow-800">
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Warning</p>
            <p className="text-xs">Restarting agents will interrupt any ongoing tasks. Disabling skills reduces agent capabilities. Editing core files takes effect on next restart.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
