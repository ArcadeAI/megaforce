"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, ExternalLink, Sparkles, Star } from "lucide-react"
import { apiClient } from "./api-client"

export function MainDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    commentsGenerated: 0,
    postsPublished: 0,
    activeSearches: 0
  })
  const [publishedOutputs, setPublishedOutputs] = useState<any[]>([])
  const [personas, setPersonas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch all data in parallel
        const [userData, outputsData, runsData, personasData] = await Promise.all([
          apiClient.getCurrentUser().catch(() => null),
          apiClient.getOutputs().catch(() => []),
          apiClient.getRuns().catch(() => []),
          apiClient.getPersonas().catch(() => [])
        ])
        
        setUser(userData)
        setPersonas(personasData)
        
        // Filter for published outputs only
        const published = outputsData.filter((output: any) => 
          output.status === 'published' && output.published_url
        )
        setPublishedOutputs(published)
        
        // Calculate real stats
        setStats({
          commentsGenerated: outputsData.length,
          postsPublished: published.length,
          activeSearches: runsData.length
        })
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getPersonaName = (personaId: string) => {
    const persona = personas.find(p => p.id === personaId)
    return persona?.name || 'Unknown Persona'
  }

  const formatContentPreview = (content: any, maxLength: number = 150) => {
    try {
      if (typeof content === 'object' && content?.text) {
        const text = content.text
        return text.length <= maxLength ? text : text.substring(0, maxLength) + '...'
      }
      if (typeof content === 'string' && content.startsWith('{')) {
        const parsed = JSON.parse(content)
        const text = parsed.text || parsed.content || content
        return text.length <= maxLength ? text : text.substring(0, maxLength) + '...'
      }
      if (content.length <= maxLength) return content
      return content.substring(0, maxLength) + '...'
    } catch {
      if (content.length <= maxLength) return content
      return content.substring(0, maxLength) + '...'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-gray-900 text-white p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-gray-400">
          Successfully posted content • Connected as: {user?.username || user?.email || 'Not connected'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Comments Generated</p>
                <p className="text-2xl font-bold text-white">{stats.commentsGenerated}</p>
              </div>
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Posts Published</p>
                <p className="text-2xl font-bold text-white">{stats.postsPublished}</p>
              </div>
              <ExternalLink className="w-6 h-6 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Searches</p>
                <p className="text-2xl font-bold text-white">{stats.activeSearches}</p>
              </div>
              <Star className="w-6 h-6 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Published Posts */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Published Posts ({publishedOutputs.length})</h3>
        
        {publishedOutputs.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">No published posts yet</p>
              <p className="text-sm text-gray-500 mt-2">Posts will appear here after they are published</p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {publishedOutputs.map((output: any) => {
                const persona = personas.find(p => p.id === output.persona_id)
                
                return (
                  <div key={output.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors">
                    {/* Content Preview */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-200 leading-relaxed">
                        {formatContentPreview(output.generated_content)}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {persona && (
                        <Badge className="text-xs bg-blue-100 text-blue-800">
                          {persona.name}
                        </Badge>
                      )}
                    <Badge variant="outline" className="text-xs border-gray-500 text-gray-300">
                      {output.content_type}
                    </Badge>
                    {output.score && (
                      <Badge className="text-xs bg-yellow-600 text-yellow-100">
                        <Star className="h-3 w-3 mr-1" />
                        {output.score}
                      </Badge>
                    )}
                  </div>

                  {/* Timestamps and URL */}
                  <div className="text-xs text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(output.created_at).toLocaleDateString()}
                    </div>
                    {output.published_url && (
                      <div className="mt-1">
                        <a 
                          href={output.published_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline text-xs flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Post
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
