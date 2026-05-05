/**
 * OpenClaw Cron API Proxy
 * Bridges the PWA to OpenClaw's CLI via a simple HTTP server
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import express from 'express'
import cors from 'cors'

const execAsync = promisify(exec)
const app = express()
const PORT = process.env.PORT || 3459

app.use(cors())
app.use(express.json())

// Helper to run openclaw commands
async function runOpenClaw(args) {
  const cmd = `openclaw ${args}`
  try {
    const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 })
    return { success: true, output: stdout || stderr }
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr }
  }
}

// GET /api/cron - List all jobs
app.get('/api/cron', async (req, res) => {
  const result = await runOpenClaw('cron list --json')
  if (!result.success) {
    return res.status(500).json({ error: result.error, output: result.output })
  }
  
  try {
    const jobs = JSON.parse(result.output)
    res.json({ jobs })
  } catch (e) {
    res.status(500).json({ error: 'Failed to parse cron output', output: result.output })
  }
})

// POST /api/cron/:id/edit - Edit a job
app.post('/api/cron/:id/edit', async (req, res) => {
  const { id } = req.params
  const { name, schedule, description, enabled } = req.body
  
  let cmd = `cron edit ${id}`
  if (name) cmd += ` --name "${name}"`
  if (schedule) cmd += ` --schedule "${schedule}"`
  if (description) cmd += ` --description "${description}"`
  if (enabled === true) cmd += ' --enable'
  if (enabled === false) cmd += ' --disable'
  
  const result = await runOpenClaw(cmd)
  res.json(result)
})

// POST /api/cron/:id/enable - Enable a job
app.post('/api/cron/:id/enable', async (req, res) => {
  const result = await runOpenClaw(`cron enable ${req.params.id}`)
  res.json(result)
})

// POST /api/cron/:id/disable - Disable a job
app.post('/api/cron/:id/disable', async (req, res) => {
  const result = await runOpenClaw(`cron disable ${req.params.id}`)
  res.json(result)
})

// DELETE /api/cron/:id - Remove a job
app.delete('/api/cron/:id', async (req, res) => {
  const result = await runOpenClaw(`cron rm ${req.params.id}`)
  res.json(result)
})

// POST /api/cron/:id/run - Run a job now
app.post('/api/cron/:id/run', async (req, res) => {
  const result = await runOpenClaw(`cron run ${req.params.id}`)
  res.json(result)
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'openclaw-cron-api', version: '1.0.0' })
})

app.listen(PORT, () => {
  console.log(`[OpenClaw Cron API] Server running on port ${PORT}`)
  console.log(`[OpenClaw Cron API] Endpoints:`)
  console.log(`  GET    /api/cron           - List jobs`)
  console.log(`  POST   /api/cron/:id/edit  - Edit job`)
  console.log(`  POST   /api/cron/:id/enable - Enable job`)
  console.log(`  POST   /api/cron/:id/disable - Disable job`)
  console.log(`  DELETE /api/cron/:id       - Remove job`)
  console.log(`  POST   /api/cron/:id/run    - Run job now`)
})
