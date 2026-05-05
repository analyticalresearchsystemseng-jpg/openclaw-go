import { useState, useEffect } from 'react'
import { User, Cpu, Trash2, Plus, HelpCircle, ChevronRight, Wrench, BookOpen } from 'lucide-react'
import { useConfig } from '../hooks/useApi'

interface Agent {
  id: string
  name?: string
  model?: string
  workspace?: string
  skills?: string[]
  thinkingDefault?: string
}

const MODELS = [
  'ollama/kimi-k2.6:cloud',
  'ollama2/kimi-k2.5:cloud',
  'ollama2/devstral-2:123b',
  'ollama2/deepseek-v4-pro',
  'ollama/gemini-3-flash-preview',
  'ollama2/gemma4:31b',
  'ollama2/qwen3-coder-next',
  'ollama/qwen3-coder:480b',
]

const SKILLS_LIST = [
  { id: 'agent-orchestrator', name: 'Agent Orchestrator', desc: 'Manage and coordinate multiple agents' },
  { id: 'agent-communicator', name: 'Agent Communicator', desc: 'Inter-agent messaging and coordination' },
  { id: 'api-dev', name: 'API Development', desc: 'Build and test APIs' },
  { id: 'auto-skill-sync', name: 'Auto Skill Sync', desc: 'Automatically sync and update skills' },
  { id: 'daily-brief', name: 'Daily Brief', desc: 'Generate daily summaries' },
  { id: 'debug-detective', name: 'Debug Detective', desc: 'Troubleshoot code issues' },
  { id: 'docker-essentials', name: 'Docker Essentials', desc: 'Docker container management' },
  { id: 'edulink-one', name: 'EduLink One', desc: 'School homework integration' },
  { id: 'frontend-design', name: 'Frontend Design', desc: 'UI/UX design assistance' },
  { id: 'github', name: 'GitHub', desc: 'GitHub repository management' },
  { id: 'google-calendar', name: 'Google Calendar', desc: 'Calendar event management' },
  { id: 'mermaid-architect', name: 'Mermaid Architect', desc: 'Generate diagrams and flowcharts' },
  { id: 'multi-search-engine', name: 'Multi Search', desc: 'Multi-source web search' },
  { id: 'python', name: 'Python', desc: 'Python coding assistance' },
  { id: 'remarkable-notes', name: 'reMarkable Notes', desc: 'Handwritten note OCR and extraction' },
  { id: 'service-layer-architecture', name: 'Service Layer', desc: 'Architecture design' },
  { id: 'shadcn-ui', name: 'shadcn/ui', desc: 'Component library builder' },
  { id: 'study-tutor', name: 'Study Tutor', desc: 'Educational content creation' },
  { id: 'teaching-plan-writer', name: 'Teaching Plans', desc: 'Create structured lessons' },
  { id: 'trading212-api', name: 'Trading212', desc: 'Portfolio and trading management' },
  { id: 'ui-ux-pro-max', name: 'UI/UX Pro', desc: 'Advanced interface design' },
  { id: 'web-coder', name: 'Web Coder', desc: 'Web development' },
]

function HelpPopup({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-block">
      <button onClick={() => setShow(!show)} className="text-claw-muted">
        <HelpCircle size={16} />
      </button>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-claw-card border border-claw-accent rounded-xl p-3 text-xs shadow-xl">
          {text}
          <button onClick={() => setShow(false)} className="mt-2 text-claw-highlight w-full text-center">Close</button>
        </div>
      )}
    </div>
  )
}

export default function Agents() {
  const { data, load } = useConfig('agents.list')
  const [agents, setAgents] = useState<Agent[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState<Partial<Agent>>({})

  useEffect(() => { load() }, [load])
  useEffect(() => { if (Array.isArray(data)) setAgents(data) }, [data])

  const handleSave = async () => {
    const patch: any = { agents: { list: agents.map(a => a.id === formData.id ? { ...a, ...formData } : a) } }
    if (creating) {
      patch.agents.list.push({ ...formData, id: formData.id || `agent-${Date.now()}` })
    }
    try {
      await fetch('/api/config', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
      setEditing(null)
      setCreating(false)
      setFormData({})
      load()
    } catch (e) {
      alert('Failed to save. Some fields may be protected and require CLI.')
    }
  }

  const openEditor = (agent?: Agent) => {
    if (agent) {
      setFormData({ ...agent })
      setEditing(agent.id)
      setCreating(false)
    } else {
      setFormData({ id: '', name: '', model: MODELS[0], thinkingDefault: 'medium', skills: [] })
      setCreating(true)
      setEditing(null)
    }
  }

  const toggleSkill = (skillId: string) => {
    const current = formData.skills || []
    const updated = current.includes(skillId) ? current.filter(s => s !== skillId) : [...current, skillId]
    setFormData({ ...formData, skills: updated })
  }

  if (editing || creating) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditing(null); setCreating(false) }} className="text-claw-muted"><ChevronRight size={20} className="rotate-180" /></button>
          <h2 className="text-xl font-bold">{creating ? 'New Agent' : 'Edit Agent'}</h2>
        </div>

        <div className="card space-y-3">
          <div>
            <label className="text-sm text-claw-muted flex items-center gap-1">
              Agent ID <HelpPopup text="Unique identifier. Used in bindings and routing. Lowercase, no spaces." />
            </label>
            <input className="input mt-1" value={formData.id || ''} onChange={e => setFormData({ ...formData, id: e.target.value })} disabled={!creating} />
          </div>

          <div>
            <label className="text-sm text-claw-muted flex items-center gap-1">
              Name <HelpPopup text="Human-friendly name shown in the UI." />
            </label>
            <input className="input mt-1" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>

          <div>
            <label className="text-sm text-claw-muted flex items-center gap-1">
              Model <HelpPopup text="The AI model this agent uses. Different models have different strengths." />
            </label>
            <select className="input mt-1" value={formData.model || ''} onChange={e => setFormData({ ...formData, model: e.target.value })}>
              {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-claw-muted flex items-center gap-1">
              Thinking <HelpPopup text="medium = balanced speed/quality. low = faster, less reasoning. high = deeper thinking, slower." />
            </label>
            <select className="input mt-1" value={formData.thinkingDefault || 'medium'} onChange={e => setFormData({ ...formData, thinkingDefault: e.target.value })}>
              <option value="low">Low (fast)</option>
              <option value="medium">Medium (balanced)</option>
              <option value="high">High (deep)</option>
            </select>
          </div>
        </div>

        {/* Skills */}
        <div className="card">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Wrench size={16} /> Skills
            <HelpPopup text="Skills give agents special capabilities. Toggle to enable/disable. Changes take effect on next session." />
          </h3>
          <div className="space-y-2">
            {SKILLS_LIST.map(skill => {
              const enabled = (formData.skills || []).includes(skill.id)
              return (
                <button key={skill.id} onClick={() => toggleSkill(skill.id)} className={`w-full text-left p-3 rounded-xl border transition-colors ${enabled ? 'border-claw-highlight bg-claw-highlight/10' : 'border-claw-accent/30 bg-claw-dark'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{skill.name}</div>
                      <div className="text-xs text-claw-muted">{skill.desc}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${enabled ? 'border-claw-highlight bg-claw-highlight' : 'border-claw-muted'}`}>
                      {enabled && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <button className="btn-primary w-full" onClick={handleSave}>{creating ? 'Create Agent' : 'Save Changes'}</button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Agents</h2>
        <HelpPopup text="Agents are AI personalities. Each has its own skills, model, and workspace. Messages route to agents based on channel bindings." />
      </div>

      {agents.map((agent) => (
        <div key={agent.id} className="card" onClick={() => openEditor(agent)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-claw-accent rounded-full flex items-center justify-center">
              <User size={20} />
            </div>
            <div className="flex-1">
              <div className="font-bold">{agent.name || agent.id}</div>
              <div className="text-xs text-claw-muted font-mono">{agent.id}</div>
            </div>
            <ChevronRight size={18} className="text-claw-muted" />
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-claw-muted">
            <span className="flex items-center gap-1"><Cpu size={12} /> {agent.model?.split('/').pop() || 'default'}</span>
            <span className="flex items-center gap-1"><BookOpen size={12} /> {(agent.skills || []).length} skills</span>
          </div>
        </div>
      ))}

      <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={() => openEditor()}>
        <Plus size={18} /> Add Agent
      </button>
    </div>
  )
}
