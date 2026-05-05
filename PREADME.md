# OpenClaw Mobile — iOS PWA

## Objective
A Progressive Web App for managing OpenClaw from an iPhone. Simple, human-friendly interface with Basic and Advanced modes.

## User
Neil Ross — managing his personal OpenClaw setup

## Access
Tailscale (WSL + iPhone on same tailnet) → connects to gateway at tailnet IP:18789

## Stack
- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui components
- PWA (manifest, service worker, add-to-home-screen)
- WebSocket connection to gateway

## Architecture
1. **Gateway API Client** — WebSocket wrapper for config get/patch, status, sessions, logs
2. **Config Manager** — Basic mode (common settings) + Advanced mode (raw config tree)
3. **Agent Manager** — CRUD agents, skills assignment, model selection
4. **Channel Manager** — Telegram/WhatsApp account setup, group management
5. **Session Monitor** — Live session list, kill/stop sessions
6. **Gateway Status** — Health, version, uptime, restart controls
7. **Help System** — Info popups on every field explaining what it does

## API Endpoints (via gateway WS)
- `config.get` — read config by path
- `config.patch` — write non-protected config
- `status` — full status dump
- `sessions.list` — active sessions
- `gateway.restart` — restart gateway
- `channels.status` — channel health
- `logs` — tail logs

## Protected Paths (CLI proxy needed)
- `channels.telegram.accounts.*.botToken`
- `agents.list[].agentDir`
- `bindings`
- `gateway.auth.token`
- etc.

## MVP First
1. Gateway status + restart
2. Agent list + basic config (name, model)
3. Channel status overview
4. Sessions list + kill
5. Basic config editor with help text

## Full Feature Set
- Agent CRUD with skills picker
- Telegram account management (add/remove)
- Model provider config
- Skills toggle
- Bindings editor
- Cron job viewer
- Logs viewer with filtering
- Gateway config (basic mode)

## Security
- Gateway auth token stored in Secure Storage (Capacitor if native, localStorage+encryption if PWA)
- Only connects over Tailscale (no public exposure)
- Token never logged or transmitted outside tailnet

## Files
- `/home/aiagent/.openclaw/workspace/projects/openclaw-mobile/` — project root
- Built with `npm run build` → `dist/` served via static server
