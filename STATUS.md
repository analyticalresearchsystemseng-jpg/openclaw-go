# OpenClaw Mobile — Build Status

## ✅ Working Now
- Dashboard with real gateway status (version, latency, agents, sessions)
- Agents page with CRUD (create, edit, skills toggle, model picker)
- Channels page with Telegram account wizard (step-by-step setup)
- Bindings editor (add/remove channel-to-agent routes)
- Sessions list with token usage
- Logs viewer (last 100 entries, color-coded)
- Settings (Basic/Advanced toggle, gateway URL, auth token)
- Help popups on every field
- Dark theme, mobile-optimized, bottom nav

## 🔧 Built but needs testing
- Cron job page (placeholder — needs cron API access)
- Real-time log streaming (static fetch only)
- Agent creation editing (UI done, needs protected path handling)

## 🚧 Not yet built
- Model provider config page (can be added to Settings)
- WhatsApp account setup wizard (similar to Telegram)
- Skills toggle panel (partially in Agents edit)

## 🌐 Access
- API server running on port 3456
- PWA built in dist/ folder
- Access via: http://aihome-1:3456 (Tailscale)
- Or: http://172.25.128.41:3456 (same WiFi)

## 📱 To use on iPhone
1. Open http://aihome-1:3456 in Safari
2. Tap Share → Add to Home Screen
3. Full-screen PWA experience

## 🔒 Known Limitations
- Protected config paths (bot tokens, bindings) show CLI fallback commands
- Some settings require running `openclaw` CLI commands in WSL
- Cron jobs can't be created via API — CLI only
