"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TwitterDashboard } from "@/components/twitter-dashboard"
import Personas from "@/components/personas"
import SourceMaterials from "@/components/source-materials"
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/components/auth-context"

export default function HomePage() {
  const { user, loading } = useAuth()
  const [activeSection, setActiveSection] = useState("dashboard")

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

  const renderMainContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <TwitterDashboard />
      case "personas":
        return <Personas />
      case "approval":
        return (
          <div className="flex-1 p-6 bg-gray-900 text-white">
            <h1 className="text-2xl font-bold mb-4">Approval Queue</h1>
            <p className="text-gray-400">Coming soon...</p>
          </div>
        )
      case "generate":
        return (
          <div className="flex-1 p-6 bg-gray-900 text-white">
            <h1 className="text-2xl font-bold mb-4">Generate Content</h1>
            <p className="text-gray-400">Coming soon...</p>
          </div>
        )
      case "sources":
        return (
          <div className="flex-1 p-6 bg-gray-900 text-white">
            <SourceMaterials />
          </div>
        )
      default:
        return <TwitterDashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-scroll">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      {renderMainContent()}
    </div>
  )
}
