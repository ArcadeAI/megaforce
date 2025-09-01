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
          A tool to help you create content using your own style.
        </p>
        <p className="text-pretty text-muted-foreground">
          Using a combination of AI agents, you can:
          <ul className="list-disc list-inside">
            <li>Create multiple "personas", each with their own style, which is automatically inferred from your writing style</li>
            <li>Generate content for your social media profiles</li>
            <li>Generate content for your blog</li>
          </ul>
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg" variant="outline">
          <a href="/personas">Manage Personas</a>
        </Button>
      </div>
      <Card className="w-full">
        <CardContent className="p-6 text-left text-sm text-muted-foreground">
          <p>
            Tip: Use the icon on the bottom of the sidebar to toggle the theme.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
