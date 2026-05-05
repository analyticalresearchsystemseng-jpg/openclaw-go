import { useState, useEffect } from 'react'
import { Bell, CheckCircle, XCircle, AlertTriangle, Server, Activity } from 'lucide-react'
import { PushNotifications } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'

interface AlertConfig {
  gatewayDown: boolean
  agentError: boolean
  buildFailed: boolean
  dailyDigest: boolean
}

export default function Notifications() {
  const [pushEnabled, setPushEnabled] = useState(false)
  const [alerts, setAlerts] = useState<AlertConfig>({
    gatewayDown: true,
    agentError: true,
    buildFailed: true,
    dailyDigest: false,
  })
  const [testSent, setTestSent] = useState(false)

  useEffect(() => {
    checkPushStatus()
  }, [])

  async function checkPushStatus() {
    try {
      const result = await PushNotifications.checkPermissions()
      setPushEnabled(result.receive === 'granted')
    } catch (e) {
      console.log('Push notifications not available')
    }
  }

  async function enablePush() {
    try {
      const result = await PushNotifications.requestPermissions()
      if (result.receive === 'granted') {
        await PushNotifications.register()
        setPushEnabled(true)
        
        // Listen for push
        PushNotifications.addListener('registration', (token) => {
          console.log('Push token:', token.value)
          // TODO: Send token to your server
        })
        
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received:', notification)
        })
      }
    } catch (e) {
      alert('Push notifications not available on this device')
    }
  }

  async function sendTestNotification() {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'OpenClaw Go',
            body: 'Test notification from OpenClaw!',
            id: 1,
            schedule: { at: new Date(Date.now() + 1000) }
          }
        ]
      })
      setTestSent(true)
      setTimeout(() => setTestSent(false), 3000)
    } catch (e) {
      alert('Local notifications not available')
    }
  }

  function toggleAlert(key: keyof AlertConfig) {
    setAlerts(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Notifications</h2>
        <Bell size={20} className="text-claw-primary" />
      </div>

      {/* Push Status */}
      <div className="card space-y-3">
        <div className="flex items-center gap-3">
          {pushEnabled ? (
            <CheckCircle size={24} className="text-green-500" />
          ) : (
            <XCircle size={24} className="text-gray-400" />
          )}
          <div>
            <h3 className="font-semibold">
              {pushEnabled ? 'Push Enabled' : 'Push Disabled'}
            </h3>
            <p className="text-xs text-claw-muted">
              {pushEnabled 
                ? "You'll receive alerts when things go wrong"
                : "Enable to get alerts on your phone"}
            </p>
          </div>
        </div>

        {!pushEnabled && (
          <button
            onClick={enablePush}
            className="w-full py-3 bg-claw-primary text-white rounded-lg font-semibold"
          >
            Enable Push Notifications
          </button>
        )}

        <button
          onClick={sendTestNotification}
          disabled={testSent}
          className="w-full py-2 bg-claw-accent text-white rounded-lg text-sm disabled:opacity-50"
        >
          {testSent ? 'Test Sent!' : 'Send Test Notification'}
        </button>
      </div>

      {/* Alert Settings */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">
          Alert Types
        </h3>

        <div className="card space-y-4">
          <AlertToggle
            icon={Server}
            label="Gateway Down"
            description="When OpenClaw gateway stops responding"
            enabled={alerts.gatewayDown}
            onToggle={() => toggleAlert('gatewayDown')}
          />

          <AlertToggle
            icon={AlertTriangle}
            label="Agent Errors"
            description="When agents crash or hit rate limits"
            enabled={alerts.agentError}
            onToggle={() => toggleAlert('agentError')}
          />

          <AlertToggle
            icon={Activity}
            label="Build Failures"
            description="When GitHub Actions builds fail"
            enabled={alerts.buildFailed}
            onToggle={() => toggleAlert('buildFailed')}
          />

          <AlertToggle
            icon={Bell}
            label="Daily Digest"
            description="Summary of yesterday's activity"
            enabled={alerts.dailyDigest}
            onToggle={() => toggleAlert('dailyDigest')}
          />
        </div>
      </div>

      {/* Info */}
      <div className="card bg-blue-50 border-blue-200 text-sm text-blue-800">
        <p className="font-semibold mb-1">How it works</p>
        <p className="text-xs">
          Alerts are sent via push notifications when your gateway detects issues.
          The gateway must have webhook alerts configured to send to your phone.
        </p>
      </div>
    </div>
  )
}

interface AlertToggleProps {
  icon: any
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
}

function AlertToggle({ icon: Icon, label, description, enabled, onToggle }: AlertToggleProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={20} className="text-claw-primary flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-medium">{label}</span>
          <button
            onClick={onToggle}
            className={`w-12 h-6 rounded-full transition-colors ${
              enabled ? 'bg-claw-primary' : 'bg-gray-300'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-claw-muted mt-1">{description}</p>
      </div>
    </div>
  )
}
