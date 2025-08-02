"use client"

import { Sidebar } from "@/components/sidebar"
import { TwitterDashboard } from "@/components/twitter-dashboard"
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/components/auth-context"

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-900 text-white items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen bg-gray-900 text-white items-center justify-center">
        <LoginForm />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-scroll">
      <Sidebar />
      <TwitterDashboard />
    </div>
  )
}
