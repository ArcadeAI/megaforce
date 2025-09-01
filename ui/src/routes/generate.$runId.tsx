import { createFileRoute, useParams } from '@tanstack/react-router'
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
  const [selectedSourceDocId, setSelectedSourceDocId] = useState<string>('')
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [submittingOutput, setSubmittingOutput] = useState<boolean>(false)

  const runDocs = useMemo(() => docs.filter(d => (d as any).generation_run_id === runId), [docs, runId])

  async function loadRun() {
    // No GET /generation-runs/{id}; fetch all and find
    try {
      const res = await fetch('/api/v1/generation-runs', { credentials: 'include' })
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
      const res = await fetch('/api/v1/personas', { credentials: 'include' })
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
      const res = await fetch('/api/v1/documents?limit=1000', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load documents')
      const data = (await res.json()) as DocumentRow[]
      setDocs(data)
    } catch (e) {
      toast.error('Error', { description: 'Failed to load documents' })
    } finally {
      setLoadingDocs(false)
    }
  }

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    Promise.all([loadRun(), loadPersonas(), loadDocuments()]).catch(() => {})
  }, [])

  // Refresh docs when window/tab gains focus (keeps updated if persona page adds docs)
  useEffect(() => {
    function onFocus() {
      loadDocuments()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  async function handleCreateOutput() {
    if (!selectedPersonaId) {
      toast.message('Select a persona', { description: 'Persona is required' })
      return
    }
    if (!generatedContent.trim()) {
      toast.message('Add content', { description: 'Generated content cannot be empty' })
      return
    }
    setSubmittingOutput(true)
    try {
      const body: any = {
        content_type: selectedContentType,
        generated_content: generatedContent,
        persona_id: selectedPersonaId,
      }
      if (selectedSourceDocId) body.source_document_id = selectedSourceDocId
      const res = await fetch('/api/v1/outputs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to create output' }))
        throw new Error(err?.detail || 'Failed to create output')
      }
      setGeneratedContent('')
      setSelectedSourceDocId('')
      toast.success('Output created', { description: 'Your output was created as draft' })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong'
      toast.error('Error', { description: message })
    } finally {
      setSubmittingOutput(false)
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
              >
                <option value="tweet_single">Tweet (single)</option>
                <option value="tweet_thread">Tweet thread</option>
                <option value="social_comment">Social comment</option>
                <option value="twitter_reply">Twitter reply</option>
                <option value="linkedin_post">LinkedIn post</option>
                <option value="linkedin_comment">LinkedIn comment</option>
                <option value="blog_post">Blog post</option>
                <option value="reddit_comment">Reddit comment</option>
                <option value="facebook_comment">Facebook comment</option>
                <option value="instagram_comment">Instagram comment</option>
                <option value="youtube_comment">YouTube comment</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Source document (optional)</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={selectedSourceDocId}
                onChange={(e) => setSelectedSourceDocId(e.target.value)}
              >
                <option value="">None</option>
                {runDocs.map(d => (
                  <option key={d.id} value={d.id}>{d.title || d.url || d.id}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Generated content</Label>
            <Textarea rows={5} value={generatedContent} onChange={(e) => setGeneratedContent(e.target.value)} placeholder="Write or paste generated content…" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateOutput} disabled={submittingOutput || !selectedPersonaId || !generatedContent.trim()}>
              {submittingOutput ? 'Creating…' : 'Create output'}
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


