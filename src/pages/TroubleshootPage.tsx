import { useState } from 'react'
import { AlertTriangle, CheckCircle, RefreshCw, Terminal, Wifi, Server, MessageSquare, Brain, ChevronDown } from 'lucide-react'

interface Problem {
  icon: any
  title: string
  symptoms: string[]
  solutions: string[]
  severity: 'low' | 'medium' | 'high'
}

const PROBLEMS: Problem[] = [
  {
    icon: Wifi,
    title: "Telegram Bot Not Responding",
    symptoms: [
      "Messages sent to bot get no reply",
      "Bot shows as offline",
      "Messages delayed by minutes"
    ],
    solutions: [
      "Check gateway status: openclaw status",
      "Verify bot token is valid (regenerate via @BotFather if needed)",
      "Check binding exists for this agent",
      "Restart gateway: openclaw gateway restart",
      "Verify Cloudflare tunnel is running if using webhooks"
    ],
    severity: 'high'
  },
  {
    icon: Server,
    title: "Gateway Stuck / Sessions Frozen",
    symptoms: [
      "Agents not processing messages",
      "Cron jobs not running",
      "High CPU/memory usage",
      "Logs show 'stuck session' warnings"
    ],
    solutions: [
      "Restart gateway: openclaw gateway restart",
      "Check for stuck sessions: openclaw sessions",
      "Kill specific session if needed",
      "Wait 3-5 minutes for auto-recovery to kick in"
    ],
    severity: 'high'
  },
  {
    icon: Brain,
    title: "Agent Not Using Correct Model",
    symptoms: [
      "Agent responses are slow",
      "Wrong model shown in logs",
      "Token usage higher than expected"
    ],
    solutions: [
      "Check agent config: model field",
      "Verify model exists in providers list",
      "Check thinking level (high = more tokens)",
      "Switch to lighter model for speed"
    ],
    severity: 'medium'
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Not Receiving Messages",
    symptoms: [
      "WhatsApp shows 'disconnected' status",
      "Messages not being processed",
      "QR code scan needed again"
    ],
    solutions: [
      "Check WhatsApp status in Monitor tab",
      "Scan QR code if session expired",
      "Verify phone has internet connection",
      "Restart WhatsApp channel: openclaw channels restart --channel whatsapp"
    ],
    severity: 'medium'
  },
  {
    icon: Terminal,
    title: "Cron Job Not Running",
    symptoms: [
      "Scheduled task didn't execute",
      "No output from expected job",
      "Job shows 'error' status"
    ],
    solutions: [
      "Check cron expression format (use crontab.guru to verify)",
      "Verify job is enabled (not disabled)",
      "Check job logs: openclaw logs --json",
      "Run job manually: openclaw cron run <job-id>",
      "Check timezone setting"
    ],
    severity: 'medium'
  },
  {
    icon: RefreshCw,
    title: "Skills Not Syncing",
    symptoms: [
      "Agent missing expected skills",
      "Skills in wrong location",
      "Skill sync cron failing"
    ],
    solutions: [
      "Check skill location: ~/.openclaw/skills/ (canonical)",
      "Run manual sync: openclaw skills sync",
      "Verify auto-skill-sync cron is running",
      "Check for skill duplicates in workspace/"
    ],
    severity: 'low'
  }
]

export default function TroubleshootPage() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="p-4 space-y-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Troubleshooting</h2>
        <p className="text-sm text-claw-muted mt-1">
          Common problems and their solutions. Click a card to expand.
        </p>
      </div>

      {PROBLEMS.map((problem) => {
        const isExpanded = expanded === problem.title
        const Icon = problem.icon
        
        return (
          <div 
            key={problem.title}
            className={`card mb-3 cursor-pointer transition-all ${
              isExpanded ? 'ring-1 ring-claw-highlight' : ''
            }`}
            onClick={() => setExpanded(isExpanded ? null : problem.title)}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                problem.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                problem.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">{problem.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  problem.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                  problem.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {problem.severity.toUpperCase()}
                </span>
              </div>
              <ChevronDown 
                size={18} 
                className={`text-claw-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              />
            </div>

            {isExpanded && (
              <div className="mt-4 space-y-4 border-t border-claw-accent/30 pt-4">
                <div>
                  <h4 className="text-xs font-bold text-red-400 uppercase mb-2 flex items-center gap-2">
                    <AlertTriangle size={14} /> Symptoms
                  </h4>
                  <ul className="space-y-1">
                    {problem.symptoms.map((s, i) => (
                      <li key={i} className="text-sm text-claw-muted flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-green-400 uppercase mb-2 flex items-center gap-2">
                    <CheckCircle size={14} /> Solutions
                  </h4>
                  <ul className="space-y-2">
                    {problem.solutions.map((s, i) => (
                      <li key={i} className="text-sm text-claw-muted flex items-start gap-2">
                        <span className="text-green-400 mt-0.5 font-mono text-xs">{i + 1}.</span>
                        <code className="bg-claw-dark px-1 py-0.5 rounded text-xs font-mono">{s}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )
      })}

      <div className="card mt-4 bg-claw-highlight/10">
        <h3 className="font-bold text-claw-highlight mb-2">Quick Diagnostics</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Gateway Status</span>
            <button className="text-xs bg-claw-dark px-2 py-1 rounded">Check: openclaw status</button>
          </div>
          <div className="flex items-center justify-between">
            <span>Channel Health</span>
            <button className="text-xs bg-claw-dark px-2 py-1 rounded">Check: openclaw channels status</button>
          </div>
          <div className="flex items-center justify-between">
            <span>Stuck Sessions</span>
            <button className="text-xs bg-claw-dark px-2 py-1 rounded">Check: openclaw sessions</button>
          </div>
          <div className="flex items-center justify-between">
            <span>Recent Logs</span>
            <button className="text-xs bg-claw-dark px-2 py-1 rounded">Check: openclaw logs --json --limit 50</button>
          </div>
        </div>
      </div>
    </div>
  )
}