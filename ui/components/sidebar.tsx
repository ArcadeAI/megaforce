"use client"

import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { ScrollArea } from "../components/ui/scroll-area"
import { 
  MessageSquare, 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Sparkles,
  CheckCircle,
  Wand2
} from "lucide-react"
import { useAuth } from "./auth-context"
import { apiClient } from "./api-client"

const navigationSections = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "approval", label: "Approval Queue", icon: CheckCircle },
  { id: "generate", label: "Generate Content", icon: Wand2 },
  { id: "sources", label: "Source Materials", icon: FileText },
  { id: "personas", label: "Personas", icon: Users },
]

interface SidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
}

export function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState({
    commentsGenerated: 0,
    postsPublished: 0,
    approvalRate: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch real data from API
        const [outputsData] = await Promise.all([
          apiClient.getOutputs().catch(() => [])
        ])

        // Calculate real stats
        const totalOutputs = outputsData.length
        const publishedOutputs = outputsData.filter((output: any) => 
          output.status === 'published' || output.status === 'approved'
        ).length
        const approvedOutputs = outputsData.filter((output: any) => 
          output.status === 'approved' || output.status === 'published'
        ).length
        
        const approvalRate = totalOutputs > 0 ? Math.round((approvedOutputs / totalOutputs) * 100) : 0

        setStats({
          commentsGenerated: totalOutputs,
          postsPublished: publishedOutputs,
          approvalRate: approvalRate
        })
      } catch (error) {
        console.error('Failed to fetch sidebar stats:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-400" />
          Megaforce
        </h1>
        <p className="text-sm text-gray-400 mt-1">AI Social Media Management</p>
      </div>

      <div className="p-3 space-y-2">
        {navigationSections.map((section) => {
          const Icon = section.icon
          return (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "secondary" : "ghost"}
              className="w-full justify-start text-left"
              onClick={() => setActiveSection(section.id)}
            >
              <Icon className="w-4 h-4 mr-3" />
              {section.label}
            </Button>
          )
        })}
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-gray-700/30">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Quick Stats</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Comments Generated</span>
                <span className="text-white">{stats.commentsGenerated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Posts Published</span>
                <span className="text-white">{stats.postsPublished}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Approval Rate</span>
                <span className="text-green-400">{stats.approvalRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-700 mt-auto">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.username?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.username || user.email}</p>
                <p className="text-xs text-green-400">Online</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">Not logged in</p>
            <Button variant="outline" size="sm" className="w-full">
              Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
