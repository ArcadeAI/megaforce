import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { apiFetch } from '@/lib/api'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import AddSourcesForm from '@/components/AddSourcesForm'

type GenerationRun = {
  id: string
  name: string
  status: string
  created_at: string
  sources_count: number
}

// AddSourcesForm moved to components/AddSourcesForm

export const Route = createFileRoute('/generate')({
  component: GeneratePage,
})

function GeneratePage() {
  const routerState = useRouterState()
  const isIndex = routerState.location.pathname === '/generate'

  if (!isIndex) {
    return <Outlet />
  }

  const [runs, setRuns] = useState<GenerationRun[]>([])
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [timezone, setTimezone] = useState<string>('')

  async function loadRuns() {
    const res = await apiFetch('/api/v1/generation-runs/')
    if (!res.ok) return
    const data = (await res.json()) as GenerationRun[]
    setRuns(data)
  }

  useEffect(() => {
    loadRuns()
    // Try to load app settings for timezone (admin-only route; ignore if forbidden)
    ;(async () => {
      try {
        const res = await apiFetch('/api/v1/settings/')
        if (res.ok) {
          const s = (await res.json()) as { timezone?: string }
          if (s?.timezone) setTimezone(s.timezone)
        }
      } catch {
        // ignore
      }
    })()
  }, [])

  async function handleRunCreated(newRunId: string) {
    setActiveRunId(newRunId)
    await loadRuns()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Generate Content</h1>
          <p className="text-muted-foreground">Add sources below. A new run will be created automatically.</p>
        </div>
      </div>

      <AddSourcesForm generationRunId={activeRunId} onRunCreated={handleRunCreated} onLoaded={loadRuns} />

      <Card>
        <CardHeader>
          <CardTitle>Generation runs</CardTitle>
          <CardDescription>Overview of your runs. For now, showing number of sources.</CardDescription>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No runs yet. Create one to get started.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Sources</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs
                  .slice()
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((r) => (
                  <TableRow key={r.id} className={activeRunId===r.id? 'bg-muted/30' : ''}>
                    <TableCell className="font-medium"><a className="underline" href={`/generate/${r.id}`}>{r.name}</a></TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>{
                      (() => {
                        try {
                          const d = new Date(r.created_at)
                          if (timezone) {
                            return new Intl.DateTimeFormat(undefined, {
                              timeZone: timezone,
                              year: 'numeric',
                              month: 'short',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(d)
                          }
                          return d.toLocaleString()
                        } catch {
                          return r.created_at
                        }
                      })()
                    }</TableCell>
                    <TableCell>{r.sources_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


