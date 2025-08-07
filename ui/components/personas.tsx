"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { apiClient, Persona as BasePersona, StyleReference as APIStyleReference, StyleReferenceCreate } from "./api-client"

// Extended persona interface for UI with additional fields
interface Persona extends BasePersona {
  is_active?: boolean
  updated_at?: string
  style_references?: APIStyleReference[]
}

export function Personas() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingStyleRef, setIsAddingStyleRef] = useState(false)

  // Form state for creating/editing personas
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    style_preferences: {
      tone: "",
      writing_style: "",
      target_audience: "",
      content_type: "",
      key_phrases: "",
      avoid_phrases: ""
    }
  })

  // Form state for creating style references
  const [styleRefFormData, setStyleRefFormData] = useState<StyleReferenceCreate>({
    reference_type: "url",
    content_url: "",
    content_text: "",
    meta_data: {}
  })

  // Load personas on component mount
  useEffect(() => {
    fetchPersonas()
  }, [])

  const fetchPersonas = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getPersonas()
      setPersonas(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load personas')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePersona = async () => {
    try {
      const newPersona = await apiClient.createPersona(formData)
      setPersonas([...personas, newPersona])
      setIsCreating(false)
      setFormData({ 
        name: "", 
        description: "", 
        style_preferences: {
          tone: "",
          writing_style: "",
          target_audience: "",
          content_type: "",
          key_phrases: "",
          avoid_phrases: ""
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create persona')
    }
  }

  const handleDeletePersona = async (personaId: string) => {
    try {
      await apiClient.deletePersona(personaId)
      setPersonas(personas.filter(p => p.id !== personaId))
      if (selectedPersona?.id === personaId) {
        setSelectedPersona(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete persona')
    }
  }

  const handleCreateStyleReference = async () => {
    if (!selectedPersona) return
    
    try {
      const newStyleRef = await apiClient.createStyleReference(selectedPersona.id, styleRefFormData)
      // Update the selected persona with the new style reference
      const updatedPersona = {
        ...selectedPersona,
        style_references: [...(selectedPersona.style_references || []), newStyleRef]
      }
      setSelectedPersona(updatedPersona)
      // Also update in the personas list
      setPersonas(personas.map(p => p.id === selectedPersona.id ? updatedPersona : p))
      setIsAddingStyleRef(false)
      setStyleRefFormData({
        reference_type: "url",
        content_url: "",
        content_text: "",
        meta_data: {}
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create style reference')
    }
  }

  const handleDeleteStyleReference = async (styleRefId: string) => {
    if (!selectedPersona) return
    
    try {
      await apiClient.deleteStyleReference(styleRefId)
      // Update the selected persona by removing the deleted style reference
      const updatedPersona = {
        ...selectedPersona,
        style_references: selectedPersona.style_references?.filter(ref => ref.id !== styleRefId) || []
      }
      setSelectedPersona(updatedPersona)
      // Also update in the personas list
      setPersonas(personas.map(p => p.id === selectedPersona.id ? updatedPersona : p))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete style reference')
    }
  }

  const handleEditPersona = async () => {
    if (!selectedPersona) return
    
    try {
      const updatedPersona = await apiClient.updatePersona(selectedPersona.id, {
        name: formData.name,
        description: formData.description,
        style_preferences: formData.style_preferences
      })
      // Merge the updated data with existing persona data
      const mergedPersona = { ...selectedPersona, ...updatedPersona }
      setSelectedPersona(mergedPersona)
      // Also update in the personas list
      setPersonas(personas.map(p => p.id === selectedPersona.id ? mergedPersona : p))
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update persona')
    }
  }

  const startEditingPersona = () => {
    if (!selectedPersona) return
    
    // Pre-populate form with current persona data
    setFormData({
      name: selectedPersona.name,
      description: selectedPersona.description || "",
      style_preferences: {
        tone: selectedPersona.style_preferences?.tone || "",
        writing_style: selectedPersona.style_preferences?.writing_style || "",
        target_audience: selectedPersona.style_preferences?.target_audience || "",
        content_type: selectedPersona.style_preferences?.content_type || "",
        key_phrases: selectedPersona.style_preferences?.key_phrases || "",
        avoid_phrases: selectedPersona.style_preferences?.avoid_phrases || ""
      }
    })
    setIsEditing(true)
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-gray-900 text-white">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              Personas
            </h1>
            <p className="text-gray-400 mt-1">
              Manage your AI writing personas and style guides
            </p>
          </div>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Persona
          </Button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personas List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Personas</h2>
            
            {personas.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6 text-center">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No personas created yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Create your first persona to define AI writing styles
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {personas.map((persona) => (
                    <Card 
                      key={persona.id}
                      className={`bg-gray-800 border-gray-700 cursor-pointer transition-colors ${
                        selectedPersona?.id === persona.id ? 'border-blue-500' : 'hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedPersona(persona)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-white text-base">
                              {persona.name}
                            </CardTitle>
                            <CardDescription className="text-gray-400 text-sm mt-1">
                              {persona.description ?? ''}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={persona.is_active !== false ? "default" : "secondary"}>
                              {persona.is_active !== false ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeletePersona(persona.id)
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {persona.style_references?.length || 0} style guides
                          </span>
                          <span>
                            Created {new Date(persona.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Persona Details / Create Form */}
          <div>
            {isCreating ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Create New Persona</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsCreating(false)
                        setFormData({ 
                          name: "", 
                          description: "", 
                          style_preferences: {
                            tone: "",
                            writing_style: "",
                            target_audience: "",
                            content_type: "",
                            key_phrases: "",
                            avoid_phrases: ""
                          }
                        })
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-300 border-b border-gray-600 pb-2">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium">Persona Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Professional Writer, Casual Blogger"
                          className="bg-gray-700 border-gray-600 mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Describe this persona's writing style and voice..."
                          className="bg-gray-700 border-gray-600 mt-1"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Style Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-300 border-b border-gray-600 pb-2">
                      Style Preferences
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tone" className="text-sm font-medium">Tone</Label>
                        <Input
                          id="tone"
                          value={formData.style_preferences.tone}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            style_preferences: { ...formData.style_preferences, tone: e.target.value }
                          })}
                          placeholder="e.g., Professional, Casual, Friendly"
                          className="bg-gray-700 border-gray-600 mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="writing_style" className="text-sm font-medium">Writing Style</Label>
                        <Input
                          id="writing_style"
                          value={formData.style_preferences.writing_style}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            style_preferences: { ...formData.style_preferences, writing_style: e.target.value }
                          })}
                          placeholder="e.g., Concise, Detailed, Conversational"
                          className="bg-gray-700 border-gray-600 mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="target_audience" className="text-sm font-medium">Target Audience</Label>
                        <Input
                          id="target_audience"
                          value={formData.style_preferences.target_audience}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            style_preferences: { ...formData.style_preferences, target_audience: e.target.value }
                          })}
                          placeholder="e.g., Business professionals, Tech enthusiasts"
                          className="bg-gray-700 border-gray-600 mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="content_type" className="text-sm font-medium">Content Type</Label>
                        <Input
                          id="content_type"
                          value={formData.style_preferences.content_type}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            style_preferences: { ...formData.style_preferences, content_type: e.target.value }
                          })}
                          placeholder="e.g., Social media, Blog posts, Tweets"
                          className="bg-gray-700 border-gray-600 mt-1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="key_phrases" className="text-sm font-medium">Key Phrases to Include</Label>
                        <Input
                          id="key_phrases"
                          value={formData.style_preferences.key_phrases}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            style_preferences: { ...formData.style_preferences, key_phrases: e.target.value }
                          })}
                          placeholder="e.g., innovative, cutting-edge, user-friendly (comma separated)"
                          className="bg-gray-700 border-gray-600 mt-1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="avoid_phrases" className="text-sm font-medium">Phrases to Avoid</Label>
                        <Input
                          id="avoid_phrases"
                          value={formData.style_preferences.avoid_phrases}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            style_preferences: { ...formData.style_preferences, avoid_phrases: e.target.value }
                          })}
                          placeholder="e.g., outdated, boring, complicated (comma separated)"
                          className="bg-gray-700 border-gray-600 mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-600">
                    <Button 
                      onClick={handleCreatePersona}
                      disabled={!formData.name.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Create Persona
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsCreating(false)
                        setFormData({ 
                          name: "", 
                          description: "", 
                          style_preferences: {
                            tone: "",
                            writing_style: "",
                            target_audience: "",
                            content_type: "",
                            key_phrases: "",
                            avoid_phrases: ""
                          }
                        })
                      }}
                      className="px-6"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : selectedPersona ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{isEditing ? "Edit Persona" : selectedPersona.name}</CardTitle>
                      <CardDescription>{isEditing ? "Update persona details and style preferences" : selectedPersona.description}</CardDescription>
                    </div>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false)
                          // Reset form data
                          setFormData({
                            name: "",
                            description: "",
                            style_preferences: {
                              tone: "",
                              writing_style: "",
                              target_audience: "",
                              content_type: "",
                              key_phrases: "",
                              avoid_phrases: ""
                            }
                          })
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isEditing ? (
                    /* Edit Form */
                    <>
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-300 border-b border-gray-600 pb-2">
                          Basic Information
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label htmlFor="edit_name" className="text-sm font-medium">Persona Name *</Label>
                            <Input
                              id="edit_name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="e.g., Professional Writer, Casual Blogger"
                              className="bg-gray-700 border-gray-600 mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit_description" className="text-sm font-medium">Description</Label>
                            <Textarea
                              id="edit_description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              placeholder="Describe this persona's writing style and voice..."
                              className="bg-gray-700 border-gray-600 mt-1"
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Style Preferences */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-300 border-b border-gray-600 pb-2">
                          Style Preferences
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit_tone" className="text-sm font-medium">Tone</Label>
                            <Input
                              id="edit_tone"
                              value={formData.style_preferences.tone}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                style_preferences: { ...formData.style_preferences, tone: e.target.value }
                              })}
                              placeholder="e.g., Professional, Casual, Friendly"
                              className="bg-gray-700 border-gray-600 mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit_writing_style" className="text-sm font-medium">Writing Style</Label>
                            <Input
                              id="edit_writing_style"
                              value={formData.style_preferences.writing_style}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                style_preferences: { ...formData.style_preferences, writing_style: e.target.value }
                              })}
                              placeholder="e.g., Concise, Detailed, Conversational"
                              className="bg-gray-700 border-gray-600 mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit_target_audience" className="text-sm font-medium">Target Audience</Label>
                            <Input
                              id="edit_target_audience"
                              value={formData.style_preferences.target_audience}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                style_preferences: { ...formData.style_preferences, target_audience: e.target.value }
                              })}
                              placeholder="e.g., Business professionals, Tech enthusiasts"
                              className="bg-gray-700 border-gray-600 mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit_content_type" className="text-sm font-medium">Content Type</Label>
                            <Input
                              id="edit_content_type"
                              value={formData.style_preferences.content_type}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                style_preferences: { ...formData.style_preferences, content_type: e.target.value }
                              })}
                              placeholder="e.g., Social media, Blog posts, Tweets"
                              className="bg-gray-700 border-gray-600 mt-1"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="edit_key_phrases" className="text-sm font-medium">Key Phrases to Include</Label>
                            <Input
                              id="edit_key_phrases"
                              value={formData.style_preferences.key_phrases}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                style_preferences: { ...formData.style_preferences, key_phrases: e.target.value }
                              })}
                              placeholder="e.g., innovative, cutting-edge, user-friendly (comma separated)"
                              className="bg-gray-700 border-gray-600 mt-1"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="edit_avoid_phrases" className="text-sm font-medium">Phrases to Avoid</Label>
                            <Input
                              id="edit_avoid_phrases"
                              value={formData.style_preferences.avoid_phrases}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                style_preferences: { ...formData.style_preferences, avoid_phrases: e.target.value }
                              })}
                              placeholder="e.g., outdated, boring, complicated (comma separated)"
                              className="bg-gray-700 border-gray-600 mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-gray-600">
                        <Button 
                          onClick={handleEditPersona}
                          disabled={!formData.name.trim()}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsEditing(false)
                            setFormData({
                              name: "",
                              description: "",
                              style_preferences: {
                                tone: "",
                                writing_style: "",
                                target_audience: "",
                                content_type: "",
                                key_phrases: "",
                                avoid_phrases: ""
                              }
                            })
                          }}
                          className="px-6"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    /* View Mode */
                    <>
                      {/* Style Preferences */}
                      <div>
                        <h3 className="font-medium mb-3 text-gray-300 border-b border-gray-600 pb-2">Style Preferences</h3>
                        {selectedPersona.style_preferences && Object.keys(selectedPersona.style_preferences).length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedPersona.style_preferences.tone && (
                              <div className="bg-gray-700 p-3 rounded">
                                <span className="text-sm font-medium text-gray-300">Tone</span>
                                <p className="text-sm text-white mt-1">{selectedPersona.style_preferences.tone}</p>
                              </div>
                            )}
                            {selectedPersona.style_preferences.writing_style && (
                              <div className="bg-gray-700 p-3 rounded">
                                <span className="text-sm font-medium text-gray-300">Writing Style</span>
                                <p className="text-sm text-white mt-1">{selectedPersona.style_preferences.writing_style}</p>
                              </div>
                            )}
                            {selectedPersona.style_preferences.target_audience && (
                              <div className="bg-gray-700 p-3 rounded">
                                <span className="text-sm font-medium text-gray-300">Target Audience</span>
                                <p className="text-sm text-white mt-1">{selectedPersona.style_preferences.target_audience}</p>
                              </div>
                            )}
                            {selectedPersona.style_preferences.content_type && (
                              <div className="bg-gray-700 p-3 rounded">
                                <span className="text-sm font-medium text-gray-300">Content Type</span>
                                <p className="text-sm text-white mt-1">{selectedPersona.style_preferences.content_type}</p>
                              </div>
                            )}
                            {selectedPersona.style_preferences.key_phrases && (
                              <div className="bg-gray-700 p-3 rounded md:col-span-2">
                                <span className="text-sm font-medium text-gray-300">Key Phrases to Include</span>
                                <p className="text-sm text-white mt-1">{selectedPersona.style_preferences.key_phrases}</p>
                              </div>
                            )}
                            {selectedPersona.style_preferences.avoid_phrases && (
                              <div className="bg-gray-700 p-3 rounded md:col-span-2">
                                <span className="text-sm font-medium text-gray-300">Phrases to Avoid</span>
                                <p className="text-sm text-white mt-1">{selectedPersona.style_preferences.avoid_phrases}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm">No style preferences defined</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Style References */}
                  <div>
                    <h3 className="font-medium mb-3 text-gray-300 border-b border-gray-600 pb-2">Style References</h3>
                    {selectedPersona.style_references && selectedPersona.style_references.length > 0 ? (
                      <div className="space-y-2">
                        {selectedPersona.style_references.map((ref: APIStyleReference) => (
                          <div key={ref.id} className="bg-gray-700 p-3 rounded">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {ref.reference_type.charAt(0).toUpperCase() + ref.reference_type.slice(1)}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteStyleReference(ref.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            {ref.meta_data?.title && (
                              <p className="text-sm font-medium text-gray-300 mt-2">
                                {ref.meta_data.title}
                              </p>
                            )}
                            {ref.meta_data?.author && (
                              <p className="text-xs text-gray-400 mt-1">
                                by {ref.meta_data.author}
                              </p>
                            )}
                            {ref.content_text && (
                              <p className="text-sm text-gray-400 mt-2 truncate">
                                {ref.content_text.substring(0, 150)}...
                              </p>
                            )}
                            {ref.content_url && (
                              <p className="text-sm text-blue-400 mt-1 truncate">
                                {ref.content_url}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No style references added yet</p>
                    )}
                  </div>
                  
                  {/* Add Style Reference Form */}
                  {isAddingStyleRef ? (
                    <div className="space-y-4 p-4 bg-gray-700 rounded border">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-300">Add Style Reference</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsAddingStyleRef(false)
                            setStyleRefFormData({
                              reference_type: "url",
                              content_url: "",
                              content_text: "",
                              meta_data: {}
                            })
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="reference_type" className="text-sm font-medium">Reference Type *</Label>
                          <select
                            id="reference_type"
                            value={styleRefFormData.reference_type}
                            onChange={(e) => setStyleRefFormData({ 
                              ...styleRefFormData, 
                              reference_type: e.target.value 
                            })}
                            className="w-full mt-1 bg-gray-600 border-gray-500 text-white rounded px-3 py-2"
                          >
                            <option value="url">URL</option>
                            <option value="tweet">Tweet</option>
                            <option value="pdf">PDF</option>
                            <option value="markdown">Markdown</option>
                          </select>
                        </div>
                        
                        {(styleRefFormData.reference_type === "url" || styleRefFormData.reference_type === "tweet") && (
                          <div>
                            <Label htmlFor="content_url" className="text-sm font-medium">
                              {styleRefFormData.reference_type === "tweet" ? "Tweet URL" : "Content URL"}
                            </Label>
                            <Input
                              id="content_url"
                              value={styleRefFormData.content_url || ""}
                              onChange={(e) => setStyleRefFormData({ 
                                ...styleRefFormData, 
                                content_url: e.target.value 
                              })}
                              placeholder={styleRefFormData.reference_type === "tweet" ? "https://x.com/user/status/123..." : "https://example.com/article"}
                              className="bg-gray-600 border-gray-500 mt-1"
                            />
                          </div>
                        )}
                        
                        <div>
                          <Label htmlFor="content_text" className="text-sm font-medium">
                            Content Text {(styleRefFormData.reference_type === "markdown" || styleRefFormData.reference_type === "pdf" || styleRefFormData.reference_type === "tweet") ? "*" : "(Optional)"}
                          </Label>
                          <Textarea
                            id="content_text"
                            value={styleRefFormData.content_text || ""}
                            onChange={(e) => setStyleRefFormData({ 
                              ...styleRefFormData, 
                              content_text: e.target.value 
                            })}
                            placeholder={
                              styleRefFormData.reference_type === "tweet" 
                                ? "Paste the tweet text content here (copy from the tweet)..."
                                : styleRefFormData.reference_type === "pdf"
                                ? "Paste the extracted PDF text content here..."
                                : styleRefFormData.reference_type === "markdown"
                                ? "Paste your markdown content here..."
                                : "Paste the content text here..."
                            }
                            className="bg-gray-600 border-gray-500 mt-1"
                            rows={4}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="meta_title" className="text-sm font-medium">Title (Optional)</Label>
                          <Input
                            id="meta_title"
                            value={styleRefFormData.meta_data?.title || ""}
                            onChange={(e) => setStyleRefFormData({ 
                              ...styleRefFormData, 
                              meta_data: { ...styleRefFormData.meta_data, title: e.target.value }
                            })}
                            placeholder="Title or description of this reference"
                            className="bg-gray-600 border-gray-500 mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="meta_author" className="text-sm font-medium">Author (Optional)</Label>
                          <Input
                            id="meta_author"
                            value={styleRefFormData.meta_data?.author || ""}
                            onChange={(e) => setStyleRefFormData({ 
                              ...styleRefFormData, 
                              meta_data: { ...styleRefFormData.meta_data, author: e.target.value }
                            })}
                            placeholder="Author or source"
                            className="bg-gray-600 border-gray-500 mt-1"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-2">
                        <Button 
                          onClick={handleCreateStyleReference}
                          disabled={!styleRefFormData.reference_type || 
                            // Markdown requires content text
                            (styleRefFormData.reference_type === "markdown" && !styleRefFormData.content_text?.trim()) ||
                            // PDF requires content text (extracted text)
                            (styleRefFormData.reference_type === "pdf" && !styleRefFormData.content_text?.trim()) ||
                            // URL requires either URL or content text
                            (styleRefFormData.reference_type === "url" && !styleRefFormData.content_url?.trim() && !styleRefFormData.content_text?.trim()) ||
                            // Tweet requires both URL and content text
                            (styleRefFormData.reference_type === "tweet" && (!styleRefFormData.content_url?.trim() || !styleRefFormData.content_text?.trim()))
                          }
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Add Reference
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsAddingStyleRef(false)
                            setStyleRefFormData({
                              reference_type: "url",
                              content_url: "",
                              content_text: "",
                              meta_data: {}
                            })
                          }}
                          className="px-6"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 pt-4 border-t border-gray-600">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setIsAddingStyleRef(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Style Reference
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={startEditingPersona}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Persona
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6 text-center">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Select a persona to view details</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Click on a persona from the list to see its style guides and settings
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
