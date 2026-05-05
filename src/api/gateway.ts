// OpenClaw Gateway WebSocket API Client

let ws: WebSocket | null = null
let reqId = 0
const pending = new Map()

export function connect(url: string, token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(url)
    
    ws.onopen = () => {
      // Authenticate
      send('auth', { token }).then(() => resolve()).catch(reject)
    }
    
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      const { id, result, error } = data
      if (pending.has(id)) {
        const { resolve, reject } = pending.get(id)
        pending.delete(id)
        error ? reject(error) : resolve(result)
      }
    }
    
    ws.onerror = (e) => reject(e)
    ws.onclose = () => {
      ws = null
      pending.forEach(({ reject }) => reject(new Error('Connection closed')))
      pending.clear()
    }
  })
}

function send(method: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      reject(new Error('Not connected'))
      return
    }
    const id = ++reqId
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

export const api = {
  status: () => send('status', {}),
  configGet: (path: string) => send('config.get', { path }),
  configPatch: (patch: any) => send('config.patch', patch),
  agentList: () => send('agents.list', {}),
  agentRestart: (agentId: string) => send('agents.restart', { id: agentId }),
  agentStop: (agentId: string) => send('agents.stop', { id: agentId }),
  agentStart: (agentId: string, options?: any) => send('agents.start', { id: agentId, ...options }),
  agentStatus: (agentId: string) => send('agents.status', { id: agentId }),
  gatewayRestart: (note?: string) => send('gateway.restart', { note }),
  sessions: () => send('sessions.list', {}),
  channels: () => send('channels.status', {}),
  logs: (limit = 50) => send('logs', { limit }),
  cronList: () => send('cron.list', {}),
  cronEdit: (id: string, patch: any) => send('cron.edit', { id, ...patch }),
  cronEnable: (id: string) => send('cron.enable', { id }),
  cronDisable: (id: string) => send('cron.disable', { id }),
  cronRemove: (id: string) => send('cron.rm', { id }),
  cronRun: (id: string) => send('cron.run', { id }),
}

export function disconnect() {
  ws?.close()
  ws = null
}
