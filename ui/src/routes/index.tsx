import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 py-12 text-center md:py-20">
      <div className="space-y-3">
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Welcome to Megaforce
        </h1>
        <p className="text-pretty text-muted-foreground">
          A minimal example showing authentication and a styled dashboard using Tailwind
          and shadcn/ui.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg" variant="outline">
          <a href="/dashboard">Go to Dashboard</a>
        </Button>
      </div>
      <Card className="w-full">
        <CardContent className="p-6 text-left text-sm text-muted-foreground">
          <p>
            Tip: Use the header to toggle theme. Explore the dashboard to see your
            authenticated user details rendered with shadcn components.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
