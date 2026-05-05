import { useState, useEffect } from 'react'
import { Users, Radio, Link2, Clock, Plus, ChevronDown, ChevronUp, Trash2, CheckCircle } from 'lucide-react'
import HelpTooltip from '../components/HelpTooltip'

const THINKING = [
  { value: 'low', label: 'Fast' },
  { value: 'medium', label: 'Balanced' },
  { value: 'high', label: 'Deep' },
]

const DM_POLICIES = [
  { value: 'pairing', label: 'Pairing' },
  { value: 'open', label: 'Open' },
  { value: 'allowlist', label: 'Allowlist' },
]

const GROUP_POLICIES = [
  { value: 'allowlist', label: 'Allowlist' },
  { value: 'open', label: 'Open' },
]

const SCHEDULES = [
  { label: 'Every 30 min', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Daily 9am', value: '0 9 * * *' },
  { label: 'Daily 6pm', value: '0 18 * * *' },
  { label: 'Weekly Mon 9am', value: '0 9 * * 1' },
]

function Section({ title, icon: Icon, children, defaultOpen = false }: any) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card mb-3">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold">
          <Icon size={18} className="text-claw-highlight" />
          {title}
          <HelpTooltip section={title.toLowerCase().split(' ')[0]} />
        </div>
        {open ? <ChevronUp size={18} className="text-claw-muted" /> : <ChevronDown size={18} className="text-claw-muted" />}
      </button>
      {open && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  )
}

function getModelString(model: any): string {
  if (typeof model === 'string') return model
  if (model && typeof model === 'object') {
    if (model.primary) return model.primary
    return JSON.stringify(model)
  }
  return ''
}

function getAllModels(agents: any[]): string[] {
  const models = new Set<string>()
  agents.forEach(a => {
    const m = getModelString(a?.model)
    if (m) models.add(m)
  })
  // Add defaults if list is short
  const defaults = [
    'ollama/kimi-k2.6:cloud',
    'ollama2/kimi-k2.5:cloud',
    'ollama2/devstral-2:123b',
    'ollama2/deepseek-v4-pro',
    'ollama/gemini-3-flash-preview',
    'ollama2/gemma4:31b',
    'ollama2/qwen3-coder-next',
    'ollama/qwen3.5:397b',
    'ollama/mistral-large-3:675b',
    'ollama2/glm-5.1:cloud',
    'ollama2/qwen3-vl:235b',
    'ollama/nemotron-3-super',
    'ollama2/minimax-m2.7:cloud',
  ]
  defaults.forEach(m => models.add(m))
  return Array.from(models).sort()
}

export default function SetupPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [channels, setChannels] = useState<any[]>([])
  const [bindings, setBindings] = useState<any[]>([])
  const [cronJobs, setCronJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [aRes, cRes, bRes, crRes] = await Promise.all([
          fetch('/api/agents'),
          fetch('/api/config?path=channels.telegram.accounts'),
          fetch('/api/config?path=bindings'),
          fetch('/api/cron'),
        ])

        const aData = aRes.ok ? await aRes.json() : []
        const cData = cRes.ok ? await cRes.json() : {}
        const bData = bRes.ok ? await bRes.json() : []
        const crData = crRes.ok ? await crRes.json() : { jobs: [] }

        if (cancelled) return

        setAgents(Array.isArray(aData) ? aData : [])

        if (cData && typeof cData === 'object' && !Array.isArray(cData) && !cData.error) {
          setChannels(Object.entries(cData).map(([k, v]: [string, any]) => ({ id: k, ...v })))
        } else {
          setChannels([])
        }

        setBindings(Array.isArray(bData) ? bData : [])
        setCronJobs(Array.isArray(crData) ? crData : (crData.jobs || []))
      } catch (e) {
        console.error('Setup load error:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const MODELS = getAllModels(agents)

  const [newAgent, setNewAgent] = useState({ id: '', name: '', model: MODELS[0] || 'ollama/kimi-k2.6:cloud', thinkingDefault: 'medium' })
  const [newBot, setNewBot] = useState({ accountId: '', token: '', dmPolicy: 'pairing', groupPolicy: 'allowlist', dmAllowlist: '', groupAllowlist: '' })
  const [newBinding, setNewBinding] = useState({ agentId: '', channel: 'telegram', accountId: '', useCustomId: false, customId: '' })
  const [newCron, setNewCron] = useState({ name: '', schedule: '0 9 * * *', command: '' })

  useEffect(() => {
    if (MODELS.length > 0 && !MODELS.includes(newAgent.model)) {
      setNewAgent(prev => ({ ...prev, model: MODELS[0] }))
    }
  }, [MODELS])

  async function addAgent() {
    const agentId = newAgent.id || newAgent.name.toLowerCase().replace(/\s+/g, '-')
    await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agents: { list: [...agents, { ...newAgent, id: agentId }] } })
    })
    setNewAgent({ id: '', name: '', model: MODELS[0] || 'ollama/kimi-k2.6:cloud', thinkingDefault: 'medium' })
    window.location.reload()
  }

  async function removeAgent(id: string) {
    await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agents: { list: agents.filter(a => a.id !== id) } })
    })
    window.location.reload()
  }

  async function addBot() {
    const body: any = { channel: 'telegram', token: newBot.token, account: newBot.accountId || 'default' }
    await fetch('/api/channels/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    setNewBot({ accountId: '', token: '', dmPolicy: 'pairing', groupPolicy: 'allowlist', dmAllowlist: '', groupAllowlist: '' })
    window.location.reload()
  }

  async function addBinding() {
    const account = newBinding.useCustomId ? newBinding.customId : newBinding.accountId
    await fetch('/api/agents/bind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: newBinding.agentId, channel: newBinding.channel, account })
    })
    setNewBinding({ agentId: '', channel: 'telegram', accountId: '', useCustomId: false, customId: '' })
    window.location.reload()
  }

  async function removeBinding(idx: number) {
    const b = bindings[idx]
    if (!b) return
    await fetch('/api/agents/unbind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: b.agentId, channel: b.match?.channel, account: b.match?.accountId })
    })
    window.location.reload()
  }

  async function addCron() {
    await fetch('/api/cron/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCron.name, schedule: newCron.schedule, command: newCron.command })
    })
    setNewCron({ name: '', schedule: '0 9 * * *', command: '' })
    window.location.reload()
  }

  async function removeCron(id: string) {
    await fetch('/api/cron/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    window.location.reload()
  }

  if (loading) return <div className="p-4 text-claw-muted">Loading...</div>

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-xl font-bold mb-3">Setup</h2>

      <Section title="Agents" icon={Users} defaultOpen={true}>
        {agents.map(a => (
          <div key={a.id} className="flex items-center justify-between bg-claw-dark rounded-lg p-3">
            <div>
              <div className="font-medium">{a.name || a.id}</div>
              <div className="text-xs text-claw-muted">{getModelString(a.model).split('/').pop() || 'default'}</div>
            </div>
            <button onClick={() => removeAgent(a.id)} className="text-red-400 p-2"><Trash2 size={16} /></button>
          </div>
        ))}
        {agents.length === 0 && <div className="text-sm text-claw-muted">No agents</div>}

        <div className="space-y-2 border-t border-claw-accent/30 pt-3">
          <div className="text-xs text-claw-muted uppercase">New Agent</div>
          <input className="input" placeholder="ID (e.g. research)" value={newAgent.id} onChange={e => setNewAgent({ ...newAgent, id: e.target.value })} />
          <input className="input" placeholder="Name" value={newAgent.name} onChange={e => setNewAgent({ ...newAgent, name: e.target.value })} />
          <select className="input" value={newAgent.model} onChange={e => setNewAgent({ ...newAgent, model: e.target.value })}>
            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="input" value={newAgent.thinkingDefault} onChange={e => setNewAgent({ ...newAgent, thinkingDefault: e.target.value })}>
            {THINKING.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={addAgent}>
            <Plus size={16} /> Add Agent
          </button>
        </div>
      </Section>

      <Section title="Telegram Bots" icon={Radio}>
        {channels.map(c => (
          <div key={c.id} className="flex items-center justify-between bg-claw-dark rounded-lg p-3">
            <div>
              <div className="font-medium">{c.id}</div>
              <div className="text-xs text-claw-muted">DM: {c.dmPolicy || '?'} | Groups: {c.groupPolicy || '?'}</div>
            </div>
            <CheckCircle size={16} className="text-green-400" />
          </div>
        ))}
        {channels.length === 0 && <div className="text-sm text-claw-muted">No Telegram bots</div>}

        <div className="space-y-2 border-t border-claw-accent/30 pt-3">
          <div className="text-xs text-claw-muted uppercase">New Bot</div>
          <input className="input" placeholder="Account name (e.g. chip)" value={newBot.accountId} onChange={e => setNewBot({ ...newBot, accountId: e.target.value })} />
          <input className="input font-mono" type="password" placeholder="Bot token from @BotFather" value={newBot.token} onChange={e => setNewBot({ ...newBot, token: e.target.value })} />
          
          <select className="input" value={newBot.dmPolicy} onChange={e => setNewBot({ ...newBot, dmPolicy: e.target.value })}>
            {DM_POLICIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {newBot.dmPolicy === 'allowlist' && (
            <textarea className="input" rows={2} placeholder="DM allowlist IDs (comma-separated)" value={newBot.dmAllowlist} onChange={e => setNewBot({ ...newBot, dmAllowlist: e.target.value })} />
          )}

          <select className="input" value={newBot.groupPolicy} onChange={e => setNewBot({ ...newBot, groupPolicy: e.target.value })}>
            {GROUP_POLICIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {newBot.groupPolicy === 'allowlist' && (
            <textarea className="input" rows={2} placeholder="Group allowlist IDs (comma-separated)" value={newBot.groupAllowlist} onChange={e => setNewBot({ ...newBot, groupAllowlist: e.target.value })} />
          )}

          <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={addBot}>
            <Plus size={16} /> Add Telegram Bot
          </button>
        </div>
      </Section>

      <Section title="Bindings" icon={Link2}>
        {bindings.map((b, i) => (
          <div key={i} className="flex items-center justify-between bg-claw-dark rounded-lg p-3">
            <div>
              <div className="font-medium">{b?.match?.channel || '?'}{b?.match?.accountId ? `:${b.match.accountId}` : ''}</div>
              <div className="text-xs text-claw-muted">→ {b?.agentId || '?'}</div>
            </div>
            <button onClick={() => removeBinding(i)} className="text-red-400 p-2"><Trash2 size={16} /></button>
          </div>
        ))}
        {bindings.length === 0 && <div className="text-sm text-claw-muted">No bindings</div>}

        <div className="space-y-2 border-t border-claw-accent/30 pt-3">
          <div className="text-xs text-claw-muted uppercase">New Binding</div>
          <select className="input" value={newBinding.agentId} onChange={e => setNewBinding({ ...newBinding, agentId: e.target.value })}>
            <option value="">Select agent...</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name || a.id}</option>)}
          </select>
          <select className="input" value={newBinding.channel} onChange={e => setNewBinding({ ...newBinding, channel: e.target.value })}>
            <option value="telegram">Telegram</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={newBinding.useCustomId} onChange={e => setNewBinding({ ...newBinding, useCustomId: e.target.checked })} />
            <span className="text-sm">Custom account ID</span>
          </div>
          
          {newBinding.useCustomId ? (
            <input className="input" placeholder="Enter account/channel ID" value={newBinding.customId} onChange={e => setNewBinding({ ...newBinding, customId: e.target.value })} />
          ) : (
            <select className="input" value={newBinding.accountId} onChange={e => setNewBinding({ ...newBinding, accountId: e.target.value })}>
              <option value="">Default account</option>
              {channels.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
            </select>
          )}
          
          <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={addBinding} disabled={!newBinding.agentId}>
            <Plus size={16} /> Link Agent
          </button>
        </div>
      </Section>

      <Section title="Cron Jobs" icon={Clock}>
        {cronJobs.map((job: any) => (
          <div key={job?.id || job?.name || Math.random()} className="flex items-center justify-between bg-claw-dark rounded-lg p-3">
            <div>
              <div className="font-medium">{job?.name || 'Unnamed'}</div>
              <div className="text-xs text-claw-muted">
                {job?.schedule?.kind === 'cron' ? job?.schedule?.expr : 
                 job?.schedule?.kind === 'every' ? `Every ${job?.schedule?.everyMs / 60000}m` : 
                 'No schedule'}
              </div>
              {job?.payload?.message && <div className="text-xs text-claw-muted font-mono mt-1 truncate max-w-[200px]">{job.payload.message}</div>}
            </div>
            <button onClick={() => job?.id && removeCron(job.id)} className="text-red-400 p-2"><Trash2 size={16} /></button>
          </div>
        ))}
        {cronJobs.length === 0 && <div className="text-sm text-claw-muted">No cron jobs</div>}

        <div className="space-y-2 border-t border-claw-accent/30 pt-3">
          <div className="text-xs text-claw-muted uppercase">New Job</div>
          <input className="input" placeholder="Job name" value={newCron.name} onChange={e => setNewCron({ ...newCron, name: e.target.value })} />
          <select className="input" value={newCron.schedule} onChange={e => setNewCron({ ...newCron, schedule: e.target.value })}>
            {SCHEDULES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <input className="input" placeholder="Command (e.g. openclaw message send...)" value={newCron.command} onChange={e => setNewCron({ ...newCron, command: e.target.value })} />
          <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={addCron}>
            <Plus size={16} /> Add Cron Job
          </button>
        </div>
      </Section>
    </div>
  )
}
