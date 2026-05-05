import { useState, useEffect } from 'react'
import { Link2, Plus, Trash2, HelpCircle } from 'lucide-react'
import { useConfig } from '../hooks/useApi'

interface Binding {
  type: string
  agentId: string
  match: { channel?: string; accountId?: string }
}

const CHANNELS = ['telegram', 'whatsapp', 'discord', 'slack', 'matrix', 'signal']

export default function Bindings() {
  const { data, load } = useConfig('bindings')
  const [bindings, setBindings] = useState<Binding[]>([])
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ agentId: '', channel: 'telegram', accountId: '' })

  useEffect(() => { load() }, [load])
  useEffect(() => { if (Array.isArray(data)) setBindings(data) }, [data])

  const remove = async (idx: number) => {
    const updated = bindings.filter((_, i) => i !== idx)
    try {
      await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bindings: updated })
      })
      load()
    } catch (e) {
      alert('Protected path. Use CLI: openclaw agents unbind --agent <name> --bind telegram:<account>')
    }
  }

  const save = async () => {
    const newBinding = {
      type: 'route',
      agentId: form.agentId,
      match: { channel: form.channel, accountId: form.accountId || undefined }
    }
    try {
      await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bindings: [...bindings, newBinding] })
      })
      setAdding(false)
      setForm({ agentId: '', channel: 'telegram', accountId: '' })
      load()
    } catch (e) {
      alert('Protected path. Use CLI: openclaw agents bind --agent <name> --bind telegram:<account>')
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Bindings</h2>
        <button onClick={() => alert('Bindings route messages from channels to agents. Example: telegram:chip -> chip agent means all messages from the chip Telegram bot go to the chip agent.')} className="text-claw-muted">
          <HelpCircle size={16} />
        </button>
      </div>

      {bindings.map((b, i) => (
        <div key={i} className="card">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-claw-accent rounded-full flex items-center justify-center">
              <Link2 size={16} />
            </div>
            <div className="flex-1">
              <div className="font-medium">{b.match.channel || '?'}{b.match.accountId ? ':' + b.match.accountId : ''}</div>
              <div className="text-xs text-claw-muted">→ {b.agentId} agent</div>
            </div>
            <button onClick={() => remove(i)} className="text-red-400 p-2"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}

      {adding ? (
        <div className="card space-y-3">
          <div>
            <label className="text-sm text-claw-muted">Channel</label>
            <select className="input mt-1" value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}>
              {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-claw-muted">Account ID</label>
            <input className="input mt-1" value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })} placeholder="default or custom name" />
          </div>
          <div>
            <label className="text-sm text-claw-muted">Agent ID</label>
            <input className="input mt-1" value={form.agentId} onChange={e => setForm({ ...form, agentId: e.target.value })} placeholder="e.g. chip" />
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex-1" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={save}>Add</button>
          </div>
        </div>
      ) : (
        <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={() => setAdding(true)}>
          <Plus size={18} /> Add Binding
        </button>
      )}

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs">
        Bindings are protected. If saving fails, use CLI: openclaw agents bind --agent name --bind telegram:account
      </div>
    </div>
  )
}
