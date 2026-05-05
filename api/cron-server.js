/**
 * OpenClaw Cron API Server
 * Bridges CLI commands to HTTP REST API for the PWA
 */

const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const cors = require('cors');

const execAsync = promisify(exec);
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.CRON_API_PORT || 3459;

// Helper to run openclaw commands
async function runOpenClaw(args) {
  const cmd = `openclaw ${args}`;
  try {
    const { stdout, stderr } = await execAsync(cmd, { timeout: 10000 });
    return { success: true, output: stdout || stderr };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
}

// List all cron jobs
app.get('/api/cron', async (req, res) => {
  const result = await runOpenClaw('cron list');
  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }
  
  // Parse the table output into structured data
  const lines = result.output.split('\n').filter(l => l.trim());
  const jobs = [];
  
  // Skip header lines and parse job rows
  let inTable = false;
  for (const line of lines) {
    if (line.includes('ID') && line.includes('Name')) {
      inTable = true;
      continue;
    }
    if (inTable && line.match(/^[a-f0-9-]+/)) {
      const parts = line.split(/\s{2,}/);
      if (parts.length >= 2) {
        jobs.push({
          id: parts[0].trim(),
          name: parts[1]?.trim() || 'unnamed',
          schedule: parts[2]?.trim() || '',
          next: parts[3]?.trim() || '',
          last: parts[4]?.trim() || '',
          status: parts[5]?.trim() || '',
        });
      }
    }
  }
  
  res.json({ jobs });
});

// Edit a cron job
app.post('/api/cron/:id/edit', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  let cmd = `cron edit ${id}`;
  if (updates.name) cmd += ` --name "${updates.name}"`;
  if (updates.schedule) cmd += ` --cron "${updates.schedule}"`;
  if (updates.description) cmd += ` --description "${updates.description}"`;
  if (updates.enabled === false) cmd += ' --disable';
  if (updates.enabled === true) cmd += ' --enable';
  
  const result = await runOpenClaw(cmd);
  res.json(result);
});

// Enable a cron job
app.post('/api/cron/:id/enable', async (req, res) => {
  const result = await runOpenClaw(`cron enable ${req.params.id}`);
  res.json(result);
});

// Disable a cron job
app.post('/api/cron/:id/disable', async (req, res) => {
  const result = await runOpenClaw(`cron disable ${req.params.id}`);
  res.json(result);
});

// Remove a cron job
app.delete('/api/cron/:id', async (req, res) => {
  const result = await runOpenClaw(`cron rm ${req.params.id}`);
  res.json(result);
});

// Run a cron job now
app.post('/api/cron/:id/run', async (req, res) => {
  const result = await runOpenClaw(`cron run ${req.params.id}`);
  res.json(result);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'cron-api' });
});

app.listen(PORT, () => {
  console.log(`[Cron API] Server running on port ${PORT}`);
  console.log(`[Cron API] Endpoints:`);
  console.log(`  GET  /api/cron           - List jobs`);
  console.log(`  POST /api/cron/:id/edit  - Edit job`);
  console.log(`  POST /api/cron/:id/enable - Enable job`);
  console.log(`  POST /api/cron/:id/disable - Disable job`);
  console.log(`  DELETE /api/cron/:id     - Remove job`);
  console.log(`  POST /api/cron/:id/run   - Run job now`);
});
