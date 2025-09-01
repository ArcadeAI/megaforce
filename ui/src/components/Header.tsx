import { Link } from '@tanstack/react-router'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { API_BASE_URL } from '@/lib/api'
import { Separator } from '@/components/ui/separator'
import logo from '@/logo.svg'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-6 w-6" />
          <nav className="flex items-center gap-1 text-sm">
            <Button asChild variant="ghost">
              <Link to="/">Home</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Separator orientation="vertical" className="h-6" />
          <ThemeToggle />
          <Button asChild variant="outline" size="sm">
            <a href={`${API_BASE_URL}/api/v1/auth/logout`}>Sign out</a>
          </Button>
        </div>
      </div>
    </header>
  )
}
