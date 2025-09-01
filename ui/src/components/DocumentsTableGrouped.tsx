import { Fragment, useMemo, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

export type DocRow = {
  id: string
  title: string
  content?: string
  url?: string | null
  author?: string | null
  reference_type?: string | null
  created_at?: string
}

type Props = {
  documents: DocRow[]
  emptyMessage?: string
}

export default function DocumentsTableGrouped({ documents, emptyMessage = 'No documents.' }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const grouped = useMemo(() => {
    const typeOrder = ['url', 'tweet']
    const byType: Record<string, DocRow[]> = {}
    for (const d of documents) {
      const key = (d.reference_type || 'unknown').toLowerCase()
      if (!byType[key]) byType[key] = []
      byType[key].push(d)
    }
    Object.values(byType).forEach(arr => arr.sort((a, b) => (new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())))
    const otherTypes = Object.keys(byType).filter(t => !typeOrder.includes(t)).sort()
    const orderedTypes = [...typeOrder, ...otherTypes].filter(t => byType[t] && byType[t].length > 0)
    return orderedTypes.map(t => ({ type: t, docs: byType[t] }))
  }, [documents])

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const total = grouped.reduce((sum, g) => sum + g.docs.length, 0)

  if (total === 0) {
    return <div className="text-sm text-muted-foreground">{emptyMessage}</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16"></TableHead>
          <TableHead>Title</TableHead>
          <TableHead>URL</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-40">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {grouped.map(group => (
          <Fragment key={`group-${group.type}`}>
            <TableRow>
              <TableCell colSpan={6} className="font-semibold bg-muted/30">
                {(group.type === 'url' && 'URLs') || (group.type === 'tweet' && 'Tweets') || group.type.charAt(0).toUpperCase() + group.type.slice(1)}
              </TableCell>
            </TableRow>
            {group.docs.map(d => (
              <Fragment key={d.id}>
                <TableRow>
                  <TableCell className="align-top">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => toggle(d.id)}
                      aria-expanded={expanded.has(d.id)}
                      aria-controls={`doc-${d.id}`}
                    >
                      {expanded.has(d.id) ? 'Hide' : 'Show'}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium align-top">{d.title || '—'}</TableCell>
                  <TableCell className="max-w-[420px] truncate text-muted-foreground align-top">
                    {d.url ? (
                      <a className="underline" href={d.url} target="_blank" rel="noreferrer">
                        {d.url}
                      </a>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="align-top">{d.reference_type || '—'}</TableCell>
                  <TableCell className="align-top">{d.created_at ? new Date(d.created_at).toLocaleString() : '—'}</TableCell>
                  <TableCell className="align-top">
                    <Button type="button" size="sm" variant="outline" disabled>
                      Remove (soon)
                    </Button>
                  </TableCell>
                </TableRow>
                {expanded.has(d.id) ? (
                  <TableRow>
                    <TableCell colSpan={6} id={`doc-${d.id}`}>
                      {String(d.reference_type || '').toLowerCase() === 'url' ? (
                        <pre className="whitespace-pre-wrap font-mono text-sm max-h-[480px] overflow-auto rounded border bg-muted/20 p-3">{d.content || 'No content'}</pre>
                      ) : (
                        <div className="text-sm whitespace-pre-wrap max-h-[480px] overflow-auto rounded border bg-muted/10 p-3">{d.content || 'No content'}</div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            ))}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  )
}


