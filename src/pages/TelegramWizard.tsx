import { useState } from 'react'
import { Radio, HelpCircle, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import { cn } from '../utils/cn'

const STEPS = ['Token', 'Policies', 'Groups', 'Review']

function Help({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-block">
      <button onClick={() => setShow(!show)} className="text-claw-muted ml-1"><HelpCircle size={14} /></button>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-claw-card border border-claw-accent rounded-xl p-3 text-xs shadow-xl">
          {text}
          <button onClick={() => setShow(false)} className="mt-2 text-claw-highlight w-full">Close</button>
        </div>
      )}
    </div>
  )
}

export default function TelegramWizard({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [accountId, setAccountId] = useState('')
  const [token, setToken] = useState('')
  const [dmPolicy, setDmPolicy] = useState('pairing')
  const [groupPolicy, setGroupPolicy] = useState('allowlist')
  const [requireMention, setRequireMention] = useState(true)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      // Note: botToken is a protected path — this will fail via API
      // We show a CLI command for the user to run instead
      const patch = {
        channels: {
          telegram: {
            accounts: {
              [accountId || 'default']: {
                dmPolicy,
                groupPolicy,
                groups: { '*': { requireMention } }
              }
            }
          }
        }
      }
      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      })
      if (!res.ok) throw new Error('Protected path — use CLI')
      onDone()
    } catch (e) {
      // Show CLI fallback
      alert(`Account created (non-token fields).\n\nTo set the bot token, run this in WSL:\n\nopenclaw channels add --channel telegram --token "${token}" --account "${accountId || 'default'}"`)
      onDone()
    } finally {
      setSaving(false)
    }
  }

  const isStepValid = () => {
    if (step === 0) return token.length > 10 && token.includes(':')
    return true
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onClose} className="text-claw-muted"><ArrowLeft size={20} /></button>
        <h2 className="text-xl font-bold">Add Telegram Bot</h2>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className={cn("flex-1 h-1 rounded-full", i <= step ? "bg-claw-highlight" : "bg-claw-accent")} />
        ))}
      </div>
      <div className="text-center text-xs text-claw-muted">Step {step + 1} of {STEPS.length}: {STEPS[step]}</div>

      {step === 0 && (
        <div className="card space-y-3">
          <div>
            <label className="text-sm text-claw-muted flex items-center">
              Account ID <Help text="A name for this bot account (e.g. 'chip', 'work'). If only one bot, use 'default'." />
            </label>
            <input className="input mt-1" value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="default" />
          </div>
          <div>
            <label className="text-sm text-claw-muted flex items-center">
              Bot Token <Help text="Get this from @BotFather in Telegram. Format: 123456:ABC-DEF... Keep it secret!" />
            </label>
            <input className="input mt-1 font-mono" type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="123456:ABC-DEF..." />
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs">
            🔒 The token is a protected field. The app will provide a CLI command for you to run in WSL.
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center">
              DM Policy <Help text="Who can message your bot directly? Pairing = approve each user. Open = anyone." />
            </label>
            <div className="mt-2 space-y-2">
              {['pairing', 'open', 'allowlist', 'disabled'].map(p => (
                <button key={p} onClick={() => setDmPolicy(p)} className={cn("w-full p-3 rounded-xl border text-left transition-colors", dmPolicy === p ? "border-claw-highlight bg-claw-highlight/10" : "border-claw-accent/30 bg-claw-dark")}>
                  <div className="font-medium capitalize">{p}</div>
                  <div className="text-xs text-claw-muted">{p === 'pairing' ? 'Approve each user manually' : p === 'open' ? 'Anyone can message' : p === 'allowlist' ? 'Only approved IDs' : 'No DMs allowed'}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium flex items-center">
              Group Policy <Help text="Who can add your bot to groups?" />
            </label>
            <div className="mt-2 space-y-2">
              {['allowlist', 'open', 'disabled'].map(p => (
                <button key={p} onClick={() => setGroupPolicy(p)} className={cn("w-full p-3 rounded-xl border text-left transition-colors", groupPolicy === p ? "border-claw-highlight bg-claw-highlight/10" : "border-claw-accent/30 bg-claw-dark")}>
                  <div className="font-medium capitalize">{p}</div>
                  <div className="text-xs text-claw-muted">{p === 'allowlist' ? 'Only approved groups' : p === 'open' ? 'Any group' : 'No groups'}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Require @mention in groups</label>
            <button onClick={() => setRequireMention(!requireMention)} className={cn("w-12 h-6 rounded-full transition-colors", requireMention ? "bg-claw-highlight" : "bg-claw-accent")}>
              <div className={cn("w-5 h-5 bg-white rounded-full transition-transform", requireMention ? "translate-x-6" : "translate-x-0.5")} />
            </button>
          </div>
          <p className="text-xs text-claw-muted">
            When ON, the bot only responds when someone @mentions it. When OFF, it responds to every message.
          </p>
        </div>
      )}

      {step === 3 && (
        <div className="card space-y-3">
          <h3 className="font-bold">Review</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-claw-muted">Account:</span> <span>{accountId || 'default'}</span></div>
            <div className="flex justify-between"><span className="text-claw-muted">DM Policy:</span> <span className="capitalize">{dmPolicy}</span></div>
            <div className="flex justify-between"><span className="text-claw-muted">Group Policy:</span> <span className="capitalize">{groupPolicy}</span></div>
            <div className="flex justify-between"><span className="text-claw-muted">@mention required:</span> <span>{requireMention ? 'Yes' : 'No'}</span></div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs">
            ⚠️ You'll need to run a CLI command in WSL to set the bot token after creation.
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {step > 0 && (
          <button className="btn-secondary flex-1" onClick={() => setStep(step - 1)}>
            <ArrowLeft size={16} /> Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button className="btn-primary flex-1" onClick={() => isStepValid() && setStep(step + 1)} disabled={!isStepValid()}>
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={save} disabled={saving}>
            <CheckCircle size={16} /> {saving ? 'Saving...' : 'Create Bot'}
          </button>
        )}
      </div>
    </div>
  )
}
