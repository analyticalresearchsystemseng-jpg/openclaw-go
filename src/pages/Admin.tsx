import { useState, useEffect } from 'react'
import { Shield, RotateCcw, Power, Play, AlertTriangle, CheckCircle, XCircle, Activity } from 'lucide-react'
import { api } from '../api/gateway'

interface Agent {
  id: string
  name: string
  status: string
  model?: string
  lastActivity?: string
  error?: string
}

export default function Admin() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ agentId: string; action: string } | null>(null)

  useEffect(() => {
    loadAgents()
  }, [])

  async function loadAgents() {
    setLoading(true)
    setError(null)
    try {
      const result = await api.agentList()
      setAgents(result || [])
    } catch (e: any) {
      setError(e.message || 'Failed to load agents')
    } finally {
      setLoading(false)
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
      setConfirmAction(null)
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
      setConfirmAction(null)
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
        <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">Agents</h3>
        
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
              <span className={`text-xs px-2 py-1 rounded ${
                agent.status === 'running' ? 'bg-green-100 text-green-700' :
                agent.status === 'error' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {agent.status}
              </span>
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
          </div>
        ))}
      </div>

      <div className="card bg-yellow-50 border-yellow-200 text-sm text-yellow-800">
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Warning</p>
            <p className="text-xs">Restarting agents will interrupt any ongoing tasks. Use stop only if an agent is stuck or consuming too many resources.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
