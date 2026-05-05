import ErrorBoundary from './components/ErrorBoundary'

import { useState } from 'react'
import { Home, Settings, Sliders, Activity, Wrench, Smartphone, Clock, Shield } from 'lucide-react'
import HomePage from './pages/HomePage'
import SetupPage from './pages/SetupPage'
import MonitorPage from './pages/MonitorPage'
import TroubleshootPage from './pages/TroubleshootPage'
import SettingsPage from './pages/SettingsPage'
import Sensors from './pages/Sensors'
import Cron from './pages/Cron'

import Admin from './pages/Admin'

type Tab = 'home' | 'setup' | 'monitor' | 'troubleshoot' | 'sensors' | 'cron' | 'admin' | 'settings'

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'setup', label: 'Setup', icon: Sliders },
  { id: 'monitor', label: 'Monitor', icon: Activity },
  { id: 'troubleshoot', label: 'Fix', icon: Wrench },
  { id: 'sensors', label: 'Sensors', icon: Smartphone },
  { id: 'cron', label: 'Cron', icon: Clock },
  { id: 'admin', label: 'Admin', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('home')

  return (
    <div className="h-screen flex flex-col bg-claw-dark">
      <header className="px-4 py-3 border-b border-claw-accent/30 flex items-center justify-between">
        <h1 className="text-lg font-bold text-claw-highlight">OpenClaw</h1>
        <span className="text-xs text-claw-muted">Mobile</span>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {tab === 'home' && <HomePage />}
        {tab === 'setup' && <ErrorBoundary><SetupPage /></ErrorBoundary>}
        {tab === 'monitor' && <MonitorPage />}
        {tab === 'troubleshoot' && <TroubleshootPage />}
        {tab === 'sensors' && <Sensors />}
        {tab === 'cron' && <Cron />}
        {tab === 'admin' && <Admin />}
        {tab === 'settings' && <SettingsPage />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-claw-card border-t border-claw-accent/30 px-4 py-2">
        <div className="flex justify-around">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-1 text-xs ${tab === id ? 'text-claw-highlight' : 'text-claw-muted'}`}
            >
              <Icon size={22} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
