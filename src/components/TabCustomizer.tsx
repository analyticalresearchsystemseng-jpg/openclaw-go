import { useState, useEffect } from 'react'
import { GripVertical, Plus, X, Save, Home, Settings, Sliders, Activity, Wrench, Smartphone, Clock, Shield, Users, MessageSquare, Bell, FileText, MessageCircle } from 'lucide-react'
import { Preferences } from '@capacitor/preferences'

const ALL_TABS = [
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

const DEFAULT_BOTTOM_TABS = ['home', 'chat', 'admin', 'cron', 'settings']

interface TabCustomizerProps {
  onSave: (bottomTabs: string[]) => void
}

export default function TabCustomizer({ onSave }: TabCustomizerProps) {
  const [bottomTabs, setBottomTabs] = useState<string[]>(DEFAULT_BOTTOM_TABS)
  const [availableTabs, setAvailableTabs] = useState<string[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSavedTabs()
  }, [])

  async function loadSavedTabs() {
    const { value } = await Preferences.get({ key: 'bottomTabs' })
    if (value) {
      const saved = JSON.parse(value)
      setBottomTabs(saved)
      updateAvailable(saved)
    } else {
      updateAvailable(DEFAULT_BOTTOM_TABS)
    }
  }

  function updateAvailable(currentBottom: string[]) {
    const available = ALL_TABS
      .map(t => t.id)
      .filter(id => !currentBottom.includes(id))
    setAvailableTabs(available)
  }

  function addToBottom(tabId: string) {
    if (bottomTabs.length >= 5) {
      alert('Maximum 5 tabs in bottom nav')
      return
    }
    const newBottom = [...bottomTabs, tabId]
    setBottomTabs(newBottom)
    updateAvailable(newBottom)
  }

  function removeFromBottom(index: number) {
    const newBottom = bottomTabs.filter((_, i) => i !== index)
    setBottomTabs(newBottom)
    updateAvailable(newBottom)
  }

  function moveTab(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === bottomTabs.length - 1) return
    
    const newBottom = [...bottomTabs]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[newBottom[index], newBottom[swapIndex]] = [newBottom[swapIndex], newBottom[index]]
    setBottomTabs(newBottom)
  }

  async function saveTabs() {
    await Preferences.set({ key: 'bottomTabs', value: JSON.stringify(bottomTabs) })
    onSave(bottomTabs)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function getTabInfo(id: string) {
    return ALL_TABS.find(t => t.id === id)!
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Customize Tabs</h2>
        <button
          onClick={saveTabs}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium ${
            saved 
              ? 'bg-green-600 text-white' 
              : 'bg-claw-primary text-white'
          }`}
        >
          <Save size={16} />
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-claw-muted">Bottom Navigation (max 5)</p>
        <div className="space-y-2">
          {bottomTabs.map((tabId, index) => {
            const tab = getTabInfo(tabId)
            const Icon = tab.icon
            return (
              <div
                key={tabId}
                className="flex items-center gap-3 p-3 bg-claw-card rounded-lg"
              >
                <GripVertical size={16} className="text-claw-muted" />
                <Icon size={20} className="text-claw-primary" />
                <span className="flex-1 font-medium">{tab.label}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => moveTab(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-claw-muted disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveTab(index, 'down')}
                    disabled={index === bottomTabs.length - 1}
                    className="p-1 text-claw-muted disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeFromBottom(index)}
                    className="p-1 text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {bottomTabs.length < 5 && (
          <div className="text-sm text-claw-muted">
            {5 - bottomTabs.length} slot{5 - bottomTabs.length !== 1 ? 's' : ''} remaining
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-claw-muted">Available Tabs</p>
        <div className="grid grid-cols-3 gap-2">
          {availableTabs.map(tabId => {
            const tab = getTabInfo(tabId)
            const Icon = tab.icon
            return (
              <button
                key={tabId}
                onClick={() => addToBottom(tabId)}
                className="flex items-center gap-2 p-2 bg-claw-dark rounded-lg text-sm hover:bg-claw-card transition-colors"
              >
                <Plus size={14} className="text-green-500" />
                <Icon size={16} className="text-claw-muted" />
                <span className="truncate">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="text-xs text-claw-muted space-y-1">
        <p>💡 Drag ↑↓ to reorder</p>
        <p>💡 Tap + to add to bottom nav</p>
        <p>💡 All other tabs appear in the side drawer</p>
      </div>
    </div>
  )
}
