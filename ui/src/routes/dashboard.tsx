import { createFileRoute } from '@tanstack/react-router'
// Deprecated route shim: redirect to /settings

export const Route = createFileRoute('/dashboard')({
  // This route has been renamed to /settings; redirect if used.
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      window.location.replace('/settings')
    }
    return {}
  },
  component: () => null,
})



