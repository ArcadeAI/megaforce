import { Outlet, createRootRoute } from '@tanstack/react-router'
import type { MeResponse } from '@/types/auth'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanstackDevtools } from '@tanstack/react-devtools'

import AppSidebar from '@/components/AppSidebar'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

export const Route = createRootRoute({
  staleTime: Infinity,
  preloadStaleTime: Infinity,
  loader: async () => {
    const res = await fetch('/api/v1/auth/me', { credentials: 'include' })
    if (!res.ok) {
      return { authenticated: false } satisfies Partial<MeResponse>
    }
    const data = (await res.json()) as MeResponse
    return data
  },
  component: () => {
    const data = Route.useLoaderData() as Partial<MeResponse>
    const isAuthed = Boolean(data?.authenticated)
    return (
      <ThemeProvider>
        <div className="min-h-dvh bg-background">
          {isAuthed ? (
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <main className="container mx-auto px-4 py-6">
                  <Outlet />
                </main>
              </SidebarInset>
            </SidebarProvider>
          ) : (
            <main className="container mx-auto px-4 py-6">
              <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 py-12 text-center md:py-20">
                <div className="space-y-3">
                  <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                    Welcome to Megaforce
                  </h1>
                  <p className="text-pretty text-muted-foreground">
                    Sign in to access your dashboard and features.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <a className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                    href="/api/v1/auth/login">Sign in</a>
                </div>
              </section>
            </main>
          )}
          <Toaster position="top-right" richColors closeButton />
          <TanstackDevtools
            config={{
              position: 'bottom-left',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        </div>
      </ThemeProvider>
    )
  },
})
