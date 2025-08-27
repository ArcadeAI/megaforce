"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiClient } from '@/components/api-client'

export default function VerifyPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const flowId = params.get('flow_id')
      if (!flowId) {
        setError('Missing flow_id')
        setLoading(false)
        return
      }
      try {
        // Optional persona_id fallback from localStorage (if cookie isn't present)
        let personaId: string | null = null
        try {
          personaId = localStorage.getItem('arcade_persona_id')
        } catch {}

        console.log('personaId', personaId);

        // Call backend verify without redirect so we can stay in the UI domain
        const qp: Record<string, string> = { flow_id: flowId, redirect: 'false' }
        if (personaId) qp.persona_id = personaId
        const query = new URLSearchParams(qp).toString()
        const result = await apiClient.get<{ success: boolean; next_uri?: string; message?: string; status?: string; persona_id?: string }>(
          `/api/v1/personas/verify?${query}`
        )

        if (result?.success) {
          try { localStorage.removeItem('arcade_persona_id') } catch {}
          // Prefer next_uri if provided by Arcade, otherwise go home
          if (result.next_uri) {
            window.location.replace(result.next_uri)
          } else {
            router.replace('/')
          }
        } else {
          setError(result?.message || 'Verification failed.')
        }
      } catch (e: any) {
        setError(e?.message || 'Verification error')
      } finally {
        setLoading(false)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <div className="p-4">Verifying authorization…</div>
  if (error) return <div className="p-4 text-red-600">{error}</div>
  return <div className="p-4">Verification complete. Redirecting…</div>
}


