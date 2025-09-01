import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

type AddSourcesFormProps = {
  generationRunId?: string | null
  onLoaded?: () => void
  onRunCreated?: (runId: string) => void
}

export default function AddSourcesForm({ generationRunId, onLoaded, onRunCreated }: AddSourcesFormProps) {
  type UrlRow = { url: string }
  const [urlRows, setUrlRows] = useState<UrlRow[]>([])
  type TwitterRow = { mode: 'keywords' | 'user'; query: string }
  const [twitterRows, setTwitterRows] = useState<TwitterRow[]>([])
  const [loading, setLoading] = useState(false)

  function addUrlRow() {
    setUrlRows((rows) => [...rows, { url: '' }])
  }
  function updateUrlRow(index: number, patch: Partial<UrlRow>) {
    setUrlRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }
  function removeUrlRow(index: number) {
    setUrlRows((rows) => rows.filter((_, i) => i !== index))
  }

  function addTwitterRow() {
    setTwitterRows((rows) => [...rows, { mode: 'keywords', query: '' }])
  }
  function updateTwitterRow(index: number, patch: Partial<TwitterRow>) {
    setTwitterRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }
  function removeTwitterRow(index: number) {
    setTwitterRows((rows) => rows.filter((_, i) => i !== index))
  }

  async function loadSources() {
    const urls = urlRows.map((r) => r.url).filter(Boolean)
    const twitterSearches = twitterRows.filter((r) => r.query.trim().length > 0)
    if (urls.length === 0 && twitterSearches.length === 0) {
      toast.message('Add at least one source', { description: 'Provide URLs and/or Twitter searches' })
      return
    }
    setLoading(true)
    try {
      let runId = generationRunId
      if (!runId) {
        const createRes = await apiFetch('/api/v1/generation-runs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({}),
        })
        if (!createRes.ok) throw new Error('Failed to create run')
        const data = await createRes.json()
        runId = data.id
        onRunCreated?.(data.id)
        toast.success('Created new run', { description: 'Adding your sources…' })
      }
      const results: Array<boolean> = []
      for (const u of urls) {
        const res = await apiFetch('/api/v1/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ url: u, generation_run_id: runId }),
        })
        results.push(res.ok)
      }
      for (const t of twitterSearches) {
        const body = {
          search_type: t.mode,
          search_query: t.query,
          limit: 20,
          target_number: 20,
          rank_tweets: false,
          generation_run_id: runId,
        }
        const res = await apiFetch('/api/v1/twitter/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        })
        results.push(res.ok)
      }
      const okCount = results.filter(Boolean).length
      toast.success('Sources loading started', { description: `${okCount} request(s) sent` })
      onLoaded?.()
      setUrlRows([])
      setTwitterRows([])
    } catch (e) {
      toast.error('Failed to load sources')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sources (content to write about)</CardTitle>
        <CardDescription>Add URLs and Twitter searches. "Load Sources" will create a new run if needed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="urls">
          <TabsList>
            <TabsTrigger value="urls">URLs</TabsTrigger>
            <TabsTrigger value="twitter">Twitter Search</TabsTrigger>
          </TabsList>
          <TabsContent value="urls" className="space-y-3">
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
                    <div className="md:col-span-5 space-y-1">
                      <Label>URL</Label>
                      <Input
                        placeholder="https://example.com/post"
                        value={row.url}
                        onChange={(e) => updateUrlRow(i, { url: e.target.value })}
                      />
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
          <TabsContent value="twitter" className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Twitter searches</Label>
              <Button size="sm" variant="outline" onClick={addTwitterRow}>Add search</Button>
            </div>
            {twitterRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No Twitter searches added yet.</p>
            ) : (
              <div className="space-y-3">
                {twitterRows.map((row, i) => (
                  <div key={i} className="grid gap-3 md:grid-cols-6">
                    <div className="md:col-span-3 space-y-1">
                      <Label>Query</Label>
                      <Input
                        value={row.query}
                        onChange={(e) => updateTwitterRow(i, { query: e.target.value })}
                        placeholder={row.mode === 'user' ? '@jack' : 'AI agents'}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Mode</Label>
                      <div className="flex gap-2 text-sm">
                        <Button type="button" variant={row.mode==='keywords'?'default':'outline'} size="sm" onClick={() => updateTwitterRow(i, { mode: 'keywords' })}>Keyword</Button>
                        <Button type="button" variant={row.mode==='user'?'default':'outline'} size="sm" onClick={() => updateTwitterRow(i, { mode: 'user' })}>Username</Button>
                        <Button type="button" variant="outline" size="sm" disabled>Hashtag (soon)</Button>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button type="button" variant="ghost" onClick={() => removeTwitterRow(i)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Queued sources</Label>
          {urlRows.filter((r) => r.url.trim().length > 0).length === 0 && twitterRows.filter((r) => r.query.trim().length > 0).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing queued yet. Add URLs or Twitter searches.</p>
          ) : (
            <ul className="text-sm list-disc pl-5 space-y-1">
              {urlRows.filter((r) => r.url.trim().length > 0).map((r, i) => (
                <li key={`u-${i}`}>URL: {r.url}</li>
              ))}
              {twitterRows.filter((r) => r.query.trim().length > 0).map((r, i) => (
                <li key={`t-${i}`}>Twitter {r.mode}: {r.query}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={loadSources} disabled={loading}>
            {loading ? 'Loading…' : 'Load Sources'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


