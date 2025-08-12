"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Sidebar } from "../../components/sidebar"
import { MainDashboard } from "../../components/main-dashboard"
import Personas from "../../components/personas"
import SourceMaterials from "../../components/source-materials"
import GenerateContent from "../../components/generate-content"
import ApprovalQueue from "../../components/approval-queue"
import { LoginForm } from "../../components/login-form"
import { useAuth } from "../../components/auth-context"

export default function HomePage() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState("dashboard")

  // Handle URL section parameter
  useEffect(() => {
    const section = searchParams.get('section')
    if (section && ['dashboard', 'personas', 'approval', 'generate', 'source-materials'].includes(section)) {
      setActiveSection(section)
    }
  }, [searchParams])

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
        return <MainDashboard />
      case "personas":
        return <Personas />
      case "approval":
        return <ApprovalQueue />
      case "generate":
        return <GenerateContent />
      case "sources":
        return (
          <div className="flex-1 p-6 bg-gray-900 text-white">
            <SourceMaterials />
          </div>
        )
      default:
        return <MainDashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-scroll">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      {renderMainContent()}
    </div>
  )
}
