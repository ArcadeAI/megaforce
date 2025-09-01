import { createFileRoute, useParams } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// Table types retained for earlier layout; grouped table component is used instead
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
 
import { toast } from 'sonner'
import DocumentsTableGrouped, { type DocRow } from '@/components/DocumentsTableGrouped'

type Persona = {
  id: string
  name: string
  description?: string | null
  is_active?: boolean
  created_at?: string
}

// Minimal shape we need to show saved reference_style documents
type RefDoc = {
  url: string
  type: string
  category: string
  title?: string | null
}

// Backend document shape (linked to persona)
type PersonaDocument = {
  id: string
  title: string
  content?: string
  url?: string | null
  author?: string | null
  reference_type?: string | null
  created_at?: string
}

export const Route = createFileRoute('/personas/$personaId')({
  component: PersonaDetailPage,
})

function PersonaDetailPage() {
  const { personaId } = useParams({ from: '/personas/$personaId' })
  const [persona, setPersona] = useState<Persona | null>(null)
  const [refStyle, setRefStyle] = useState<{
    name?: string
    description?: string | null
    documents?: RefDoc[]
  } | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [personaDocs, setPersonaDocs] = useState<PersonaDocument[]>([])

  // Builder state for new reference style
  const [refName, setRefName] = useState<string>('')
  const [refDesc, setRefDesc] = useState<string>('')
  type UrlRow = { url: string; type: string; category: string; title?: string }
  const [urlRows, setUrlRows] = useState<UrlRow[]>([])
  const fetchedRef = useRef<string | null>(null)

  // Twitter search state
  const [twitterMode, setTwitterMode] = useState<'keywords' | 'user' | 'hashtag'>('keywords')
  const [twitterQuery, setTwitterQuery] = useState<string>('')
  const [twitterSearching, setTwitterSearching] = useState<boolean>(false)
  const [assignToPersona] = useState<boolean>(true)

  async function handleTwitterSearch() {
    if (!twitterQuery) {
      toast.message('Add a query', { description: 'Enter a keyword, username, or hashtag' })
      return
    }
    if (twitterMode === 'hashtag') {
      toast.message('Hashtag search coming soon', { description: 'Please choose Keyword or Username' })
      return
    }
    setTwitterSearching(true)
    try {
      const body = {
        search_type: twitterMode,
        search_query: twitterQuery,
        limit: 20,
        target_number: 20,
        rank_tweets: false,
        persona_id: assignToPersona ? personaId : undefined,
      }
      const res = await fetch('/api/v1/twitter/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Search failed' }))
        throw new Error(err?.detail || 'Search failed')
      }
      const data = await res.json()
      toast.success('Twitter search complete', { description: `Found ${data?.total_found ?? 0} items` })
      // Refresh persona documents to include newly saved tweets
      await fetchPersonaDocuments()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong'
      toast.error('Error', { description: message })
    } finally {
      setTwitterSearching(false)
    }
  }

  async function fetchPersona() {
    try {
      const res = await fetch(`/api/v1/personas/${personaId}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load persona')
      const data = (await res.json()) as Persona
      setPersona(data)
      setRefStyle((data as any)?.reference_style ?? null)
      if ((data as any)?.reference_style) {
        const rs = (data as any).reference_style as { name?: string; description?: string; documents?: RefDoc[] }
        setRefName(rs?.name ?? '')
        setRefDesc(rs?.description ?? '')
      }
    } catch (e) {
      toast.error('Error', { description: 'Failed to load persona' })
    }
  }

  async function fetchPersonaDocuments() {
    try {
      const res = await fetch(`/api/v1/documents?persona_id=${personaId}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load documents')
      const data = (await res.json()) as PersonaDocument[]
      setPersonaDocs(data)
    } catch (e) {
      toast.error('Error', { description: 'Failed to load persona documents' })
    }
  }

  useEffect(() => {
    if (fetchedRef.current === personaId) return
    fetchedRef.current = personaId
    setLoading(true)
    Promise.all([fetchPersona(), fetchPersonaDocuments()])
      .catch(() => {})
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaId])

  function addUrlRow() {
    setUrlRows((rows) => [...rows, { url: '', type: 'Twitter', category: 'Casual', title: '' }])
  }
  function updateUrlRow(index: number, patch: Partial<UrlRow>) {
    setUrlRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }
  function removeUrlRow(index: number) {
    setUrlRows((rows) => rows.filter((_, i) => i !== index))
  }

  async function handleSaveReferenceStyle() {
    if (!refName) {
      toast.message('Add a name', { description: 'Reference style name is required' })
      return
    }
    const docs: RefDoc[] = urlRows
      .filter((r) => r.url)
      .map((r) => ({ url: r.url, type: r.type, category: r.category, title: r.title }))
    if (docs.length === 0) {
      toast.message('Add at least one URL', { description: 'Reference style requires documents' })
      return
    }
    const body = {
      reference_style: {
        name: refName,
        description: refDesc || undefined,
        documents: docs,
      },
    }
    setSubmitting(true)
    try {
      // Create backend Documents for each URL via the new /api/v1/url endpoint
      const createdResults = await Promise.all(
        docs.map(async (d) => {
          try {
            const res = await fetch('/api/v1/url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ url: d.url, persona_id: personaId }),
            })
            if (!res.ok) {
              const err = await res.json().catch(() => ({ detail: 'Failed to create document from URL' }))
              throw new Error(err?.detail || 'Failed to create document from URL')
            }
            return await res.json()
          } catch (e) {
            const message = e instanceof Error ? e.message : 'Something went wrong creating a document'
            toast.error('URL add failed', { description: message })
            return null
          }
        })
      )
      const createdCount = createdResults.filter(Boolean).length
      if (createdCount > 0) {
        toast.success('URLs added', { description: `Created ${createdCount} document${createdCount === 1 ? '' : 's'}` })
      }

      const res = await fetch(`/api/v1/personas/${personaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to save reference style' }))
        throw new Error(err?.detail || 'Failed to save reference style')
      }
      const updated = (await res.json()) as any
      setPersona(updated)
      setRefStyle(updated?.reference_style ?? null)
      // Refresh persona documents to reflect new URL docs
      await fetchPersonaDocuments()
      toast.success('Reference style saved', { description: 'Your reference style was updated' })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong'
      toast.error('Error', { description: message })
    } finally {
      setSubmitting(false)
    }
  }

  const docsAsRows: DocRow[] = personaDocs

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Persona</h1>
          {persona ? (
            <p className="text-muted-foreground">{persona.name} — {persona.description || 'No description'}</p>
          ) : (
            <p className="text-muted-foreground">Loading persona…</p>
          )}
        </div>
        <Button asChild variant="outline">
          <a href="/personas">Back to Personas</a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reference style</CardTitle>
          <CardDescription>Define and save a reference style for this persona.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ref-name">Name</Label>
              <Input id="ref-name" value={refName} onChange={(e) => setRefName(e.target.value)} placeholder="e.g. Marketing Voice" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ref-desc">Description</Label>
              <Textarea id="ref-desc" value={refDesc} onChange={(e) => setRefDesc(e.target.value)} placeholder="Short description of this style" rows={3} />
            </div>
          </div>

          <Tabs defaultValue="urls" className="w-full">
            <TabsList>
              <TabsTrigger value="urls">URLs</TabsTrigger>
              <TabsTrigger value="twitter">Twitter Search</TabsTrigger>
              <TabsTrigger value="markdown" disabled>
                Markdown
              </TabsTrigger>
            </TabsList>

            <TabsContent value="urls" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">URL sources</Label>
                <Button size="sm" variant="outline" onClick={addUrlRow}>
                  Add URL
                </Button>
              </div>
              {urlRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No URLs added yet.</p>
              ) : (
                <div className="space-y-3">
                  {urlRows.map((row, i) => (
                    <div key={i} className="grid gap-3 md:grid-cols-6">
                      <div className="md:col-span-3 space-y-1">
                        <Label>URL</Label>
                        <Input
                          placeholder="https://example.com/post"
                          value={row.url}
                          onChange={(e) => updateUrlRow(i, { url: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Type</Label>
                        <select
                          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                          value={row.type}
                          onChange={(e) => updateUrlRow(i, { type: e.target.value })}
                        >
                          <option>Twitter</option>
                          <option>Blog</option>
                          <option>LinkedIn</option>
                          <option>Reddit</option>
                          <option>Facebook</option>
                          <option>Instagram</option>
                          <option>TikTok</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Category</Label>
                        <select
                          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                          value={row.category}
                          onChange={(e) => updateUrlRow(i, { category: e.target.value })}
                        >
                          <option>Casual</option>
                          <option>Formal</option>
                          <option>Very Formal</option>
                          <option>Funny</option>
                          <option>Professional</option>
                          <option>Technical</option>
                          <option>Creative</option>
                          <option>Academic</option>
                          <option>Journalistic</option>
                          <option>Marketing</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Title (optional)</Label>
                        <Input placeholder="Optional" value={row.title ?? ''} onChange={(e) => updateUrlRow(i, { title: e.target.value })} />
                      </div>
                      <div className="flex items-end">
                        <Button type="button" variant="ghost" onClick={() => removeUrlRow(i)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="twitter" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="twitter-query">Search {twitterMode === 'user' ? 'username' : twitterMode === 'hashtag' ? 'hashtag' : 'keyword'}</Label>
                  <Input
                    id="twitter-query"
                    value={twitterQuery}
                    onChange={(e) => setTwitterQuery(e.target.value)}
                    placeholder={twitterMode === 'user' ? '@jack' : twitterMode === 'hashtag' ? '#AI' : 'AI agents'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Search mode</Label>
                  <RadioGroup value={twitterMode} onValueChange={(v) => setTwitterMode(v as 'keywords' | 'user' | 'hashtag')} className="grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem id="mode-keywords" value="keywords" />
                      <Label htmlFor="mode-keywords" className="cursor-pointer">Keyword</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem id="mode-user" value="user" />
                      <Label htmlFor="mode-user" className="cursor-pointer">Username</Label>
                    </div>
                    <div className="flex items-center gap-2 opacity-60">
                      <RadioGroupItem id="mode-hashtag" value="hashtag" disabled />
                      <Label htmlFor="mode-hashtag" className="cursor-not-allowed">Hashtag (soon)</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleTwitterSearch} disabled={twitterSearching || !twitterQuery || twitterMode === 'hashtag'}>
                  {twitterSearching ? 'Searching…' : 'Search Twitter'}
                </Button>
                {twitterMode === 'hashtag' ? (
                  <span className="text-xs text-muted-foreground">Hashtag search not yet available.</span>
                ) : null}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2">
            <Button onClick={handleSaveReferenceStyle} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save reference style'}
            </Button>
            <Button variant="outline" onClick={() => setUrlRows([])} disabled={submitting}>
              Clear URLs
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved reference style</CardTitle>
          <CardDescription>Currently stored on this persona.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className="space-y-3">
              <div>
                {refStyle ? (
                  <>
                    <div className="text-sm font-medium">{refStyle.name || 'Untitled'}</div>
                    {refStyle.description ? (
                      <div className="text-sm text-muted-foreground">{refStyle.description}</div>
                    ) : null}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">No reference style saved.</div>
                )}
              </div>
              <DocumentsTableGrouped documents={docsAsRows} emptyMessage="No documents linked to this persona." />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


