import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET() {
  try {
    const { stdout } = await execAsync('openclaw cron list --json')
    const jobs = JSON.parse(stdout)
    return Response.json({ jobs })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { action, id, ...data } = await request.json()
  
  try {
    let cmd = ''
    switch (action) {
      case 'edit':
        cmd = `openclaw cron edit ${id} ${Object.entries(data).map(([k, v]) => `--${k} "${v}"`).join(' ')}`
        break
      case 'enable':
        cmd = `openclaw cron enable ${id}`
        break
      case 'disable':
        cmd = `openclaw cron disable ${id}`
        break
      case 'remove':
        cmd = `openclaw cron rm ${id}`
        break
      case 'run':
        cmd = `openclaw cron run ${id}`
        break
    }
    
    const { stdout, stderr } = await execAsync(cmd)
    return Response.json({ success: true, output: stdout || stderr })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
