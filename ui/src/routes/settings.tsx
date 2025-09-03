import { createFileRoute } from '@tanstack/react-router'
import type { MeResponse } from '@/types/auth'
import { apiFetch, API_BASE_URL } from '@/lib/api'
import { Route as RootRoute } from './__root'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useEffect, useMemo, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ChevronsUpDown, Check } from 'lucide-react'

export const Route = createFileRoute('/settings')({
  component: Settings,
})

/*
function PrettyJson(props: { value: unknown }) {
  return (
    <pre className="rounded-md border bg-muted/30 p-3 text-xs leading-relaxed overflow-auto">
      {JSON.stringify(props.value, null, 2)}
    </pre>
  )
}
*/

type AppSettings = {
  id: string
  timezone: string
  created_at: string
  updated_at: string
}

function Settings() {
  const data = RootRoute.useLoaderData() as Partial<MeResponse>

  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null)
  const [tz, setTz] = useState<string>('UTC')
  const [isTzOpen, setIsTzOpen] = useState<boolean>(false)
  const COMMON_TIMEZONES = useMemo(
    () => [
      'UTC',
      'America/Los_Angeles',
      'America/Denver',
      'America/Chicago',
      'America/New_York',
      'America/Toronto',
      'America/Vancouver',
      'America/Mexico_City',
      'America/Bogota',
      'America/Lima',
      'America/Sao_Paulo',
      'Europe/London',
      'Europe/Dublin',
      'Europe/Madrid',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Amsterdam',
      'Europe/Zurich',
      'Europe/Stockholm',
      'Europe/Rome',
      'Europe/Moscow',
      'Africa/Cairo',
      'Africa/Johannesburg',
      'Asia/Dubai',
      'Asia/Kolkata',
      'Asia/Singapore',
      'Asia/Hong_Kong',
      'Asia/Shanghai',
      'Asia/Tokyo',
      'Australia/Sydney',
      'Pacific/Auckland',
    ],
    []
  )

  function getOffsetLabel(timezone: string): string {
    try {
      const now = new Date()
      // Prefer shortOffset if available, otherwise fall back to short name
      // e.g., "GMT-7" or "UTC-7"
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'shortOffset' as any,
      }).formatToParts(now)
      let label = parts.find((p) => p.type === 'timeZoneName')?.value
      if (!label) {
        const partsShort = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          timeZoneName: 'short',
        }).formatToParts(now)
        label = partsShort.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
      }
      return label.replace('UTC', 'GMT')
    } catch {
      return 'GMT'
    }
  }

  function formatTimezoneDisplay(tzName: string): string {
    const offset = getOffsetLabel(tzName)
    const pretty = tzName.replaceAll('_', ' ')
    return `(${offset}) ${pretty}`
  }
  const [loadingSettings, setLoadingSettings] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [integrations, setIntegrations] = useState<{ id: string; key: string; name: string; description?: string }[]>([])
  const [connectingTwitter, setConnectingTwitter] = useState<boolean>(false)

  async function fetchSettings() {
    setLoadingSettings(true)
    try {
      const res = await apiFetch('/api/v1/settings/')
      if (res.status === 403) {
        setIsAdmin(false)
        return
      }
      if (!res.ok) throw new Error('Failed to load settings')
      const s = (await res.json()) as AppSettings
      setAppSettings(s)
      setTz(s.timezone)
      setIsAdmin(true)
    } catch (e) {
      // non-admins will 403; ignore
    } finally {
      setLoadingSettings(false)
    }
  }

  async function fetchIntegrations() {
    try {
      const res = await apiFetch('/api/v1/integrations/')
      if (!res.ok) return
      const data = (await res.json()) as typeof integrations
      setIntegrations(data)
    } catch {}
  }

  useEffect(() => {
    // Try to load admin-only settings; ignore errors
    void fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isAdmin) void fetchIntegrations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  async function handleTwitterConnectAdmin() {
    try {
      setConnectingTwitter(true)
      const res = await apiFetch('/api/v1/settings/twitter/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to initiate Twitter connect' }))
        throw new Error(err?.detail || 'Failed to initiate Twitter connect')
      }
      const data = await res.json()
      if (data?.oauth_url) {
        try {
          localStorage.setItem('arcade_admin_connect', 'true')
          localStorage.setItem('arcade_integration_key', 'twitter')
        } catch {}
        window.location.assign(data.oauth_url)
      } else {
        toast.message('Twitter connection', { description: data?.message || 'No authorization URL returned' })
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong'
      toast.error('Error', { description: message })
    } finally {
      setConnectingTwitter(false)
    }
  }

  async function handleSave() {
    if (!tz) {
      toast.message('Timezone required', { description: 'Enter a valid IANA timezone' })
      return
    }
    setSaving(true)
    try {
      const res = await apiFetch('/api/v1/settings/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ timezone: tz }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to update settings' }))
        throw new Error(err?.detail || 'Failed to update settings')
      }
      const updated = (await res.json()) as AppSettings
      setAppSettings(updated)
      setTz(updated.timezone)
      toast.success('Settings updated', { description: `Timezone set to ${updated.timezone}` })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong'
      toast.error('Error', { description: message })
    } finally {
      setSaving(false)
    }
  }

  if (!data || !data.user) {
    return (
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Loading your account…</p>
          </div>
          <Button asChild variant="outline">
            <a href={`${API_BASE_URL}/api/v1/auth/logout`}>Sign out</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">You're signed in.</p>
        </div>
        <Button asChild variant="outline">
          <a href={`${API_BASE_URL}/api/v1/auth/logout`}>Sign out</a>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="size-12">
              <AvatarImage src={data.user.profile_picture_url ?? undefined} />
              <AvatarFallback>
                {(data.user.first_name?.[0] ?? 'U') + (data.user.last_name?.[0] ?? '')}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <CardTitle className="text-xl">
                {data.user.first_name || data.user.last_name
                  ? `${data.user.first_name ?? ''} ${data.user.last_name ?? ''}`.trim()
                  : data.user.email}
              </CardTitle>
              <CardDescription>{data.user.email}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {data.user.email_verified ? (
                <Badge variant="secondary">Email verified</Badge>
              ) : (
                <Badge variant="destructive">Email not verified</Badge>
              )}
              {data.user.last_sign_in_at ? (
                <Badge variant="outline">Last sign-in: {new Date(data.user.last_sign_in_at).toLocaleString()}</Badge>
              ) : null}
              {data.user.created_at ? (
                <Badge variant="outline">Member since: {new Date(data.user.created_at).toLocaleDateString()}</Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>Admin settings</CardTitle>
              <CardDescription>Update global application settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingSettings && <div className="text-sm text-muted-foreground">Loading settings…</div>}
              {!loadingSettings && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Popover open={isTzOpen} onOpenChange={setIsTzOpen}>
                      <PopoverTrigger asChild>
                        <Button id="timezone" variant="outline" role="combobox" aria-expanded={isTzOpen} className="w-full justify-between">
                          {tz ? formatTimezoneDisplay(tz) : 'Select timezone…'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <Command>
                          <CommandInput placeholder="Search timezones…" />
                          <CommandEmpty>No timezone found.</CommandEmpty>
                          <CommandList>
                            <CommandGroup heading="Common Timezones">
                              {COMMON_TIMEZONES.map((z) => (
                                <CommandItem
                                  key={z}
                                  value={z}
                                  onSelect={(value) => {
                                    setTz(value)
                                    setIsTzOpen(false)
                                  }}
                                >
                                  <Check className={`mr-2 h-4 w-4 ${tz === z ? 'opacity-100' : 'opacity-0'}`} />
                                  {formatTimezoneDisplay(z)}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">Must be a valid IANA timezone string.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving…' : 'Save settings'}
                    </Button>
                    <Button variant="outline" onClick={() => setTz(appSettings?.timezone ?? 'UTC')} disabled={saving}>
                      Reset
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : null}
        {isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect accounts</CardTitle>
              <CardDescription>Authorize admin-level connections for supported services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrations.length === 0 ? (
                <div className="text-sm text-muted-foreground">No integrations configured.</div>
              ) : (
                <div className="space-y-3">
                  {integrations.map((integ) => {
                    const isTwitter = integ.key === 'twitter'
                    return (
                      <div key={integ.id} className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <div className="text-sm font-medium">{integ.name}</div>
                          <div className="text-xs text-muted-foreground">Admin-level connection</div>
                        </div>
                        <div>
                          {isTwitter ? (
                            <Button size="sm" onClick={handleTwitterConnectAdmin} disabled={connectingTwitter}>
                              {connectingTwitter ? 'Connecting…' : 'Connect'}
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled>
                              Coming soon
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}


