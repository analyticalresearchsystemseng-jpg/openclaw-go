import express from 'express'
import { execSync } from 'child_process'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const app = express()
const PORT = process.env.PORT || 3456

app.use(cors())
app.use(express.json())

function run(cmd, opts = {}) {
  try {
    const output = execSync(cmd, { encoding: 'utf8', timeout: opts.timeout || 10000, ...opts })
    return { ok: true, output }
  } catch (e) {
    return { ok: false, error: e.message, stderr: e.stderr }
  }
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// Gateway status
app.get('/api/status', (_req, res) => {
  const r = run('openclaw status --json')
  if (!r.ok) return res.status(500).json({ error: r.error })
  try { res.json(JSON.parse(r.output)) } catch { res.json({ raw: r.output }) }
})

// Config get
app.get('/api/config', (req, res) => {
  const path = (req.query.path || '')
  const r = run(`openclaw config get ${path} --json`)
  if (!r.ok) return res.status(500).json({ error: r.error })
  try { res.json(JSON.parse(r.output)) } catch { res.json({ raw: r.output }) }
})

// Config patch — handles protected paths by trying CLI fallback
app.patch('/api/config', (req, res) => {
  const body = JSON.stringify(req.body)
  // Try config.patch first
  let r = run('openclaw config patch --json', { input: body })
  if (r.ok) {
    try { return res.json(JSON.parse(r.output)) } catch { return res.json({ ok: true }) }
  }
  // If protected paths error, try direct file edit for non-credential changes
  // For now, return the error and let frontend know it failed
  res.status(400).json({ error: r.error, protected: true })
})

// Channels add — handles protected botToken
app.post('/api/channels/add', (req, res) => {
  const { channel, token, account, name } = req.body
  const r = run(`openclaw channels add --channel ${channel} --token "${token}" --account ${account || 'default'}`, { timeout: 30000 })
  if (!r.ok) return res.status(500).json({ error: r.error })
  res.json({ ok: true, output: r.output })
})

// Channels remove
app.post('/api/channels/remove', (req, res) => {
  const { channel, account } = req.body
  const r = run(`openclaw channels remove --channel ${channel} --account ${account || 'default'}`)
  if (!r.ok) return res.status(500).json({ error: r.error })
  res.json({ ok: true })
})

// Agent bind
app.post('/api/agents/bind', (req, res) => {
  const { agent, channel, account } = req.body
  const bindStr = account ? `${channel}:${account}` : channel
  const r = run(`openclaw agents bind --agent ${agent} --bind ${bindStr}`)
  if (!r.ok) return res.status(500).json({ error: r.error })
  res.json({ ok: true })
})

// Agent unbind
app.post('/api/agents/unbind', (req, res) => {
  const { agent, channel, account } = req.body
  const bindStr = account ? `${channel}:${account}` : channel
  const r = run(`openclaw agents unbind --agent ${agent} --bind ${bindStr}`)
  if (!r.ok) return res.status(500).json({ error: r.error })
  res.json({ ok: true })
})

// Gateway restart
app.post('/api/gateway/restart', (_req, res) => {
  const r = run('openclaw gateway restart', { timeout: 30000 })
  if (!r.ok) return res.status(500).json({ error: r.error })
  res.json({ ok: true })
})

// Sessions list
app.get('/api/sessions', (_req, res) => {
  const r = run('openclaw sessions --json')
  if (!r.ok) return res.status(500).json({ error: r.error })
  try { res.json(JSON.parse(r.output)) } catch { res.json({ raw: r.output }) }
})

// Channels status
app.get('/api/channels', (_req, res) => {
  const r = run('openclaw channels status --json')
  if (!r.ok) return res.status(500).json({ error: r.error })
  try { res.json(JSON.parse(r.output)) } catch { res.json({ raw: r.output }) }
})

// Logs
app.get('/api/logs', (_req, res) => {
  const r = run('openclaw logs --json --limit 100')
  if (!r.ok) return res.status(500).json({ error: r.error })
  try {
    const lines = r.output.trim().split('\n').filter(Boolean)
    const data = lines.map(l => JSON.parse(l)).filter(e => e.type === 'log')
    res.json(data)
  } catch { res.json([]) }
})

// Cron list
app.get('/api/cron', (_req, res) => {
  const r = run('openclaw cron list --json')
  if (!r.ok) return res.status(500).json({ error: r.error })
  try { res.json(JSON.parse(r.output)) } catch { res.json({ jobs: [] }) }
})

// Cron add — construct proper CLI command
app.post('/api/cron/add', (req, res) => {
  const { name, schedule, command } = req.body
  
  // Parse schedule into CLI flags
  let scheduleFlags = ''
  if (schedule.includes(' ')) {
    // It's a cron expression like "0 9 * * *"
    scheduleFlags = `--cron "${schedule}" --tz Europe/London`
  } else if (schedule.startsWith('*/')) {
    // It's an interval like "*/30 * * * *" — convert to minutes
    const parts = schedule.split(' ')
    const minutes = parseInt(parts[0].replace('*/', ''))
    scheduleFlags = `--every ${minutes}m`
  } else {
    scheduleFlags = `--cron "${schedule}" --tz Europe/London`
  }
  
  // Build the command with proper escaping
  const cmd = `openclaw cron add --name "${name}" ${scheduleFlags} --message "${command.replace(/"/g, '\\"')}" --session isolated`
  const r = run(cmd, { timeout: 15000 })
  if (!r.ok) return res.status(500).json({ error: r.error })
  res.json({ ok: true })
})

// Cron remove
app.post('/api/cron/remove', (req, res) => {
  const { id } = req.body
  const r = run(`openclaw cron remove ${id}`)
  if (!r.ok) return res.status(500).json({ error: r.error })
  res.json({ ok: true })
})

// Agent list
app.get('/api/agents', (_req, res) => {
  const r = run('openclaw config get agents.list --json')
  if (!r.ok) return res.status(500).json({ error: r.error })
  try { res.json(JSON.parse(r.output)) } catch { res.json([]) }
})

// Model providers
app.get('/api/models', (_req, res) => {
  const r = run('openclaw config get models.providers --json')
  if (!r.ok) return res.status(500).json({ error: r.error })
  try { res.json(JSON.parse(r.output)) } catch { res.json({}) }
})

// Serve static PWA files with cache busting
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  next()
})
app.use(express.static(join(__dirname, '../dist')))
app.use((_req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`OpenClaw Mobile API on http://0.0.0.0:${PORT}`)
})
