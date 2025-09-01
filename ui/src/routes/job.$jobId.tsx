import { createFileRoute, useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

type GenerationJob = {
  id: string
  generation_run_id: string
  persona_id: string
  content_type: string
  source_selection: string
  status: string
  generated_content?: string | null
  created_at: string
  updated_at?: string | null
}

type Persona = { id: string; name: string }

export const Route = createFileRoute('/job/$jobId')({
  component: JobDetailPage,
})

function JobDetailPage() {
  const { jobId } = useParams({ from: '/job/$jobId' })
  const [job, setJob] = useState<GenerationJob | null>(null)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [saving, setSaving] = useState(false)
  const [posting, setPosting] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [timezone, setTimezone] = useState<string>('')
  const [datePart, setDatePart] = useState<string>('')
  const [timePart, setTimePart] = useState<string>('')

  // Compute current date/time parts in a given IANA timezone
  function computeNowParts(tz: string): { date: string; time: string } {
    const now = new Date()
    const dtf = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    } as any)
    const parts = dtf.formatToParts(now)
    const get = (t: string) => parts.find(p => p.type === t)?.value || ''
    const date = `${get('year')}-${get('month')}-${get('day')}`
    const time = `${get('hour')}:${get('minute')}`
    return { date, time }
  }

  // Get timezone offset in minutes for a specific instant in a timezone
  function getOffsetMinutes(date: Date, tz: string): number {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    } as any)
    const parts = dtf.formatToParts(date)
    const map: Record<string, string> = {}
    for (const p of parts) map[p.type] = p.value
    const asUTC = Date.UTC(
      Number(map.year),
      Number(map.month) - 1,
      Number(map.day),
      Number(map.hour),
      Number(map.minute),
      Number(map.second)
    )
    return (asUTC - date.getTime()) / 60000
  }

  // Convert selected local date/time in tz to an ISO string (UTC Z)
  function buildIsoFromParts(dateStr: string, timeStr: string, tz: string): string | null {
    if (!dateStr || !timeStr || !tz) return null
    const [y, m, d] = dateStr.split('-').map(Number)
    const [hh, mm] = timeStr.split(':').map(Number)
    if ([y, m, d, hh, mm].some(n => Number.isNaN(n))) return null
    const utcGuess = Date.UTC(y, m - 1, d, hh, mm, 0)
    const offsetMin = getOffsetMinutes(new Date(utcGuess), tz)
    const realUtc = new Date(utcGuess - offsetMin * 60000)
    return realUtc.toISOString()
  }

  async function loadJob() {
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load job')
      const data = (await res.json()) as GenerationJob
      setJob(data)
    } catch (e) {
      toast.error('Error', { description: 'Failed to load job' })
    }
  }

  async function loadPersonas() {
    try {
      const res = await fetch('/api/v1/personas', { credentials: 'include' })
      if (!res.ok) return
      setPersonas(await res.json())
    } catch {}
  }

  useEffect(() => {
    loadJob()
    loadPersonas()
    // Try to load app settings to determine timezone
    ;(async () => {
      try {
        const res = await fetch('/api/v1/settings/', { credentials: 'include' })
        if (res.ok) {
          const s = (await res.json()) as { timezone?: string }
          if (s?.timezone) setTimezone(s.timezone)
        }
      } catch {}
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  // Initialize default date/time when timezone loads
  useEffect(() => {
    if (timezone && !datePart && !timePart) {
      const { date, time } = computeNowParts(timezone)
      setDatePart(date)
      setTimePart(time)
    }
  }, [timezone])

  const personaName = useMemo(() => {
    if (!job) return ''
    return personas.find(p => p.id === job.persona_id)?.name || job.persona_id
  }, [job, personas])

  async function handleSave() {
    if (!job) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ generated_content: job.generated_content }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to save' }))
        throw new Error(err?.detail || 'Failed to save')
      }
      const updated = await res.json()
      setJob(updated)
      toast.success('Saved', { description: 'Job content updated' })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong'
      toast.error('Error', { description: message })
    } finally {
      setSaving(false)
    }
  }

  async function handlePostNow() {
    if (!job) return
    setPosting(true)
    try {
      const res = await fetch(`/api/v1/jobs/${job.id}/post`, { method: 'POST', credentials: 'include' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to post' }))
        throw new Error(err?.detail || 'Failed to post')
      }
      toast.success('Post queued', { description: 'Job will be posted shortly' })
      await loadJob()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong'
      toast.error('Error', { description: message })
    } finally {
      setPosting(false)
    }
  }

  async function handleSchedule() {
    if (!job) return
    if (!datePart || !timePart) {
      toast.message('Add schedule time', { description: 'Pick a date and time' })
      return
    }
    const iso = buildIsoFromParts(datePart, timePart, timezone || 'UTC')
    if (!iso) {
      toast.error('Invalid time', { description: 'Please pick a valid date and time' })
      return
    }
    setScheduling(true)
    try {
      const res = await fetch(`/api/v1/jobs/${job.id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ schedule_time: iso }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to schedule' }))
        throw new Error(err?.detail || 'Failed to schedule')
      }
      toast.success('Scheduled', { description: 'Job scheduled to post' })
      await loadJob()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong'
      toast.error('Error', { description: message })
    } finally {
      setScheduling(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Job</h1>
          {job ? (
            <p className="text-muted-foreground">{personaName} — {job.content_type} — {job.status}</p>
          ) : (
            <p className="text-muted-foreground">Loading job…</p>
          )}
        </div>
        <Button asChild variant="outline">
          <a href={job ? `/generate/${job.generation_run_id}` : '/generate'}>Back to Run</a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generated content</CardTitle>
          <CardDescription>Edit before posting or scheduling.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              rows={8}
              value={job?.generated_content ?? ''}
              onChange={(e) => setJob((prev) => (prev ? { ...prev, generated_content: e.target.value } : prev))}
              placeholder="Generated content here"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || !job}>
              {saving ? 'Saving…' : 'Save' }
            </Button>
            <Button variant="secondary" onClick={handlePostNow} disabled={posting || !job}>
              {posting ? 'Posting…' : 'Post now' }
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule posting</CardTitle>
          <CardDescription>Pick a date and time. Timezone: {timezone || 'UTC'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="schedule-date">Date</Label>
              <input
                id="schedule-date"
                type="date"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={datePart}
                onChange={(e) => setDatePart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-time">Time</Label>
              <input
                id="schedule-time"
                type="time"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={timePart}
                onChange={(e) => setTimePart(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Button onClick={handleSchedule} disabled={scheduling || !job}>
              {scheduling ? 'Scheduling…' : 'Schedule post'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



