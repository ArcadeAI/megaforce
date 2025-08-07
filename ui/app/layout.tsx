import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth-context'

export const metadata: Metadata = {
  title: 'Megaforce - AI Social Media Management',
  description: 'AI-powered social media content generation and management platform',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-full overflow-scroll">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
