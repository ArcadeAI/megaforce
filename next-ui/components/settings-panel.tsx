"use client"

import { useEffect, useState } from "react"
import { apiClient } from "./api-client"
import { Button } from "./ui/button"
import { Link2 } from "lucide-react"

const COMMON_TIMEZONES = [
  "UTC",
  "US/Pacific",
  "US/Mountain",
  "US/Central",
  "US/Eastern",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
  "America/Mexico_City",
  "America/Guatemala",
  "America/Costa_Rica",
  "America/Panama",
  "America/Bogota",
  "America/Lima",
  "America/La_Paz",
  "America/Santiago",
  "America/Asuncion",
  "America/Montevideo",
  "America/Argentina/Buenos_Aires",
  "America/Sao_Paulo",
]

export default function SettingsPanel() {
  const [timezone, setTimezone] = useState("UTC")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string|undefined>()
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const settings = await apiClient.getSettings()
        if (isMounted) setTimezone(settings.timezone || "UTC")
      } catch (e: any) {
        setMessage(e?.message || 'Failed to load settings')
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => { isMounted = false }
  }, [])

  const onSave = async () => {
    setSaving(true)
    setMessage(undefined)
    try {
      const updated = await apiClient.updateSettings({ timezone })
      setTimezone(updated.timezone)
      setMessage('Settings saved')
    } catch (e: any) {
      setMessage(e?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-white">Loading settings…</div>
  }

  return (
    <div className="flex-1 p-6 bg-gray-900 text-white">
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>
      <div className="max-w-xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Scheduling Timezone</label>
          <select
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {COMMON_TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">All scheduled times are interpreted in this timezone.</p>
        </div>

        <div className="pt-4 border-t border-gray-800">
          <label className="block text-sm font-medium text-gray-300 mb-2">Admin Twitter Connection</label>
          <p className="text-xs text-gray-400 mb-3">Connect an admin Twitter/X account used for searches and admin tasks. This does not affect persona posting.</p>
          <Button
            onClick={async () => {
              setMessage(undefined)
              setConnecting(true)
              try {
                const res = await apiClient.connectAdminTwitter()
                if (res?.oauth_url) {
                  try { localStorage.setItem('arcade_admin_connect', 'true') } catch {}
                  window.location.href = res.oauth_url
                } else if (res?.state === 'completed') {
                  setMessage('Admin Twitter account already connected')
                }
              } catch (e: any) {
                setMessage(e?.message || 'Failed to initiate Twitter connection')
              } finally {
                setConnecting(false)
              }
            }}
            disabled={connecting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Link2 className="h-4 w-4 mr-2" />
            {connecting ? 'Connecting…' : 'Connect admin Twitter account'}
          </Button>
        </div>

        <div className="flex gap-3">
          <Button onClick={onSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? 'Saving…' : 'Save Settings'}
          </Button>
          {message && <span className="text-sm text-gray-300">{message}</span>}
        </div>
      </div>
    </div>
  )
}


