import { useState, useEffect } from 'react'
import { MapPin, Battery, Smartphone, Activity, Navigation, Bell, Camera } from 'lucide-react'
import { Geolocation } from '@capacitor/geolocation'
import { Device } from '@capacitor/device'
import { Motion } from '@capacitor/motion'
import { Camera as CapCamera, CameraResultType } from '@capacitor/camera'
import { PushNotifications } from '@capacitor/push-notifications'

interface DeviceInfo {
  platform: string
  model: string
  operatingSystem: string
  osVersion: string
  manufacturer: string
  isVirtual: boolean
  batteryLevel?: number
  isCharging?: boolean
}

interface LocationInfo {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export default function Sensors() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [location, setLocation] = useState<LocationInfo | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [accelData, setAccelData] = useState<any>(null)
  const [isWatchingMotion, setIsWatchingMotion] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadDeviceInfo()
    return () => {
      if (isWatchingMotion) {
        stopMotionListener()
      }
    }
  }, [])

  async function loadDeviceInfo() {
    try {
      const info = await Device.getInfo()
      const battery = await Device.getBatteryInfo()
      
      setDeviceInfo({
        ...info,
        batteryLevel: battery.batteryLevel,
        isCharging: battery.isCharging
      })
    } catch (e) {
      console.error('Failed to get device info:', e)
    }
  }

  async function getLocation() {
    setLoading(true)
    setLocationError(null)
    
    try {
      // Check permissions
      const permission = await Geolocation.requestPermissions()
      
      if (permission.location !== 'granted') {
        setLocationError('Location permission denied')
        setLoading(false)
        return
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      })

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      })
    } catch (e: any) {
      setLocationError(e.message || 'Failed to get location')
    } finally {
      setLoading(false)
    }
  }

  async function startMotionListener() {
    try {
      await Motion.addListener('accel', (event) => {
        setAccelData(event)
      })
      setIsWatchingMotion(true)
    } catch (e) {
      console.error('Motion not available:', e)
    }
  }

  async function stopMotionListener() {
    try {
      await Motion.removeAllListeners()
      setIsWatchingMotion(false)
      setAccelData(null)
    } catch (e) {
      console.error('Failed to stop motion:', e)
    }
  }

  async function testCamera() {
    try {
      const permission = await CapCamera.requestPermissions()
      
      if (permission.camera === 'granted') {
        const photo = await CapCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl
        })
        
        // Could display the photo here
        alert(`Photo captured: ${photo.dataUrl?.substring(0, 50)}...`)
      } else {
        alert('Camera permission denied')
      }
    } catch (e: any) {
      alert(`Camera error: ${e.message}`)
    }
  }

  async function setupPushNotifications() {
    try {
      const result = await PushNotifications.requestPermissions()
      
      if (result.receive === 'granted') {
        await PushNotifications.register()
        alert('Push notifications registered!')
      } else {
        alert('Push notification permission denied')
      }
    } catch (e: any) {
      alert(`Push setup error: ${e.message}`)
    }
  }

  function getBatteryColor(level?: number) {
    if (!level) return 'text-gray-400'
    if (level > 0.5) return 'text-green-500'
    if (level > 0.2) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Phone Sensors</h2>
        <button onClick={loadDeviceInfo} className="text-sm text-gray-500">
          Refresh
        </button>
      </div>

      {/* Device Info Card */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone size={20} className="text-claw-primary" />
          <h3 className="font-semibold">Device Information</h3>
        </div>
        
        {deviceInfo ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Platform:</span>
              <div className="font-medium">{deviceInfo.platform}</div>
            </div>
            <div>
              <span className="text-gray-500">Model:</span>
              <div className="font-medium">{deviceInfo.model}</div>
            </div>
            <div>
              <span className="text-gray-500">OS:</span>
              <div className="font-medium">{deviceInfo.operatingSystem} {deviceInfo.osVersion}</div>
            </div>
            <div>
              <span className="text-gray-500">Manufacturer:</span>
              <div className="font-medium">{deviceInfo.manufacturer}</div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-sm">Loading device info...</div>
        )}
      </div>

      {/* Battery Card */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Battery size={20} className="text-claw-primary" />
          <h3 className="font-semibold">Battery Status</h3>
        </div>
        
        {deviceInfo?.batteryLevel !== undefined ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{Math.round(deviceInfo.batteryLevel * 100)}%</span>
              {deviceInfo.isCharging && (
                <span className="text-green-600 text-sm font-medium">⚡ Charging</span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  deviceInfo.batteryLevel > 0.5 ? 'bg-green-500' : 
                  deviceInfo.batteryLevel > 0.2 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${deviceInfo.batteryLevel * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-sm">Battery info not available</div>
        )}
      </div>

      {/* Location Card */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <MapPin size={20} className="text-claw-primary" />
          <h3 className="font-semibold">Location</h3>
        </div>
        
        {location ? (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500">Lat:</span>
                <div className="font-mono">{location.latitude.toFixed(6)}</div>
              </div>
              <div>
                <span className="text-gray-500">Long:</span>
                <div className="font-mono">{location.longitude.toFixed(6)}</div>
              </div>
            </div>
            <div className="text-gray-500">
              Accuracy: {location.accuracy.toFixed(1)}m
            </div>
            <a 
              href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 text-sm mt-2"
            >
              <Navigation size={14} />
              Open in Maps
            </a>
          </div>
        ) : locationError ? (
          <div className="text-red-500 text-sm">{locationError}</div>
        ) : (
          <div className="text-gray-400 text-sm">Location not available</div>
        )}
        
        <button 
          onClick={getLocation}
          disabled={loading}
          className="w-full py-2 bg-claw-primary text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <MapPin size={18} />
          {loading ? 'Getting location...' : 'Get Location'}
        </button>
      </div>

      {/* Motion Card */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-claw-primary" />
          <h3 className="font-semibold">Motion Sensors</h3>
        </div>
        
        {accelData ? (
          <div className="space-y-2 text-sm font-mono">
            <div>X: {accelData.x?.toFixed(3) || 'N/A'}</div>
            <div>Y: {accelData.y?.toFixed(3) || 'N/A'}</div>
            <div>Z: {accelData.z?.toFixed(3) || 'N/A'}</div>
          </div>
        ) : (
          <div className="text-gray-400 text-sm">Motion data not streaming</div>
        )}
        
        <button 
          onClick={isWatchingMotion ? stopMotionListener : startMotionListener}
          className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 ${
            isWatchingMotion 
              ? 'bg-red-600 text-white' 
              : 'bg-claw-primary text-white'
          }`}
        >
          <Activity size={18} />
          {isWatchingMotion ? 'Stop Motion Stream' : 'Start Motion Stream'}
        </button>
      </div>

      {/* Actions Row */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={testCamera}
          className="card py-3 flex flex-col items-center gap-2 hover:bg-gray-50"
        >
          <Camera size={24} className="text-claw-primary" />
          <span className="text-sm font-medium">Test Camera</span>
        </button>
        
        <button 
          onClick={setupPushNotifications}
          className="card py-3 flex flex-col items-center gap-2 hover:bg-gray-50"
        >
          <Bell size={24} className="text-claw-primary" />
          <span className="text-sm font-medium">Setup Push</span>
        </button>
      </div>

      <div className="card bg-gray-50 text-xs text-gray-600">
        <p className="font-semibold mb-1">Note:</p>
        <p>Sensors require native app build. Some features may not work in browser preview.</p>
      </div>
    </div>
  )
}
