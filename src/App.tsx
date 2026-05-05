import { useState, useEffect } from 'react'
import { Home, Settings, Sliders, Activity, Wrench, Smartphone, Clock, Shield, Users, MessageSquare, LogOut, Bell, FileText, MessageCircle } from 'lucide-react'
import { Preferences } from '@capacitor/preferences'
import HomePage from './pages/HomePage'
import SetupPage from './pages/SetupPage'
import MonitorPage from './pages/MonitorPage'
import TroubleshootPage from './pages/TroubleshootPage'
import SettingsPage from './pages/SettingsPage'
import Sensors from './pages/Sensors'
import Cron from './pages/Cron'
import Admin from './pages/Admin'
import Sessions from './pages/Sessions'
import Channels from './pages/Channels'
import Notifications from './pages/Notifications'
import Files from './pages/Files'
import Chat from './pages/Chat'
import Login from './pages/Login'
import { disconnect } from './api/gateway'

type Tab = 'home' | 'setup' | 'monitor' | 'troubleshoot' | 'sessions' | 'channels' | 'sensors' | 'cron' | 'files' | 'chat' | 'admin' | 'notifications' | 'settings'

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'setup', label: 'Setup', icon: Sliders },
  { id: 'monitor', label: 'Monitor', icon: Activity },
  { id: 'troubleshoot', label: 'Fix', icon: Wrench },
  { id: 'sessions', label: 'Sessions', icon: Users },
  { id: 'channels', label: 'Channels', icon: MessageSquare },
  { id: 'sensors', label: 'Sensors', icon: Smartphone },
  { id: 'cron', label: 'Cron', icon: Clock },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'admin', label: 'Admin', icon: Shield },
  { id: 'notifications', label: 'Alerts', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
]

// Error Boundary Component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)
  if (hasError) {
    return (
      <div className="p-4">
        <div className="card bg-red-50 text-red-600">
          <p>Something went wrong loading this page.</p>
          <button onClick={() => setHasError(false)} className="mt-2 text-sm underline">
            Try again
          </button>
        </div>
      </div>
    )
  }
  return <>{children}</>
}

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [loggedIn, setLoggedIn] = useState(false)
  const [config, setConfig] = useState<{ gatewayUrl: string; authToken: string } | null>(null)

  // Check for saved credentials on mount
  useEffect(() => {
    checkSavedCredentials()
  }, [])

  async function checkSavedCredentials() {
    const { value: url } = await Preferences.get({ key: 'gatewayUrl' })
    const { value: token } = await Preferences.get({ key: 'authToken' })
    
    if (url && token) {
      handleLogin(url, token)
    }
  }

  function handleLogin(url: string, token: string) {
    setConfig({ gatewayUrl: url, authToken: token })
    setLoggedIn(true)
  }

  async function handleLogout() {
    await Preferences.remove({ key: 'gatewayUrl' })
    await Preferences.remove({ key: 'authToken' })
    disconnect()
    setLoggedIn(false)
    setConfig(null)
  }

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="h-screen flex flex-col bg-claw-dark">
      <main className="flex-1 overflow-y-auto pb-24">
        {tab === 'home' && <HomePage />}
        {tab === 'setup' && <ErrorBoundary><SetupPage /></ErrorBoundary>}
        {tab === 'monitor' && <MonitorPage />}
        {tab === 'troubleshoot' && <TroubleshootPage />}
        {tab === 'sessions' && <Sessions />}
        {tab === 'channels' && <Channels />}
        {tab === 'sensors' && <Sensors />}
        {tab === 'cron' && <Cron />}
        {tab === 'files' && <Files />}
        {tab === 'chat' && <Chat />}
        {tab === 'admin' && <Admin />}
        {tab === 'notifications' && <Notifications />}
        {tab === 'settings' && <SettingsPage onLogout={handleLogout} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-claw-card border-t border-claw-accent/30 px-2 py-1">
        <div className="flex justify-around items-center">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                tab === id
                  ? 'text-claw-primary'
                  : 'text-claw-muted hover:text-claw-highlight'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] mt-0.5">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
