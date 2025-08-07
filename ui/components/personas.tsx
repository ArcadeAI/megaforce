"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  FileText, 
  Save,
  X,
  Users
} from "lucide-react"
import { apiClient, Persona as BasePersona, Document, DocumentCreate } from "./api-client"

// Extended persona interface for UI with additional fields
interface Persona extends BasePersona {
  is_active?: boolean
  updated_at?: string
  style_references?: Document[]
}

export default function Personas() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isCreatingStyleRef, setIsCreatingStyleRef] = useState(false)
  const [editingStyleRefId, setEditingStyleRefId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Form state for creating/editing personas
  const [personaFormData, setPersonaFormData] = useState({
    name: "",
    description: "",
    style_preferences: {
      tone: "",
      voice: "",
      writing_style: "",
      target_audience: "",
      content_type: "",
      key_phrases: "",
      avoid_phrases: ""
    }
  })

  // Form state for creating style references
  const [styleRefFormData, setStyleRefFormData] = useState<DocumentCreate>({
    title: "",
    content: "",
    reference_type: "url",
    url: "",
    document_type: "style_reference",
    is_style_reference: true,
    persona_ids: [],
    platform_data: {}
  })

  // Handle client-side mounting to prevent hydration errors
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load personas on component mount
  useEffect(() => {
    if (isMounted) {
      loadPersonas()
    }
  }, [isMounted])

  const loadPersonas = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('🔄 Loading personas...')
      
      const personasData = await apiClient.getPersonas()
      console.log('📋 Loaded personas:', personasData)
      
      // Load style references for each persona
      const personasWithStyleRefs = await Promise.all(
        personasData.map(async (persona) => {
          try {
            const styleRefs = await apiClient.getStyleReferences(persona.id)
            console.log(`📄 Loaded ${styleRefs.length} style references for persona ${persona.name}`)
            return { ...persona, style_references: styleRefs }
          } catch (error) {
            console.error(`❌ Error loading style references for persona ${persona.name}:`, error)
            return { ...persona, style_references: [] }
          }
        })
      )
      
      setPersonas(personasWithStyleRefs)
      console.log('✅ All personas loaded with style references')
    } catch (error) {
      console.error('❌ Error loading personas:', error)
      setError('Failed to load personas. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePersonaClick = (persona: Persona) => {
    console.log('👤 Persona clicked:', persona.name)
    setSelectedPersona(persona)
    setShowDetails(true)
    setIsEditing(false)
    setIsCreating(false)
    setIsCreatingStyleRef(false)
    setEditingStyleRefId(null)
  }

  const handleCreatePersona = async () => {
    try {
      console.log('➕ Creating persona with data:', personaFormData)
      
      if (!personaFormData.name.trim()) {
        setError('Persona name is required')
        return
      }

      const newPersona = await apiClient.createPersona(personaFormData)
      console.log('✅ Persona created:', newPersona)
      
      // Add to personas list with empty style references
      setPersonas(prev => [...prev, { ...newPersona, style_references: [] }])
      
      // Reset form and state
      setPersonaFormData({
        name: "",
        description: "",
        style_preferences: {
          tone: "",
          voice: "",
          writing_style: "",
          target_audience: "",
          content_type: "",
          key_phrases: "",
          avoid_phrases: ""
        }
      })
      setIsCreating(false)
      setError(null)
      
      // Select the new persona
      setSelectedPersona({ ...newPersona, style_references: [] })
      setShowDetails(true)
      
    } catch (error) {
      console.error('❌ Error creating persona:', error)
      setError('Failed to create persona. Please try again.')
    }
  }

  const startCreating = () => {
    console.log('➕ Starting to create new persona')
    setIsCreating(true)
    setIsEditing(false)
    setShowDetails(false)
    setSelectedPersona(null)
    setIsCreatingStyleRef(false)
    setEditingStyleRefId(null)
    setError(null)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setIsCreating(false)
    setIsCreatingStyleRef(false)
    setEditingStyleRefId(null)
    setError(null)
  }

  // Don't render anything until mounted (prevents hydration errors)
  if (!isMounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading personas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personas</h1>
          <p className="text-gray-600 mt-2">Manage your AI personas and their style references</p>
        </div>
        <Button onClick={startCreating} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Persona
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personas List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Personas ({personas.length})
              </CardTitle>
              <CardDescription>
                Click on a persona to view details and manage style references
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {personas.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No personas yet</p>
                      <p className="text-sm">Create your first persona to get started</p>
                    </div>
                  ) : (
                    personas.map((persona) => (
                      <div
                        key={persona.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedPersona?.id === persona.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handlePersonaClick(persona)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{persona.name}</h3>
                            {persona.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {persona.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {persona.style_references?.length || 0} references
                              </Badge>
                              {persona.is_active !== false && (
                                <Badge variant="outline" className="text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-2">
          {isCreating ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Persona
                </CardTitle>
                <CardDescription>
                  Define a new AI persona with specific style preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={personaFormData.name}
                    onChange={(e) => setPersonaFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Professional Tech Expert"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={personaFormData.description}
                    onChange={(e) => setPersonaFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this persona's role and characteristics..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreatePersona} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Create Persona
                  </Button>
                  <Button variant="outline" onClick={cancelEditing}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : showDetails && selectedPersona ? (
            <div className="space-y-6">
              {/* Persona Details */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {selectedPersona.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {selectedPersona.description || "No description provided"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedPersona.style_preferences && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(selectedPersona.style_preferences).map(([key, value]) => (
                          value && (
                            <div key={key}>
                              <Label className="text-sm font-medium text-gray-700">
                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Label>
                              <p className="text-sm text-gray-900 mt-1">{value}</p>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Style References */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Style References ({selectedPersona.style_references?.length || 0})
                      </CardTitle>
                      <CardDescription>
                        Example content that defines this persona's writing style
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedPersona.style_references && selectedPersona.style_references.length > 0 ? (
                      selectedPersona.style_references.map((styleRef) => (
                        <div key={styleRef.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{styleRef.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {styleRef.reference_type || 'text'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {styleRef.content.length > 200 
                              ? `${styleRef.content.substring(0, 200)}...` 
                              : styleRef.content}
                          </p>
                          {styleRef.url && (
                            <a 
                              href={styleRef.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Source
                            </a>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No style references yet</p>
                        <p className="text-sm">Add style references to define this persona's writing style</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a persona to view details</p>
                  <p className="text-sm">or create a new persona to get started</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
