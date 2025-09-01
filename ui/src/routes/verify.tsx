import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { apiFetch } from '@/lib/api'

export const Route = createFileRoute('/verify')({
  component: VerifyPage,
})

function VerifyPage() {
  const [error, setError] = useState<string | null>(null)
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true
    try {
      const search = new URLSearchParams(window.location.search)
      const flowId = search.get('flow_id')
      if (!flowId) {
        setError('Missing flow_id')
        return
      }

      let personaId: string | null = null
      try {
        personaId = localStorage.getItem('arcade_persona_id')
      } catch {}

      if (!personaId) {
        const adminConnect = localStorage.getItem('arcade_admin_connect')
        if (adminConnect) {
          personaId = 'admin'
        }
      }

      if (!personaId) {
        setError('Missing persona_id')
        return
      }

      const qp = new URLSearchParams({ flow_id: flowId, redirect: 'false' })
      let integrationKey = search.get('integration_key')
      if (!integrationKey) {
        try { integrationKey = localStorage.getItem('arcade_integration_key') } catch {}
      }
      if (personaId) qp.set('persona_id', personaId)
      if (integrationKey) qp.set('integration_key', integrationKey)

      // Call the backend to confirm and wait; then redirect to next_uri if provided
      apiFetch(`/api/v1/personas/verify?${qp.toString()}`)
        .then(async (res) => {
          const data = await res.json().catch(() => null)
          if (res.ok && data?.success) {
            try { localStorage.removeItem('arcade_persona_id') } catch {}
            try { localStorage.removeItem('arcade_integration_key') } catch {}
            if (data?.next_uri) {
              window.location.replace(data.next_uri)
            } else {
              window.location.replace('/')
            }
          } else {
            setError(data?.message || 'Verification failed')
          }
        })
        .catch((e) => setError(e?.message || 'Verification error'))
    } catch (e: any) {
      setError(e?.message || 'Verification error')
    }
  }, [])

  if (error) return <div className="p-4 text-red-600">{error}</div>
  return <div className="p-4">Redirecting for verification…</div>
}


