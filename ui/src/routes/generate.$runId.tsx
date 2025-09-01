import { createFileRoute, useParams } from '@tanstack/react-router'
import { apiFetch } from '@/lib/api'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import AddSourcesForm from '@/components/AddSourcesForm'
import DocumentsTableGrouped, { type DocRow } from '@/components/DocumentsTableGrouped'
import { toast } from 'sonner'

type GenerationRun = {
  id: string
  name: string
  status: string
  created_at: string
}

type Persona = {
  id: string
  name: string
}

type DocumentRow = DocRow & { generation_run_id?: string | null }

export const Route = createFileRoute('/generate/$runId')({
  component: RunDetailPage,
})

function RunDetailPage() {
  const { runId } = useParams({ from: '/generate/$runId' })
  const [run, setRun] = useState<GenerationRun | null>(null)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [docs, setDocs] = useState<DocumentRow[]>([])
  const [loadingDocs, setLoadingDocs] = useState<boolean>(true)
  const [collapsibleOpen, setCollapsibleOpen] = useState<boolean>(false)
  const loadedRef = useRef(false)

  // Output creation form state
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('')
  const [selectedContentType, setSelectedContentType] = useState<string>('tweet_single')
  // Source selection is fixed to ALL for now
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [creatingJob, setCreatingJob] = useState<boolean>(false)
  const [jobs, setJobs] = useState<GenerationJob[]>([])
  const [loadingJobs, setLoadingJobs] = useState<boolean>(true)

  const runDocs = useMemo(() => docs.filter(d => (d as any).generation_run_id === runId), [docs, runId])

  async function loadRun() {
    // No GET /generation-runs/{id}; fetch all and find
    try {
      const res = await apiFetch('/api/v1/generation-runs')
      if (!res.ok) return
      const list = (await res.json()) as GenerationRun[]
      const found = list.find(r => r.id === runId) || null
      setRun(found)
    } catch {
      // ignore
    }
  }

  async function loadPersonas() {
    try {
      const res = await apiFetch('/api/v1/personas')
      if (!res.ok) return
      const data = (await res.json()) as Persona[]
      setPersonas(data)
      if (!selectedPersonaId && data.length > 0) setSelectedPersonaId(data[0].id)
    } catch {
      // ignore
    }
  }

  async function loadDocuments() {
    setLoadingDocs(true)
    try {
      const res = await apiFetch('/api/v1/documents?limit=1000')
      if (!res.ok) throw new Error('Failed to load documents')
      const data = (await res.json()) as DocumentRow[]
      setDocs(data)
    } catch (e) {
      toast.error('Error', { description: 'Failed to load documents' })
    } finally {
      setLoadingDocs(false)
    }
  }

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

  async function loadJobs() {
    setLoadingJobs(true)
    try {
      const res = await apiFetch(`/api/v1/generation-runs/${runId}/jobs`)
      if (!res.ok) throw new Error('Failed to load jobs')
      const data = (await res.json()) as GenerationJob[]
      setJobs(data)
    } catch (e) {
      toast.error('Error', { description: 'Failed to load generation jobs' })
    } finally {
      setLoadingJobs(false)
    }
  }

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    Promise.all([loadRun(), loadPersonas(), loadDocuments(), loadJobs()]).catch(() => {})
  }, [])

  // Refresh docs when window/tab gains focus (keeps updated if persona page adds docs)
  useEffect(() => {
    function onFocus() {
      loadDocuments()
      loadJobs()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // Deprecated manual output creation flow removed in favor of generation job

  async function handleCreateJobAllSources() {
    if (!selectedPersonaId) {
      toast.message('Select a persona', { description: 'Persona is required' })
      return
    }
    setCreatingJob(true)
    try {
      const body: any = {
        persona_id: selectedPersonaId,
        content_type: 'tweet_single',
        source_selection: 'all',
      }
      const res = await apiFetch(`/api/v1/generation-runs/${runId}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to create job' }))
        throw new Error(err?.detail || 'Failed to create job')
      }
      toast.success('Job created', { description: 'Generation job queued' })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong'
      toast.error('Error', { description: message })
    } finally {
      setCreatingJob(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Generation Run</h1>
          {run ? (
            <p className="text-muted-foreground">{run.name} — {run.status}</p>
          ) : (
            <p className="text-muted-foreground">Loading run…</p>
          )}
        </div>
        <Button asChild variant="outline">
          <a href="/generate">Back to Runs</a>
        </Button>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>Add output</CardTitle>
          <CardDescription>Create a draft output linked to a persona and optional source.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Persona</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={selectedPersonaId}
                onChange={(e) => setSelectedPersonaId(e.target.value)}
              >
                <option value="">Select persona…</option>
                {personas.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Content type</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={selectedContentType}
                onChange={(e) => setSelectedContentType(e.target.value)}
                disabled
              >
                <option value="tweet_single">Tweet (single)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Source documents</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value="all"
                disabled
              >
                <option value="all">ALL</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Generated content</Label>
            <Textarea rows={5} value={generatedContent} onChange={(e) => setGeneratedContent(e.target.value)} placeholder="Write or paste generated content…" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateJobAllSources} disabled={creatingJob || !selectedPersonaId}>
              {creatingJob ? 'Queuing…' : 'Create generation job'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium">Add more sources</h2>
            <p className="text-sm text-muted-foreground">Use the same tools as the main generate page.</p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="outline">{collapsibleOpen ? 'Hide' : 'Show'}</Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="mt-4">
          <AddSourcesForm generationRunId={runId} onLoaded={loadDocuments} />
        </CollapsibleContent>
      </Collapsible>

      <Card>
        <CardHeader>
          <CardTitle>Generation jobs</CardTitle>
          <CardDescription>Jobs created for this run and their statuses.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingJobs ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : jobs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No jobs yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 pr-4">Persona</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Sources</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Content</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(j => {
                    const personaName = personas.find(p => p.id === j.persona_id)?.name || j.persona_id
                    return (
                      <tr key={j.id} className="border-t">
                        <td className="py-2 pr-4 whitespace-nowrap">{new Date(j.created_at).toLocaleString()}</td>
                        <td className="py-2 pr-4">{personaName}</td>
                        <td className="py-2 pr-4">{j.content_type}</td>
                        <td className="py-2 pr-4 uppercase">{j.source_selection}</td>
                        <td className="py-2 pr-4">{j.status}</td>
                        <td className="py-2 pr-4 max-w-[380px]">
                          {j.generated_content ? (
                            <details>
                              <summary className="cursor-pointer select-none text-blue-600 hover:underline">View</summary>
                              <pre className="mt-2 whitespace-pre-wrap break-words text-xs bg-muted/40 p-2 rounded">{j.generated_content}</pre>
                            </details>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-4">
                          <a className="text-blue-600 hover:underline" href={`/job/${j.id}`}>Open</a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" onClick={loadJobs}>Refresh</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Run sources</CardTitle>
          <CardDescription>Documents grouped by type for this run.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDocs ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <DocumentsTableGrouped documents={runDocs} emptyMessage="No documents linked to this run." />
          )}
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={loadDocuments}>Refresh</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


