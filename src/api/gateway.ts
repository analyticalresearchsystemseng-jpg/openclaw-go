// OpenClaw Gateway WebSocket API Client

let ws: WebSocket | null = null
let reqId = 0
const pending = new Map()
let messageHandler: ((data: any) => void) | null = null

export function connect(url: string, token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(url)
    
    ws.onopen = () => {
      send('auth', { token }).then(() => resolve()).catch(reject)
    }
    
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        const { id, result, error } = data
        
        // Handle incoming chat messages
        if (messageHandler && (data.type === 'chat' || data.method === 'chat.message')) {
          messageHandler(data)
        }
        
        if (pending.has(id)) {
          const { resolve, reject } = pending.get(id)
          pending.delete(id)
          error ? reject(error) : resolve(result)
        }
      } catch (e) {
        console.error('WebSocket message error:', e)
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
  
  // Agents
  agentList: () => send('agents.list', {}),
  agentRestart: (agentId: string) => send('agents.restart', { id: agentId }),
  agentStop: (agentId: string) => send('agents.stop', { id: agentId }),
  agentStart: (agentId: string, options?: any) => send('agents.start', { id: agentId, ...options }),
  agentStatus: (agentId: string) => send('agents.status', { id: agentId }),
  
  // Gateway
  gatewayRestart: (note?: string) => send('gateway.restart', { note }),
  
  // Sessions
  sessions: () => send('sessions.list', {}),
  sessionKill: (sessionId: string) => send('sessions.kill', { id: sessionId }),
  
  // Channels
  channels: () => send('channels.status', {}),
  
  // Logs
  logs: (limit = 50) => send('logs', { limit }),
  
  // Cron
  cronList: () => send('cron.list', {}),
  cronEdit: (id: string, patch: any) => send('cron.edit', { id, ...patch }),
  cronEnable: (id: string) => send('cron.enable', { id }),
  cronDisable: (id: string) => send('cron.disable', { id }),
  cronRemove: (id: string) => send('cron.rm', { id }),
  cronRun: (id: string, sensorData?: any) => send('cron.run', { id, sensorData }),
  cronTrigger: (id: string, trigger: string, data?: any) => send('cron.trigger', { id, trigger, data }),
  
  // Files
  fileList: (path: string) => send('file.list', { path }),
  fileRead: (path: string) => send('file.read', { path }),
  fileWrite: (path: string, content: string) => send('file.write', { path, content }),
  fileCreate: (path: string, content?: string) => send('file.create', { path, content }),
  fileDelete: (path: string) => send('file.rm', { path }),
  
  // Chat
  chatList: (limit = 50) => send('chat.list', { limit }),
  chatSend: (message: string, channel?: string) => send('chat.send', { message, channel }),
  onChatMessage: (handler: (data: any) => void) => {
    messageHandler = handler
    return () => { messageHandler = null }
  },
  
  // Sensors (triggered from phone)
  sensorEvent: (sensor: string, data: any) => send('sensor.event', { sensor, data }),
  
  // Skills
  skillsList: (agentId: string) => send('skills.list', { agentId }),
  skillEnable: (agentId: string, skillId: string) => send('skills.enable', { agentId, skillId }),
  skillDisable: (agentId: string, skillId: string) => send('skills.disable', { agentId, skillId }),
  skillStatus: (agentId: string) => send('skills.status', { agentId }),
  notificationDismiss: (id: string) => send('notification.dismiss', { id }),
}

export function disconnect() {
  ws?.close()
  ws = null
}
