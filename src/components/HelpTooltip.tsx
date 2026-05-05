import { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'

interface TooltipData {
  title: string
  description: string
  commonProblems: string[]
  fixes: string[]
}

const TOOLTIPS: Record<string, TooltipData> = {
  agents: {
    title: "Agents",
    description: "AI assistants with specific roles. Each agent has its own memory, skills, and model configuration. Bind them to channels (Telegram/WhatsApp) so they can respond to messages.",
    commonProblems: [
      "Agent not responding to messages",
      "Agent using wrong model",
      "Agent missing skills"
    ],
    fixes: [
      "Check the agent's binding (see Bindings section)",
      "Verify the model is available in the Models section",
      "Run skill sync: openclaw skills sync",
      "Check agent's last session in Monitor tab"
    ]
  },
  telegram: {
    title: "Telegram Bots",
    description: "Bot accounts connected to Telegram. Each bot gets a token from @BotFather. Set DM policy (who can message the bot) and group policy (which groups the bot can join).",
    commonProblems: [
      "Bot not receiving messages",
      "Bot not responding in groups",
      "Token expired or invalid"
    ],
    fixes: [
      "Check bot is running in Monitor tab",
      "Regenerate token via @BotFather if needed",
      "Verify group policy is set to 'open' for group chats",
      "Restart gateway: openclaw gateway restart"
    ]
  },
  bindings: {
    title: "Bindings",
    description: "Routes messages to agents. When someone messages a Telegram bot or WhatsApp account, the binding tells OpenClaw which agent should handle it.",
    commonProblems: [
      "Messages going to wrong agent",
      "Agent not bound to any channel",
      "Duplicate bindings"
    ],
    fixes: [
      "Check binding matches the correct account ID",
      "Remove old bindings before creating new ones",
      "Verify channel is running in Monitor tab"
    ]
  },
  cron: {
    title: "Cron Jobs",
    description: "Scheduled tasks that run automatically. Use cron expressions (e.g. '0 9 * * *' = 9am daily) or intervals. Jobs can trigger agents to perform actions.",
    commonProblems: [
      "Job not running at scheduled time",
      "Job failing with errors",
      "Job running too frequently"
    ],
    fixes: [
      "Check cron expression format at crontab.guru",
      "Verify timezone is set (default: Europe/London)",
      "Check job status in logs: openclaw logs --json",
      "Restart gateway if jobs are stuck"
    ]
  },
  models: {
    title: "Models",
    description: "AI models available to agents. Ollama = local/cloud hybrid, Ollama2 = cloud-only. Different models have different strengths (coding, reasoning, speed).",
    commonProblems: [
      "Model timeout errors",
      "High token usage",
      "Model not responding"
    ],
    fixes: [
      "Switch to a lighter model (e.g. gemini-3-flash for speed)",
      "Reduce thinking level in agent config",
      "Check Ollama service is running",
      "Monitor token usage in Monitor tab"
    ]
  },
  monitor: {
    title: "Monitor",
    description: "Real-time view of gateway health, active sessions, channel status, and recent logs. Use this to diagnose issues.",
    commonProblems: [
      "Gateway showing errors",
      "Channel disconnected",
      "High memory usage"
    ],
    fixes: [
      "Restart gateway if errors persist",
      "Check Cloudflare tunnel is running",
      "Verify API servers are responding",
      "Kill stuck sessions if needed"
    ]
  }
}

export default function HelpTooltip({ section }: { section: string }) {
  const [show, setShow] = useState(false)
  const data = TOOLTIPS[section]
  if (!data) return null

  return (
    <div className="relative inline-block ml-2">
      <button 
        onClick={() => setShow(!show)}
        className="text-claw-muted hover:text-claw-highlight transition-colors"
      >
        <HelpCircle size={16} />
      </button>
      
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-claw-dark border border-claw-accent/30 rounded-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-claw-highlight">{data.title}</h3>
              <button onClick={() => setShow(false)} className="text-claw-muted hover:text-white">
                <X size={18} />
              </button>
            </div>
            
            <p className="text-sm text-claw-muted mb-4">{data.description}</p>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold text-red-400 uppercase mb-1">Common Problems</h4>
                <ul className="text-sm space-y-1">
                  {data.commonProblems.map((p, i) => (
                    <li key={i} className="text-claw-muted flex items-start gap-2">
                      <span className="text-red-400">⚠</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-xs font-bold text-green-400 uppercase mb-1">Fixes</h4>
                <ul className="text-sm space-y-1">
                  {data.fixes.map((f, i) => (
                    <li key={i} className="text-claw-muted flex items-start gap-2">
                      <span className="text-green-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}