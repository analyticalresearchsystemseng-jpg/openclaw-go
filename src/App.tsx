import { useState, useEffect } from 'react'
import { Home, Settings, Sliders, Activity, Wrench, Smartphone, Clock, Shield, Users, MessageSquare, LogOut, Bell, FileText, MessageCircle, Menu, X, GripVertical } from 'lucide-react'
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
import TabCustomizer from './components/TabCustomizer'
import { disconnect } from './api/gateway'

export type Tab = 'home' | 'setup' | 'monitor' | 'troubleshoot' | 'sessions' | 'channels' | 'sensors' | 'cron' | 'files' | 'chat' | 'admin' | 'notifications' | 'settings'

const ALL_TABS: { id: Tab; label: string; icon: any }[] = [
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

const DEFAULT_BOTTOM_TABS: Tab[] = ['home', 'chat', 'admin', 'cron', 'settings']

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [loggedIn, setLoggedIn] = useState(false)
  const [config, setConfig] = useState<{ gatewayUrl: string; authToken: string } | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [bottomTabs, setBottomTabs] = useState<Tab[]>(DEFAULT_BOTTOM_TABS)

  useEffect(() => {
    checkSavedCredentials()
    loadBottomTabs()
  }, [])

  async function checkSavedCredentials() {
    const { value: url } = await Preferences.get({ key: 'gatewayUrl' })
    const { value: token } = await Preferences.get({ key: 'authToken' })
    if (url && token) handleLogin(url, token)
  }

  async function loadBottomTabs() {
    const { value } = await Preferences.get({ key: 'bottomTabs' })
    if (value) {
      setBottomTabs(JSON.parse(value))
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

  function handleBottomTabsChange(newTabs: string[]) {
    setBottomTabs(newTabs as Tab[])
    setShowCustomizer(false)
  }

  function switchTab(newTab: Tab) {
    setTab(newTab)
    setDrawerOpen(false)
  }

  function getTabInfo(id: Tab) {
    return ALL_TABS.find(t => t.id === id)!
  }

  // Tabs that appear in drawer (everything except bottom tabs)
  const drawerTabs = ALL_TABS.filter(t => !bottomTabs.includes(t.id))

  if (!loggedIn) return <Login onLogin={handleLogin} />

  if (showCustomizer) {
    return <TabCustomizer onSave={handleBottomTabsChange} />
  }

  return (
    <div className="h-screen flex flex-col bg-claw-dark">
      {/* Header with drawer toggle */}
      <header className="flex items-center justify-between p-3 border-b border-claw-accent/30">
        <button 
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="p-2 text-claw-muted hover:text-claw-highlight"
        >
          {drawerOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="font-semibold text-lg">{getTabInfo(tab).label}</h1>
        <div className="w-10" />
      </header>

      {/* Drawer */}
      {drawerOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-claw-card z-50 shadow-xl flex flex-col">
            <div className="p-4 border-b border-claw-accent/30">
              <div className="flex items-center gap-2">
                <Shield size={24} className="text-claw-primary" />
                <div>
                  <h2 className="font-bold text-lg">OpenClaw Go</h2>
                  <p className="text-xs text-claw-muted truncate">{config?.gatewayUrl}</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto py-2">
              <div className="px-4 py-2 text-xs text-claw-muted uppercase tracking-wide">
                Menu
              </div>
              
              {drawerTabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => switchTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    tab === id ? 'bg-claw-primary/10 text-claw-primary' : 'text-claw-muted hover:bg-claw-dark'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{label}</span>
                </button>
              ))}

              <div className="mt-4 px-4 py-2 text-xs text-claw-muted uppercase tracking-wide">
                Options
              </div>

              <button
                onClick={() => {
                  setDrawerOpen(false)
                  setShowCustomizer(true)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-claw-muted hover:bg-claw-dark"
              >
                <GripVertical size={20} />
                <span className="font-medium">Customize Tabs</span>
              </button>
            </div>

            <div className="p-4 border-t border-claw-accent/30">
              <button
                onClick={() => {
                  handleLogout()
                  setDrawerOpen(false)
                }}
                className="flex items-center gap-2 text-red-400 text-sm"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {tab === 'home' && <HomePage />}
        {tab === 'setup' && <SetupPage />}
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

      {/* Bottom Nav (Customizable) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-claw-card border-t border-claw-accent/30 px-2 py-1">
        <div className="flex justify-around items-center">
          {bottomTabs.map((tabId) => {
            const tabInfo = getTabInfo(tabId)
            const Icon = tabInfo.icon
            return (
              <button
                key={tabId}
                onClick={() => setTab(tabId)}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors min-w-[60px] ${
                  tab === tabId && !drawerOpen
                    ? 'text-claw-primary' 
                    : 'text-claw-muted hover:text-claw-highlight'
                }`}
              >
                <Icon size={22} />
                <span className="text-[10px] mt-0.5">{tabInfo.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
