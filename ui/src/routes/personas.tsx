import { Link, Outlet, MatchRoute, createFileRoute } from '@tanstack/react-router'
import { apiFetch } from '@/lib/api'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export const Route = createFileRoute('/personas')({
  component: PersonasPage,
})

function PersonasPage() {

  type Persona = {
    id: string
    name: string
    description?: string | null
    is_active?: boolean
    created_at?: string
  }

  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  async function fetchPersonas() {
    try {
      setLoading(true)
      const res = await apiFetch('/api/v1/personas/', {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to load personas')
      const data = (await res.json()) as Persona[]
      setPersonas(data)
    } catch (e) {
      // Silent fail; toast on actions instead
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Guard to prevent duplicate fetch in React 18 StrictMode (dev)
    const fetchedRef = (fetchPersonas as any)._fetchedRef || ((fetchPersonas as any)._fetchedRef = { current: false })
    if (fetchedRef.current) return
    fetchedRef.current = true
    void fetchPersonas()
  }, [])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  })

  async function onSubmit(values: FormValues) {
    try {
      const res = await apiFetch('/api/v1/personas/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to create persona' }))
        throw new Error(err?.detail || 'Failed to create persona')
      }
      const data = await res.json()
      toast.success('Persona created', { description: `Created ${data.name}` })
      form.reset({ name: '', description: '' })
      void fetchPersonas()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong'
      toast.error('Error', { description: message })
    }
  }

  const listView = (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Personas</h1>
          <p className="text-muted-foreground">Create and manage personas.</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Create a new persona</CardTitle>
          <CardDescription>Only name and description for now.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Marketing Voice" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Short description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit">Create</Button>
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your personas</CardTitle>
          <CardDescription>List of personas you have created.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : personas.length === 0 ? (
            <div className="text-sm text-muted-foreground">No personas yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personas.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link to="/personas/$personaId" params={{ personaId: p.id }} className="underline">
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[480px] truncate text-muted-foreground">
                      {p.description || '—'}
                    </TableCell>
                    <TableCell>
                      {p.is_active === false ? (
                        <span className="text-xs text-muted-foreground">inactive</span>
                      ) : (
                        <span className="text-xs">active</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.created_at ? new Date(p.created_at).toLocaleString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  )

  return (
    <>
      <MatchRoute to="/personas/$personaId">
        <Outlet />
      </MatchRoute>
      <MatchRoute to="/personas">{listView}</MatchRoute>
    </>
  )
}

 
