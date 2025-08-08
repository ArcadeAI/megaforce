'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Filter, Search, X, ExternalLink, FileText } from 'lucide-react'
import { useAuth } from './auth-context'
import { apiClient, StyleReference, Persona } from './api-client'

const getDisplayReferenceType = (type: string) => {
  const types: Record<string, string> = {
    'url': 'URL',
    'tweet': 'Tweet', 
    'document': 'Document',
    'pdf': 'PDF',
    'markdown': 'Markdown'
  }
  return types[type] || type
}

interface SourceMaterialsProps {
  onNavigateToRun?: (runId: string) => void
  onNavigateToPersona?: (personaId: string) => void
}

export default function SourceMaterials({ onNavigateToRun, onNavigateToPersona }: SourceMaterialsProps) {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<StyleReference[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReferenceType, setSelectedReferenceType] = useState('')

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch documents (which includes source materials)
      const documentsData = await apiClient.getDocuments()
      // Filter for source materials (not style references)
      const sourceMaterials = documentsData.filter((doc: StyleReference) => !doc.is_style_reference)
      setDocuments(sourceMaterials)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load source materials')
    } finally {
      setLoading(false)
    }
  }

  // Filter documents based on search and reference type
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.author?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = !selectedReferenceType || doc.reference_type === selectedReferenceType
    
    return matchesSearch && matchesType
  })

  // Get unique reference types for filter dropdown
  const referenceTypes = [...new Set(documents.map(doc => doc.reference_type).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading source materials...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Source Materials</h2>
        <div className="text-sm text-gray-400">
          {filteredDocuments.length} of {documents.length} materials
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search source materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-600 text-white"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedReferenceType}
            onChange={(e) => setSelectedReferenceType(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
          >
            <option value="">All Types</option>
            {referenceTypes.map(type => (
              <option key={type} value={type}>
                {getDisplayReferenceType(type)}
              </option>
            ))}
          </select>
        </div>
        
        {(searchTerm || selectedReferenceType) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm('')
              setSelectedReferenceType('')
            }}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Source Materials Grid */}
      <div className="grid gap-4">
        {filteredDocuments.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">
                {documents.length === 0 
                  ? "No source materials found. Add some documents to get started."
                  : "No materials match your current filters."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDocuments.map((doc) => (
            <Card key={doc.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {getDisplayReferenceType(doc.reference_type)}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                {doc.title && !doc.title.startsWith('Style Reference') && (
                  <h3 className="text-lg font-medium text-white mb-2 line-clamp-2">
                    {doc.title}
                  </h3>
                )}
                
                {doc.author && (
                  <p className="text-sm text-gray-400 mb-2">
                    by {doc.author}
                  </p>
                )}
                
                {doc.content && (
                  <p className="text-sm text-gray-300 mb-3 line-clamp-3">
                    {doc.content.substring(0, 200)}...
                  </p>
                )}
                
                {doc.url && (
                  <div className="flex items-center gap-2 mt-3">
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm truncate"
                    >
                      {doc.url}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default function SourceMaterials({ onNavigateToRun, onNavigateToPersona }: SourceMaterialsProps) {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form states
  const [isAddingDocument, setIsAddingDocument] = useState(false)
  const [isEditingDocument, setIsEditingDocument] = useState(false)
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null)
  const [documentFormData, setDocumentFormData] = useState<DocumentCreate>({
    title: '',
    content: '',
    document_type: 'source_material',
    reference_type: 'url',
    url: '',
    author: '',
    run_id: ''
  })

  // Filter and search states
  const [filters, setFilters] = useState<FilterState>({
    document_type: '',
    reference_type: '',
    run_id: '',
    search: ''
  })

  useEffect(() => {
    if (user) {
      fetchDocuments()
      fetchPersonas()
      fetchRuns()
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [documents, filters])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      console.log('Fetching source materials...')
      const response = await apiClient.getDocuments()
      console.log('Source materials response:', response)
      
      // Filter to only show source materials (not style references)
      const sourceMaterials = response.filter(doc => !doc.is_style_reference)
      setDocuments(sourceMaterials)
      setError(null)
    } catch (err) {
      console.error('Error fetching source materials:', err)
      setError('Failed to fetch source materials')
    } finally {
      setLoading(false)
    }
  }

  const fetchPersonas = async () => {
    try {
      console.log('Fetching personas...')
      const response = await apiClient.getPersonas()
      setPersonas(response)
    } catch (err) {
      console.error('Error fetching personas:', err)
    }
  }

  const fetchRuns = async () => {
    try {
      console.log('Fetching runs...')
      const response = await apiClient.getRuns()
      setRuns(response)
    } catch (err) {
      console.error('Error fetching runs:', err)
    }
  }

  const applyFilters = () => {
    let filtered = [...documents]

    // Apply search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm) ||
        doc.content.toLowerCase().includes(searchTerm) ||
        (doc.author && doc.author.toLowerCase().includes(searchTerm))
      )
    }

    // Apply document type filter
    if (filters.document_type) {
      filtered = filtered.filter(doc => doc.document_type === filters.document_type)
    }

    // Apply reference type filter
    if (filters.reference_type) {
      filtered = filtered.filter(doc => doc.reference_type === filters.reference_type)
    }

    // Apply run filter
    if (filters.run_id) {
      filtered = filtered.filter(doc => doc.run_id === filters.run_id)
    }

    setFilteredDocuments(filtered)
  }

  const resetForm = () => {
    setDocumentFormData({
      title: '',
      content: '',
      document_type: 'source_material',
      reference_type: 'url',
      url: '',
      author: '',
      run_id: ''
    })
  }

  const handleAddDocument = async () => {
    if (!documentFormData.title.trim() || !documentFormData.content.trim()) {
      setError('Title and content are required')
      return
    }

    try {
      console.log('Creating new source material:', documentFormData)
      await apiClient.createDocument({
        ...documentFormData,
        is_style_reference: false,
        run_id: documentFormData.run_id || undefined
      })
      
      resetForm()
      setIsAddingDocument(false)
      await fetchDocuments()
      setError(null)
    } catch (err) {
      console.error('Error creating source material:', err)
      setError('Failed to create source material')
    }
  }

  const handleEditDocument = async () => {
    if (!editingDocumentId || !documentFormData.title.trim() || !documentFormData.content.trim()) {
      setError('Title and content are required')
      return
    }

    try {
      console.log('Updating source material:', editingDocumentId, documentFormData)
      await apiClient.updateDocument(editingDocumentId, {
        ...documentFormData,
        is_style_reference: false,
        run_id: documentFormData.run_id || undefined
      })
      
      resetForm()
      setIsEditingDocument(false)
      setEditingDocumentId(null)
      await fetchDocuments()
      setError(null)
    } catch (err) {
      console.error('Error updating source material:', err)
      setError('Failed to update source material')
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this source material?')) {
      return
    }

    try {
      console.log('Deleting source material:', documentId)
      await apiClient.deleteDocument(documentId)
      await fetchDocuments()
      setError(null)
    } catch (err) {
      console.error('Error deleting source material:', err)
      setError('Failed to delete source material')
    }
  }

  const handleEditClick = (doc: Document) => {
    setDocumentFormData({
      title: doc.title,
      content: doc.content,
      document_type: doc.document_type || 'source_material',
      reference_type: doc.reference_type || 'url',
      url: doc.url || '',
      author: doc.author || '',
      run_id: doc.run_id || ''
    })
    setEditingDocumentId(doc.id)
    setIsEditingDocument(true)
  }

  const clearFilters = () => {
    setFilters({
      document_type: '',
      reference_type: '',
      run_id: '',
      search: ''
    })
  }

  const getRunName = (runId: string) => {
    const run = runs.find(r => r.id === runId)
    return run ? run.name || `Run ${run.id.slice(0, 8)}` : 'Unknown Run'
  }

  const getLinkedPersonas = (documentId: string) => {
    // This would need to be implemented when we have the PersonaStyleLink API
    // For now, return empty array
    return []
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading source materials...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Source Materials</h2>
          <p className="text-gray-400 mt-1">
            Manage your research materials and source documents
          </p>
        </div>
        <Button 
          onClick={() => setIsAddingDocument(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Material
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
            {(filters.search || filters.document_type || filters.reference_type || filters.run_id) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search materials..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* Document Type Filter */}
            <Select 
              value={filters.document_type} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, document_type: value }))}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="source_material">Source Material</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="reference">Reference</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>

            {/* Reference Type Filter */}
            <Select 
              value={filters.reference_type} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, reference_type: value }))}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Reference Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All References</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="tweet">Tweet</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
              </SelectContent>
            </Select>

            {/* Run Filter */}
            <Select 
              value={filters.run_id} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, run_id: value }))}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Filter by Run" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Runs</SelectItem>
                {runs.map(run => (
                  <SelectItem key={run.id} value={run.id}>
                    {run.name || `Run ${run.id.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Results Count */}
      <div className="text-gray-400 text-sm">
        Showing {filteredDocuments.length} of {documents.length} source materials
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDocuments.map((doc) => (
          <Card key={doc.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-white text-lg mb-2 line-clamp-2">
                    {doc.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {getDisplayDocumentType(doc.document_type || 'source_material')}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getDisplayReferenceType(doc.reference_type || 'url')}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(doc)}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Content Preview */}
              <p className="text-gray-400 text-sm line-clamp-3">
                {doc.content}
              </p>

              {/* Author */}
              {doc.author && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <User className="w-4 h-4" />
                  {doc.author}
                </div>
              )}

              {/* URL */}
              {doc.url && (
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                  <a 
                    href={doc.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 truncate"
                  >
                    {doc.url}
                  </a>
                </div>
              )}

              {/* Run Link */}
              {doc.run_id && (
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-gray-400" />
                  <button
                    onClick={() => onNavigateToRun?.(doc.run_id!)}
                    className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1 hover:underline"
                  >
                    {getRunName(doc.run_id)}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Linked Personas */}
              {getLinkedPersonas(doc.id).length > 0 && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <div className="flex flex-wrap gap-1">
                    {getLinkedPersonas(doc.id).map((personaId) => {
                      const persona = personas.find(p => p.id === personaId)
                      return persona ? (
                        <button
                          key={personaId}
                          onClick={() => onNavigateToPersona?.(personaId)}
                          className="text-purple-400 hover:text-purple-300 text-sm hover:underline"
                        >
                          {persona.name}
                        </button>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                {new Date(doc.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredDocuments.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            {documents.length === 0 ? 'No source materials yet' : 'No materials match your filters'}
          </h3>
          <p className="text-gray-500 mb-4">
            {documents.length === 0 
              ? 'Add your first source material to get started'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {documents.length === 0 && (
            <Button 
              onClick={() => setIsAddingDocument(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Source Material
            </Button>
          )}
        </div>
      )}

      {/* Add/Edit Document Modal */}
      {(isAddingDocument || isEditingDocument) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  {isEditingDocument ? 'Edit Source Material' : 'Add Source Material'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAddingDocument(false)
                    setIsEditingDocument(false)
                    setEditingDocumentId(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <Input
                  value={documentFormData.title}
                  onChange={(e) => setDocumentFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter document title"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content *
                </label>
                <Textarea
                  value={documentFormData.content}
                  onChange={(e) => setDocumentFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter document content"
                  className="bg-gray-700 border-gray-600 text-white min-h-[120px]"
                />
              </div>

              {/* Document Type and Reference Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Document Type
                  </label>
                  <Select 
                    value={documentFormData.document_type} 
                    onValueChange={(value) => setDocumentFormData(prev => ({ ...prev, document_type: value }))}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="source_material">Source Material</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="reference">Reference</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Reference Type
                  </label>
                  <Select 
                    value={documentFormData.reference_type} 
                    onValueChange={(value) => setDocumentFormData(prev => ({ ...prev, reference_type: value }))}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="tweet">Tweet</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="markdown">Markdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* URL and Author */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL (Optional)
                  </label>
                  <Input
                    value={documentFormData.url}
                    onChange={(e) => setDocumentFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Author (Optional)
                  </label>
                  <Input
                    value={documentFormData.author}
                    onChange={(e) => setDocumentFormData(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="Author name"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              {/* Run Association */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Associate with Run (Optional)
                </label>
                <Select 
                  value={documentFormData.run_id} 
                  onValueChange={(value) => setDocumentFormData(prev => ({ ...prev, run_id: value }))}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select a run" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No run association</SelectItem>
                    {runs.map(run => (
                      <SelectItem key={run.id} value={run.id}>
                        {run.name || `Run ${run.id.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingDocument(false)
                    setIsEditingDocument(false)
                    setEditingDocumentId(null)
                    resetForm()
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={isEditingDocument ? handleEditDocument : handleAddDocument}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isEditingDocument ? 'Update Material' : 'Add Material'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
