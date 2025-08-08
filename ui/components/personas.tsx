"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

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
      avoid_phrases: "",
      use_emojis: false
    }
  })

  // Form state for creating style references
  const [styleRefFormData, setStyleRefFormData] = useState<DocumentCreate>({
    title: "",
    content: "",
    reference_type: "document",
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

  const handleUpdatePersona = async () => {
    if (!selectedPersona) return
    
    try {
      console.log('✏️ Updating persona:', selectedPersona.id, 'with data:', personaFormData)
      
      if (!personaFormData.name.trim()) {
        setError('Persona name is required')
        return
      }

      const updatedPersona = await apiClient.updatePersona(selectedPersona.id, personaFormData)
      console.log('✅ Persona updated:', updatedPersona)
      
      // Update in personas list
      setPersonas(prev => prev.map(p => 
        p.id === selectedPersona.id 
          ? { ...updatedPersona, style_references: selectedPersona.style_references }
          : p
      ))
      
      // Update selected persona
      setSelectedPersona({ ...updatedPersona, style_references: selectedPersona.style_references })
      setIsEditing(false)
      setError(null)
      
    } catch (error) {
      console.error('❌ Error updating persona:', error)
      setError('Failed to update persona. Please try again.')
    }
  }

  const handleDeletePersona = async (personaId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Persona',
      message: 'Are you sure you want to delete this persona? This action cannot be undone.',
      onConfirm: () => confirmDeletePersona(personaId)
    })
  }

  const confirmDeletePersona = async (personaId: string) => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    
    try {
      console.log('🗑️ Deleting persona:', personaId)
      
      await apiClient.deletePersona(personaId)
      console.log('✅ Persona deleted')
      
      // Remove from personas list
      setPersonas(prev => prev.filter(p => p.id !== personaId))
      
      // Clear selection if deleted persona was selected
      if (selectedPersona?.id === personaId) {
        setSelectedPersona(null)
        setShowDetails(false)
      }
      
      setError(null)
      
    } catch (error) {
      console.error('❌ Error deleting persona:', error)
      setError('Failed to delete persona. Please try again.')
    }
  }

  const handleCreateStyleReference = async () => {
    if (!selectedPersona) return
    
    try {
      console.log('📄 Creating style reference for persona:', selectedPersona.id)
      console.log('📝 Style reference data:', styleRefFormData)
      
      if (!styleRefFormData.title.trim()) {
        setError('Style reference title is required')
        return
      }
      
      if (!styleRefFormData.content.trim()) {
        setError('Style reference content is required')
        return
      }

      // Set persona_ids to link to current persona
      const styleRefData = {
        ...styleRefFormData,
        persona_ids: [selectedPersona.id]
      }
      
      const newStyleRef = await apiClient.createStyleReference(selectedPersona.id, styleRefData)
      console.log('✅ Style reference created:', newStyleRef)
      
      // Update persona's style references
      const updatedPersona = {
        ...selectedPersona,
        style_references: [...(selectedPersona.style_references || []), newStyleRef]
      }
      
      setSelectedPersona(updatedPersona)
      
      // Update in personas list
      setPersonas(prev => prev.map(p => 
        p.id === selectedPersona.id ? updatedPersona : p
      ))
      
      // Reset form and state
      setStyleRefFormData({
        title: "",
        content: "",
        reference_type: "document",
        url: "",
        document_type: "style_reference",
        is_style_reference: true,
        persona_ids: [],
        platform_data: {}
      })
      setIsCreatingStyleRef(false)
      setError(null)
      
    } catch (error) {
      console.error('❌ Error creating style reference:', error)
      setError('Failed to create style reference. Please try again.')
    }
  }

  const handleUpdateStyleReference = async () => {
    if (!selectedPersona || !editingStyleRefId) return
    
    try {
      console.log('✏️ Updating style reference:', editingStyleRefId)
      
      if (!styleRefFormData.title.trim()) {
        setError('Style reference title is required')
        return
      }
      
      if (!styleRefFormData.content.trim()) {
        setError('Style reference content is required')
        return
      }

      const updatedStyleRef = await apiClient.updateStyleReference(editingStyleRefId, styleRefFormData)
      console.log('✅ Style reference updated:', updatedStyleRef)
      
      // Update in persona's style references
      const updatedPersona = {
        ...selectedPersona,
        style_references: selectedPersona.style_references?.map(ref => 
          ref.id === editingStyleRefId ? updatedStyleRef : ref
        ) || []
      }
      
      setSelectedPersona(updatedPersona)
      
      // Update in personas list
      setPersonas(prev => prev.map(p => 
        p.id === selectedPersona.id ? updatedPersona : p
      ))
      
      setEditingStyleRefId(null)
      setError(null)
      
    } catch (error) {
      console.error('❌ Error updating style reference:', error)
      setError('Failed to update style reference. Please try again.')
    }
  }

  const handleDeleteStyleReference = async (styleRefId: string) => {
    if (!selectedPersona) return
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Style Reference',
      message: 'Are you sure you want to delete this style reference? This action cannot be undone.',
      onConfirm: () => confirmDeleteStyleReference(styleRefId)
    })
  }

  const confirmDeleteStyleReference = async (styleRefId: string) => {
    if (!selectedPersona) return
    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    
    try {
      console.log('🗑️ Deleting style reference:', styleRefId)
      
      await apiClient.deleteStyleReference(styleRefId)
      console.log('✅ Style reference deleted')
      
      // Remove from persona's style references
      const updatedPersona = {
        ...selectedPersona,
        style_references: selectedPersona.style_references?.filter(ref => ref.id !== styleRefId) || []
      }
      
      setSelectedPersona(updatedPersona)
      
      // Update in personas list
      setPersonas(prev => prev.map(p => 
        p.id === selectedPersona.id ? updatedPersona : p
      ))
      
      setError(null)
      
    } catch (error) {
      console.error('❌ Error deleting style reference:', error)
      setError('Failed to delete style reference. Please try again.')
    }
  }

  const startEditingPersona = (persona: Persona) => {
    console.log('✏️ Starting to edit persona:', persona.id)
    
    // Set the selected persona and clear other states
    setSelectedPersona(persona)
    setShowDetails(false)
    setIsCreating(false)
    setIsCreatingStyleRef(false)
    setEditingStyleRefId(null)
    
    // Populate the form with persona data
    setPersonaFormData({
      name: persona.name,
      description: persona.description || "",
      style_preferences: {
        tone: (persona.style_preferences as any)?.tone || "",
        voice: (persona.style_preferences as any)?.voice || "",
        writing_style: (persona.style_preferences as any)?.writing_style || "",
        target_audience: (persona.style_preferences as any)?.target_audience || "",
        content_type: (persona.style_preferences as any)?.content_type || "",
        key_phrases: (persona.style_preferences as any)?.key_phrases || "",
        avoid_phrases: (persona.style_preferences as any)?.avoid_phrases || "",
        use_emojis: (persona.style_preferences as any)?.use_emojis || false
      }
    })
    
    setIsEditing(true)
    setError(null)
  }

  const startEditingStyleRef = (styleRef: Document) => {
    console.log('✏️ Starting to edit style reference:', styleRef.id)
    setStyleRefFormData({
      title: styleRef.title,
      content: styleRef.content,
      reference_type: styleRef.reference_type || "text",
      url: styleRef.url || "",
      document_type: styleRef.document_type || "style_reference",
      is_style_reference: true,
      persona_ids: styleRef.persona_ids || [],
      platform_data: styleRef.platform_data || {}
    })
    setEditingStyleRefId(styleRef.id)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditingStyleRefId(null)
    setIsCreating(false)
    setIsCreatingStyleRef(false)
    setError(null)
    
    // If there's a selected persona, show details view
    if (selectedPersona) {
      setShowDetails(true)
    }
    
    // Reset forms
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
        avoid_phrases: "",
        use_emojis: false
      }
    })
    setStyleRefFormData({
      title: "",
      content: "",
      reference_type: "document",
      url: "",
      document_type: "style_reference",
      is_style_reference: true,
      persona_ids: [],
      platform_data: {}
    })
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
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Personas</h1>
            <p className="text-gray-400 mt-2">Manage your AI personas and their style references</p>
          </div>
        <Button onClick={startCreating} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Persona
        </Button>
      </div>

        {error && (
          <div className="bg-red-900/20 border border-red-600 text-red-400 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personas List */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5" />
                Your Personas ({personas.length})
              </CardTitle>
              <CardDescription className="text-gray-400">
                Click on a persona to view details and manage style references
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {personas.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No personas yet</p>
                      <p className="text-sm">Create your first persona to get started</p>
                    </div>
                  ) : (
                    personas.map((persona) => (
                      <div
                        key={persona.id}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                          selectedPersona?.id === persona.id
                            ? 'border-blue-500 bg-blue-900/20'
                            : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1" onClick={() => handlePersonaClick(persona)}>
                            <h3 className="font-medium text-white">{persona.name}</h3>
                            {persona.description && (
                              <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                {persona.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="text-xs bg-blue-600 text-white">
                                {persona.style_references?.length || 0} references
                              </Badge>
                              {persona.is_active !== false && (
                                <Badge className="text-xs bg-green-600 text-white">
                                  Active
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditingPersona(persona)
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeletePersona(persona.id)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
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
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Plus className="h-5 w-5" />
                  Create New Persona
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Define a new AI persona with specific style preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">Name *</Label>
                  <Input
                    id="name"
                    value={personaFormData.name}
                    onChange={(e) => setPersonaFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Professional Tech Expert"
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-gray-300">Description</Label>
                  <Textarea
                    id="description"
                    value={personaFormData.description}
                    onChange={(e) => setPersonaFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this persona's role and characteristics..."
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                    rows={3}
                  />
                </div>

                {/* Style Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Style Preferences</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="create-tone" className="text-gray-300">Tone</Label>
                      <Input
                        id="create-tone"
                        value={personaFormData.style_preferences.tone}
                        onChange={(e) => setPersonaFormData(prev => ({
                          ...prev,
                          style_preferences: {
                            ...prev.style_preferences,
                            tone: e.target.value
                          }
                        }))}
                        placeholder="e.g., Professional, Casual, Friendly"
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="create-voice" className="text-gray-300">Voice</Label>
                      <Input
                        id="create-voice"
                        value={personaFormData.style_preferences.voice}
                        onChange={(e) => setPersonaFormData(prev => ({
                          ...prev,
                          style_preferences: {
                            ...prev.style_preferences,
                            voice: e.target.value
                          }
                        }))}
                        placeholder="e.g., Authoritative, Conversational"
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="create-writing-style" className="text-gray-300">Writing Style</Label>
                      <Input
                        id="create-writing-style"
                        value={personaFormData.style_preferences.writing_style}
                        onChange={(e) => setPersonaFormData(prev => ({
                          ...prev,
                          style_preferences: {
                            ...prev.style_preferences,
                            writing_style: e.target.value
                          }
                        }))}
                        placeholder="e.g., Concise, Detailed, Storytelling"
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="create-target-audience" className="text-gray-300">Target Audience</Label>
                      <Input
                        id="create-target-audience"
                        value={personaFormData.style_preferences.target_audience}
                        onChange={(e) => setPersonaFormData(prev => ({
                          ...prev,
                          style_preferences: {
                            ...prev.style_preferences,
                            target_audience: e.target.value
                          }
                        }))}
                        placeholder="e.g., Tech professionals, General audience"
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="create-content-type" className="text-gray-300">Content Type</Label>
                      <Input
                        id="create-content-type"
                        value={personaFormData.style_preferences.content_type}
                        onChange={(e) => setPersonaFormData(prev => ({
                          ...prev,
                          style_preferences: {
                            ...prev.style_preferences,
                            content_type: e.target.value
                          }
                        }))}
                        placeholder="e.g., Social media, Blog posts, Comments"
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="create-key-phrases" className="text-gray-300">Key Phrases</Label>
                    <Textarea
                      id="create-key-phrases"
                      value={personaFormData.style_preferences.key_phrases}
                      onChange={(e) => setPersonaFormData(prev => ({
                        ...prev,
                        style_preferences: {
                          ...prev.style_preferences,
                          key_phrases: e.target.value
                        }
                      }))}
                      placeholder="Phrases this persona commonly uses (comma-separated)"
                      className="mt-1 bg-gray-700 border-gray-600 text-white"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="create-avoid-phrases" className="text-gray-300">Avoid Phrases</Label>
                    <Textarea
                      id="create-avoid-phrases"
                      value={personaFormData.style_preferences.avoid_phrases}
                      onChange={(e) => setPersonaFormData(prev => ({
                        ...prev,
                        style_preferences: {
                          ...prev.style_preferences,
                          avoid_phrases: e.target.value
                        }
                      }))}
                      placeholder="Phrases this persona should avoid (comma-separated)"
                      className="mt-1 bg-gray-700 border-gray-600 text-white"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="create-use-emojis"
                      checked={personaFormData.style_preferences.use_emojis}
                      onCheckedChange={(checked) => 
                        setPersonaFormData(prev => ({
                          ...prev,
                          style_preferences: {
                            ...prev.style_preferences,
                            use_emojis: checked === true
                          }
                        }))
                      }
                    />
                    <Label htmlFor="create-use-emojis" className="text-gray-300">
                      Use emojis in generated content 🎭
                    </Label>
                  </div>
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
          ) : isEditing && selectedPersona ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Edit className="h-5 w-5" />
                  Edit Persona: {selectedPersona.name}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Update this persona's information and style preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="edit-name" className="text-gray-300">Name *</Label>
                  <Input
                    id="edit-name"
                    value={personaFormData.name}
                    onChange={(e) => setPersonaFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Professional Tech Expert"
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-description" className="text-gray-300">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={personaFormData.description}
                    onChange={(e) => setPersonaFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this persona's role and characteristics..."
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                    rows={3}
                  />
                </div>

                {/* Style Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Style Preferences</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-tone" className="text-gray-300">Tone</Label>
                      <Input
                        id="edit-tone"
                        value={personaFormData.style_preferences.tone}
                        onChange={(e) => setPersonaFormData(prev => ({
                          ...prev,
                          style_preferences: {
                            ...prev.style_preferences,
                            tone: e.target.value
                          }
                        }))}
                        placeholder="e.g., Professional, Casual, Friendly"
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-voice" className="text-gray-300">Voice</Label>
                      <Input
                        id="edit-voice"
                        value={personaFormData.style_preferences.voice}
                        onChange={(e) => setPersonaFormData(prev => ({
                          ...prev,
                          style_preferences: {
                            ...prev.style_preferences,
                            voice: e.target.value
                          }
                        }))}
                        placeholder="e.g., Authoritative, Conversational"
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-writing-style" className="text-gray-300">Writing Style</Label>
                      <Input
                        id="edit-writing-style"
                        value={personaFormData.style_preferences.writing_style}
                        onChange={(e) => setPersonaFormData(prev => ({
                          ...prev,
                          style_preferences: {
                            ...prev.style_preferences,
                            writing_style: e.target.value
                          }
                        }))}
                        placeholder="e.g., Concise, Detailed, Storytelling"
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-target-audience" className="text-gray-300">Target Audience</Label>
                      <Input
                        id="edit-target-audience"
                        value={personaFormData.style_preferences.target_audience}
                        onChange={(e) => setPersonaFormData(prev => ({
                          ...prev,
                          style_preferences: {
                            ...prev.style_preferences,
                            target_audience: e.target.value
                          }
                        }))}
                        placeholder="e.g., Tech professionals, General audience"
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-content-type" className="text-gray-300">Content Type</Label>
                      <Input
                        id="edit-content-type"
                        value={personaFormData.style_preferences.content_type}
                        onChange={(e) => setPersonaFormData(prev => ({
                          ...prev,
                          style_preferences: {
                            ...prev.style_preferences,
                            content_type: e.target.value
                          }
                        }))}
                        placeholder="e.g., Social media, Blog posts, Comments"
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-key-phrases" className="text-gray-300">Key Phrases</Label>
                    <Textarea
                      id="edit-key-phrases"
                      value={personaFormData.style_preferences.key_phrases}
                      onChange={(e) => setPersonaFormData(prev => ({
                        ...prev,
                        style_preferences: {
                          ...prev.style_preferences,
                          key_phrases: e.target.value
                        }
                      }))}
                      placeholder="Phrases this persona commonly uses (comma-separated)"
                      className="mt-1 bg-gray-700 border-gray-600 text-white"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-avoid-phrases" className="text-gray-300">Avoid Phrases</Label>
                    <Textarea
                      id="edit-avoid-phrases"
                      value={personaFormData.style_preferences.avoid_phrases}
                      onChange={(e) => setPersonaFormData(prev => ({
                        ...prev,
                        style_preferences: {
                          ...prev.style_preferences,
                          avoid_phrases: e.target.value
                        }
                      }))}
                      placeholder="Phrases this persona should avoid (comma-separated)"
                      className="mt-1 bg-gray-700 border-gray-600 text-white"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-use-emojis"
                      checked={personaFormData.style_preferences.use_emojis}
                      onCheckedChange={(checked) => 
                        setPersonaFormData(prev => ({
                          ...prev,
                          style_preferences: {
                            ...prev.style_preferences,
                            use_emojis: checked === true
                          }
                        }))
                      }
                    />
                    <Label htmlFor="edit-use-emojis" className="text-gray-300">
                      Use emojis in generated content 🎭
                    </Label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleUpdatePersona} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Update Persona
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
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <User className="h-5 w-5" />
                        {selectedPersona.name}
                      </CardTitle>
                      <CardDescription className="mt-2 text-gray-400">
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
                              <Label className="text-sm font-medium text-gray-300">
                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Label>
                              <p className="text-sm text-white mt-1">{value}</p>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Style References */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <FileText className="h-5 w-5" />
                        Style References ({selectedPersona.style_references?.length || 0})
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Example content that defines this persona's writing style
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => setIsCreatingStyleRef(true)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Reference
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedPersona.style_references && selectedPersona.style_references.length > 0 ? (
                      selectedPersona.style_references.map((styleRef) => (
                        <div key={styleRef.id} className="p-4 border border-gray-600 rounded-lg bg-gray-700/30">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-white">{styleRef.title}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs bg-gray-600 text-gray-200 border-gray-500">
                                {styleRef.reference_type || 'text'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => startEditingStyleRef(styleRef)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteStyleReference(styleRef.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">
                            {styleRef.content.length > 200 
                              ? `${styleRef.content.substring(0, 200)}...` 
                              : styleRef.content}
                          </p>
                          {styleRef.url && (
                            <a 
                              href={styleRef.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              View Source
                            </a>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-white">No style references yet</p>
                        <p className="text-sm text-gray-400">Add style references to define this persona's writing style</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Create Style Reference Form */}
              {isCreatingStyleRef && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Plus className="h-5 w-5" />
                      Add Style Reference
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Add example content that defines this persona's writing style
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="styleref-title" className="text-gray-300">Title *</Label>
                      <Input
                        id="styleref-title"
                        value={styleRefFormData.title}
                        onChange={(e) => setStyleRefFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Professional LinkedIn Post Example"
                        className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="styleref-content" className="text-gray-300">Content *</Label>
                      <Textarea
                        id="styleref-content"
                        value={styleRefFormData.content}
                        onChange={(e) => setStyleRefFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Paste example content that represents this persona's style..."
                        className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                        rows={6}
                      />
                    </div>

                    <div>
                      <Label htmlFor="styleref-type" className="text-gray-300">Reference Type</Label>
                      <select
                        id="styleref-type"
                        value={styleRefFormData.reference_type || 'document'}
                        onChange={(e) => setStyleRefFormData(prev => ({ ...prev, reference_type: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="document">Document</option>
                        <option value="url">URL</option>
                        <option value="tweet">Tweet</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="styleref-url" className="text-gray-300">Source URL (optional)</Label>
                      <Input
                        id="styleref-url"
                        value={styleRefFormData.url || ''}
                        onChange={(e) => setStyleRefFormData(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://example.com/source"
                        className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleCreateStyleReference} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Add Reference
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreatingStyleRef(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Edit Style Reference Form */}
              {editingStyleRefId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit className="h-5 w-5" />
                      Edit Style Reference
                    </CardTitle>
                    <CardDescription>
                      Update this style reference content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="edit-styleref-title">Title *</Label>
                      <Input
                        id="edit-styleref-title"
                        value={styleRefFormData.title}
                        onChange={(e) => setStyleRefFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Professional LinkedIn Post Example"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-styleref-content">Content *</Label>
                      <Textarea
                        id="edit-styleref-content"
                        value={styleRefFormData.content}
                        onChange={(e) => setStyleRefFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Paste example content that represents this persona's style..."
                        className="mt-1"
                        rows={6}
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-styleref-type">Reference Type</Label>
                      <select
                        id="edit-styleref-type"
                        value={styleRefFormData.reference_type || 'text'}
                        onChange={(e) => setStyleRefFormData(prev => ({ ...prev, reference_type: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="text">Text Content</option>
                        <option value="url">Web URL</option>
                        <option value="tweet">Twitter/X Post</option>
                        <option value="document">Document</option>
                        <option value="pdf">PDF</option>
                        <option value="markdown">Markdown</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="edit-styleref-url">Source URL (optional)</Label>
                      <Input
                        id="edit-styleref-url"
                        value={styleRefFormData.url || ''}
                        onChange={(e) => setStyleRefFormData(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://example.com/source"
                        className="mt-1"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleUpdateStyleReference} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Update Reference
                      </Button>
                      <Button variant="outline" onClick={() => setEditingStyleRefId(null)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-gray-400">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-white">Select a persona to view details</p>
                  <p className="text-sm text-gray-400">or create a new persona to get started</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDialog.onConfirm}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
