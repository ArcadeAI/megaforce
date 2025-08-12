'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from './ui/card'
import { TwitterSearchRequest } from './api-client'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Search, FileText, X, User, ExternalLink, Edit, Trash2 } from 'lucide-react'
import { useAuth } from './auth-context'
import { apiClient } from './api-client'

interface Document {
  id: string
  title: string
  content: string
  url?: string
  author?: string
  score: number
  priority: number
  reference_type?: string
  owner_id: string
  run_id?: string
  created_at: string
  persona_id?: string
  persona_ids?: string[]
  persona?: {
    id: string
    name: string
  }
  persona_style_links?: Array<{
    persona_id: string
    persona: {
      id: string
      name: string
    }
  }>
}

interface Run {
  id: string
  name: string
  status: string
  started_at: string
  completed_at?: string
  meta_data?: any
  input_source?: {
    id: string
    name: string
    source_type: string
    source_config: any
  }
  documents?: Document[]
}

export default function SourceMaterials() {
  const { user } = useAuth()
  const router = useRouter()
  
  // State for documents and filtering
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Filter state
  const [filterType, setFilterType] = useState<'none' | 'documents' | 'tweets' | 'urls' | 'all' | 'run' | 'persona' | 'content'>('none')
  const [filterRunId, setFilterRunId] = useState('')
  const [filterPersonaId, setFilterPersonaId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // New run creation state
  const [newRunForm, setNewRunForm] = useState({
    searchQuery: '',
    searchType: 'keywords',
    limit: 20,
    rank_tweets: true,  // Re-enabled now that OpenAI API key is available
    llm_provider: 'openai',
    llm_model: 'gpt-4o-mini',
    api_key: '',
    arcade_user: '',
    arcade_secret: ''
  })
  const [newRunLoading, setNewRunLoading] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{show: boolean, docId: string, title: string}>({show: false, docId: '', title: ''})
  const [personaLinking, setPersonaLinking] = useState<{show: boolean, docId: string, docTitle: string}>({show: false, docId: '', docTitle: ''})
  const [availablePersonas, setAvailablePersonas] = useState<Array<{id: string, name: string}>>([])
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([])
  
  // Run details modal state
  const [showRunDetails, setShowRunDetails] = useState(false)
  const [selectedRun, setSelectedRun] = useState<Run | null>(null)
  
  // Edit document modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDocument, setEditingDocument] = useState<any | null>(null)
  
  // Search modal state
  const [searchModal, setSearchModal] = useState<{show: boolean, type: string, title: string}>({show: false, type: '', title: ''})
  const [searchInput, setSearchInput] = useState('')
  
  // Reference type filter state
  const [referenceTypeFilter, setReferenceTypeFilter] = useState('all')
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    reference_type: '',
    url: ''
  })
  const [editLoading, setEditLoading] = useState(false)

  // Fetch data based on current filters
  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      
      let params: any = { limit: 100, offset: 0 }
      
      // Apply reference type filter - always get all documents and filter client-side for consistency
      // This handles case sensitivity issues and null values properly
      if (referenceTypeFilter !== 'all') {
        // Don't set backend params, we'll filter everything client-side for consistency
        console.log(`🎯 Will filter client-side for: ${referenceTypeFilter}`)
      }
      
      // Apply search filters
      if (filterType === 'run' && filterRunId) {
        params.run_id = filterRunId
      } else if (filterType === 'persona' && filterPersonaId) {
        params.persona_id = filterPersonaId
      } else if (filterType === 'content' && searchTerm) {
        params.search = searchTerm
        params.limit = 50
      }
      
      console.log('🔍 Fetching documents with params:', params)
      const response = await apiClient.getDocuments(params)
      setDocuments(response.documents || []);
      console.log('📄 Documents fetched:', response)
      
      // Handle both array response and object with documents property
      const docsResponse = Array.isArray(response) ? response : (response.documents || [])
      
      // Debug: Log reference types of first few documents
      const sampleDocs = docsResponse.slice(0, 5).map((doc: any) => ({
        id: doc.id,
        title: doc.title?.substring(0, 30),
        reference_type: doc.reference_type
      }))
      console.log('🔍 Reference types in response:', sampleDocs)
      
      // Also log a summary of all reference types
      const refTypeCounts = docsResponse.reduce((acc: any, doc: any) => {
        const refType = doc.reference_type || 'null/empty'
        acc[refType] = (acc[refType] || 0) + 1
        return acc
      }, {})
      console.log('📊 Reference type distribution:', refTypeCounts)
      
      // Filter out any null or undefined documents
      let validDocs = docsResponse.filter((doc: any) => doc && doc.id)
      
      // Apply client-side filtering for all reference types (handles case sensitivity)
      if (referenceTypeFilter !== 'all') {
        const beforeFilter = validDocs.length
        
        if (referenceTypeFilter === 'tweet') {
          // Show only tweets (case-insensitive)
          validDocs = validDocs.filter((doc: any) => {
            const refType = (doc.reference_type || '').toLowerCase()
            return refType === 'tweet'
          })
          console.log(`🐦 Tweet filter: ${validDocs.length} documents found (was ${beforeFilter})`)
        } else if (referenceTypeFilter === 'document') {
          // Show only documents (NOT tweets and NOT URLs) - case-insensitive
          validDocs = validDocs.filter((doc: any) => {
            const refType = (doc.reference_type || '').toLowerCase()
            return refType === 'document'
          })
          console.log(`📄 Document filter: ${validDocs.length} documents found (was ${beforeFilter})`)
        } else if (referenceTypeFilter === 'url') {
          // Show only URLs (case-insensitive)
          validDocs = validDocs.filter((doc: any) => {
            const refType = (doc.reference_type || '').toLowerCase()
            return refType === 'url'
          })
          console.log(`🔗 URL filter: ${validDocs.length} documents found (was ${beforeFilter})`)
        } else if (referenceTypeFilter === 'none') {
          // Show only documents with null/empty reference_type
          validDocs = validDocs.filter((doc: any) => {
            const refType = doc.reference_type
            return !refType || refType === '' || refType === null
          })
          console.log(`❓ None filter: ${validDocs.length} documents found (was ${beforeFilter})`)
        }
        
        console.log(`🔍 Sample filtered documents:`, validDocs.slice(0, 3).map((doc: any) => `${doc.title?.substring(0, 30)} | ref_type: ${doc.reference_type}`))
      }
      
      if (validDocs.length !== docsResponse.length) {
        console.warn(`⚠️ Filtered out ${docsResponse.length - validDocs.length} invalid/excluded documents`)
      }
      
      console.log(`✅ Loaded ${validDocs.length} documents from server`)
      setDocuments(validDocs)
      
      // Fetch personas for linking
      const personasResponse = await apiClient.getPersonas()
      setAvailablePersonas(personasResponse)
    } catch (error) {
      console.error('❌ Error fetching data:', error)
      setError(`Failed to load data: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchData()
  }, [referenceTypeFilter, filterType, filterRunId, filterPersonaId, searchTerm])

  // Handle new run creation
  const handleCreateNewRun = async () => {
    if (!newRunForm.searchQuery.trim()) {
      setError('Please enter a search query')
      return
    }
    
    if (newRunForm.limit < 1 || newRunForm.limit > 100) {
      setError('Limit must be between 1 and 100')
      return
    }

    try {
      setNewRunLoading(true)
      setError('')
      
      console.log('🚀 Creating new run with:', newRunForm)
      console.log('🔑 API Key present:', !!newRunForm.api_key)
      console.log('🎮 Arcade User present:', !!newRunForm.arcade_user)
      console.log('🔐 Arcade Secret present:', !!newRunForm.arcade_secret)
      
      // Call the Twitter search API to create a new run
      const apiPayload: TwitterSearchRequest = {
        search_type: newRunForm.searchType as 'keywords' | 'user',
        search_query: newRunForm.searchQuery,
        limit: newRunForm.limit,
        rank_tweets: newRunForm.rank_tweets,
        llm_provider: newRunForm.llm_provider,
        llm_model: newRunForm.llm_model,
        arcade_user: newRunForm.arcade_user || undefined,
        arcade_secret: newRunForm.arcade_secret || undefined
      }
      
      // Add the appropriate API key based on the selected provider
      if (newRunForm.api_key) {
        switch (newRunForm.llm_provider) {
          case 'openai':
            apiPayload.openai_api_key = newRunForm.api_key
            break
          case 'anthropic':
            apiPayload.anthropic_api_key = newRunForm.api_key
            break
          case 'google':
            apiPayload.google_api_key = newRunForm.api_key
            break
        }
      }
      
      console.log('📦 Final API payload (keys masked):', {
        ...apiPayload,
        openai_api_key: apiPayload.openai_api_key ? '***masked***' : undefined,
        anthropic_api_key: apiPayload.anthropic_api_key ? '***masked***' : undefined,
        google_api_key: apiPayload.google_api_key ? '***masked***' : undefined,
        arcade_user: apiPayload.arcade_user ? '***masked***' : undefined,
        arcade_secret: apiPayload.arcade_secret ? '***masked***' : undefined
      })
      
      // Debug: Check actual payload structure
      console.log('🔍 Actual payload keys:', Object.keys(apiPayload))
      console.log('🔍 Has openai_api_key:', 'openai_api_key' in apiPayload)
      console.log('🔍 Has arcade_user:', 'arcade_user' in apiPayload)
      console.log('🔍 Has arcade_secret:', 'arcade_secret' in apiPayload)
      
      const response = await apiClient.searchTwitter(apiPayload)
      
      console.log('✅ New run created:', response)
      
      // Auto-populate the search by run_id filter
      if (response.run_id) {
        setFilterRunId(response.run_id)
        setFilterType('run')
        // This will trigger fetchData to load documents for this run
      }
      
      // Reset form
      setNewRunForm({
        searchQuery: '',
        searchType: 'keywords',
        limit: 20,
        rank_tweets: true,
        llm_provider: 'openai',
        llm_model: 'gpt-4o-mini',
        api_key: '',
        arcade_user: '',
        arcade_secret: ''
      })
      
    } catch (error: any) {
      console.error('❌ Error creating new run:', error)
      const errorMessage = error?.message || error?.toString() || 'Unknown error'
      setError(`Failed to create new run: ${errorMessage}`)
    } finally {
      setNewRunLoading(false)
    }
  }

  // Handle run badge click
  const handleRunClick = async (runId: string) => {
    try {
      console.log('🏃 Fetching run details for:', runId)
      const runDetails = await apiClient.getRun(runId)
      setSelectedRun(runDetails)
      setShowRunDetails(true)
    } catch (error) {
      console.error('❌ Error fetching run details:', error)
      setError(`Failed to fetch run details: ${error}`)
    }
  }

  // Handle persona badge click
  const handlePersonaClick = (personaId: string | undefined) => {
    if (!personaId) return;
    // Navigate to personas section and highlight the specific persona
    // Since this is a single-page app, we need to communicate with the parent component
    // For now, let's use a simple approach - store in localStorage and navigate
    localStorage.setItem('highlightPersonaId', personaId)
    router.push('/?section=personas')
  }

  // Handle edit document
  const handleEditDocument = (doc: any) => {
    setEditingDocument(doc)
    setEditForm({
      title: doc.title || '',
      content: doc.content || '',
      reference_type: (doc.reference_type || '').toLowerCase(),
      url: doc.url || ''
    })
    setShowEditModal(true)
  }

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingDocument) return

    try {
      setEditLoading(true)
      console.log('📝 Updating document:', editingDocument.id)
      
      const updatedDoc = await apiClient.updateDocument(editingDocument.id, editForm)
      console.log('✅ Document updated successfully')
      
      // Update the document in the current list
      setDocuments(prev => prev.map(doc => 
        doc.id === editingDocument.id ? { ...doc, ...editForm } : doc
      ))
      
      setShowEditModal(false)
      setEditingDocument(null)
    } catch (error) {
      console.error('❌ Error updating document:', error)
      setError(`Failed to update document: ${error}`)
    } finally {
      setEditLoading(false)
    }
  }

  // Handle document deletion
  const handleDeleteDocument = (docId: string, docTitle: string) => {
    // Show the confirmation dialog
    console.log(`🗑️ Preparing to delete document: ${docId} - "${docTitle}"`);
    setDeleteConfirmation({
      show: true,
      docId: docId,
      title: docTitle
    });
  }

  const confirmDeleteDocument = async () => {
    // Store the document info locally before clearing the state
    const docId = deleteConfirmation.docId;
    const title = deleteConfirmation.title;
    
    // Immediately hide the dialog to improve UX
    setDeleteConfirmation({show: false, docId: '', title: ''});
    
    // Show a loading message
    setError(`Deleting document "${title}"...`);
    
    try {
      console.log(`🗑️ DELETE API CALL: Deleting document ${docId} - "${title}"`);
      
      // Make the API call to delete the document
      await apiClient.deleteDocument(docId);
      
      console.log(`✅ DELETE SUCCESS: Document ${docId} deleted from server`);
      
      // Update the UI by removing the document from state
      setDocuments(prevDocs => {
        const filteredDocs = prevDocs.filter(doc => doc.id !== docId);
        console.log(`📊 UI UPDATE: Removed document from state. Before: ${prevDocs.length}, After: ${filteredDocs.length}`);
        return filteredDocs;
      });
      
      // Show success message
      setError(`Document "${title}" deleted successfully`);
      setTimeout(() => setError(''), 3000);
      
      // Refresh data from server to ensure consistency
      setTimeout(() => {
        console.log('🔄 Refreshing data after deletion');
        fetchData();
      }, 500);
    } catch (error: any) {
      console.error(`❌ DELETE ERROR: Failed to delete document ${docId}:`, error);
      setError(`Failed to delete document: ${error.message || String(error)}`);
      
      // Refresh data to ensure UI is consistent with server state
      setTimeout(() => fetchData(), 1000);
    }
  }

  const cancelDeleteDocument = () => {
    setDeleteConfirmation({show: false, docId: '', title: ''})
  }



  // Handle persona linking
  const handleLinkPersonas = async (docId: string, docTitle: string) => {
    try {
      // Fetch available personas
      const personas = await apiClient.getPersonas()
      setAvailablePersonas(personas)
      
      // Get current document and its linked personas
      const currentDoc = documents.find(doc => doc.id === docId)
      const currentPersonaIds = currentDoc?.persona_ids || 
                               currentDoc?.persona_style_links?.map(link => link.persona_id) || []
      
      // Set currently selected personas
      setSelectedPersonaIds(currentPersonaIds)
      setPersonaLinking({show: true, docId, docTitle})
    } catch (error) {
      console.error('Error fetching personas:', error)
      setError('Failed to load personas')
    }
  }

  const togglePersonaSelection = (personaId: string) => {
    setSelectedPersonaIds(prev => {
      if (prev.includes(personaId)) {
        // Remove if already selected
        return prev.filter(id => id !== personaId)
      } else {
        // Add if not selected
        return [...prev, personaId]
      }
    })
  }

  const savePersonaLinks = async () => {
    const { docId } = personaLinking
    console.log('🔗 Saving persona links:', { docId, selectedPersonaIds })
    try {
      // Update document with selected persona_ids
      await apiClient.updateDocument(docId, { persona_ids: selectedPersonaIds })
      console.log('✅ Document updated successfully')
      
      // Refresh the documents list to show the new links
      fetchData()
      
      // Close the modal and show success message
      console.log('🚪 Closing persona linking modal')
      setPersonaLinking({show: false, docId: '', docTitle: ''})
      setAvailablePersonas([])
      setSelectedPersonaIds([])
      setError('Document persona links updated successfully')
      setTimeout(() => setError(''), 3000)
    } catch (error) {
      console.error('❌ Error updating persona links:', error)
      setError('Failed to update persona links')
    }
  }

  const cancelPersonaLinking = () => {
    console.log('🚫 Canceling persona linking')
    setPersonaLinking({show: false, docId: '', docTitle: ''})
    setAvailablePersonas([])
    setSelectedPersonaIds([])
  }

  // Handle search modal
  const handleSearchSubmit = () => {
    const trimmedInput = searchInput.trim()
    if (!trimmedInput) return
    
    if (searchModal.type === 'run_id') {
      setFilterRunId(trimmedInput)
      setFilterType('run')
    } else if (searchModal.type === 'persona_id') {
      setFilterPersonaId(trimmedInput)
      setFilterType('persona')
    } else if (searchModal.type === 'content') {
      setSearchTerm(trimmedInput)
      setFilterType('content')
    }
    
    // Close modal and clear input
    setSearchModal({show: false, type: '', title: ''})
    setSearchInput('')
  }

  const cancelSearchModal = () => {
    setSearchModal({show: false, type: '', title: ''})
    setSearchInput('')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Please log in to view source materials.</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Left Pane - Create New Search Run */}
      <div className="w-1/3 min-w-0 bg-gray-800 border-r border-gray-700 p-6 overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-6">🚀 Create New Search Run</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Query
            </label>
            <Input
              type="text"
              placeholder="Enter search terms..."
              value={newRunForm.searchQuery}
              onChange={(e) => {
                setNewRunForm(prev => ({ ...prev, searchQuery: e.target.value }))
                if (error) setError('')  // Clear errors when user types
              }}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Type
            </label>
            <select
              value={newRunForm.searchType}
              onChange={(e) => setNewRunForm(prev => ({ ...prev, searchType: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            >
              <option value="keywords">Keywords</option>
              <option value="user">User</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Limit
            </label>
            <Input
              type="number"
              min="10"
              max="100"
              value={newRunForm.limit}
              onChange={(e) => setNewRunForm(prev => ({ ...prev, limit: parseInt(e.target.value) || 20 }))}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rank Tweets
            </label>
            <select
              value={newRunForm.rank_tweets ? 'true' : 'false'}
              onChange={(e) => setNewRunForm(prev => ({ ...prev, rank_tweets: e.target.value === 'true' }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              LLM Provider
            </label>
            <select
              value={newRunForm.llm_provider}
              onChange={(e) => setNewRunForm(prev => ({ ...prev, llm_provider: e.target.value, api_key: '' }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              LLM API Key
            </label>
            <Input
              type="password"
              value={newRunForm.api_key}
              onChange={(e) => setNewRunForm(prev => ({ ...prev, api_key: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder={newRunForm.llm_provider === 'openai' ? 'sk-...' : 
                         newRunForm.llm_provider === 'anthropic' ? 'sk-ant-...' : 
                         'AIza...'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Arcade User
            </label>
            <Input
              type="text"
              value={newRunForm.arcade_user}
              onChange={(e) => setNewRunForm(prev => ({ ...prev, arcade_user: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Arcade Secret
            </label>
            <Input
              type="password"
              value={newRunForm.arcade_secret}
              onChange={(e) => setNewRunForm(prev => ({ ...prev, arcade_secret: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          
          <Button
            onClick={handleCreateNewRun}
            disabled={newRunLoading || !newRunForm.searchQuery.trim()}
            className="w-full"
          >
            {newRunLoading ? 'Creating Run...' : 'Create Run'}
          </Button>
          
          {error && (
            <div className="text-red-400 text-sm mt-2">{error}</div>
          )}
        </div>
      </div>
      
      {/* Right Pane - Search Results */}
      <div className="flex-1 min-w-0 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Source Materials</h2>
          <div className="text-sm text-gray-400">
            {documents.length} materials
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Reference Type
          </label>
          <select
            value={referenceTypeFilter}
            onChange={(e) => {
              setReferenceTypeFilter(e.target.value)
              fetchData()
            }}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="tweet">Tweet</option>
            <option value="document">Document</option>
            <option value="url">URL</option>
            <option value="none">None</option>
          </select>
        </div>

        {/* Search buttons */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Search By
          </label>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => setSearchModal({show: true, type: 'run_id', title: 'Search by Run ID'})}
              variant="outline"
              className="border-gray-500 text-white bg-gray-700 hover:bg-gray-600 hover:text-white"
            >
              Run ID
            </Button>
            <Button 
              onClick={() => setSearchModal({show: true, type: 'persona_id', title: 'Search by Persona ID'})}
              variant="outline"
              className="border-gray-500 text-white bg-gray-700 hover:bg-gray-600 hover:text-white"
            >
              Persona ID
            </Button>
            <Button 
              onClick={() => setSearchModal({show: true, type: 'content', title: 'Search by Content'})}
              variant="outline"
              className="border-gray-500 text-white bg-gray-700 hover:bg-gray-600 hover:text-white"
            >
              Content
            </Button>
          </div>
        </div>
        
        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading source materials...</div>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">No materials match your current filters</div>
          </div>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc) => {
              // Check if this document is associated with the filtered persona
              const isPersonaMatch = filterPersonaId && (
                doc.persona_id === filterPersonaId ||
                doc.persona_ids?.includes(filterPersonaId) ||
                doc.persona_style_links?.some(link => link.persona_id === filterPersonaId)
              )
              
              return (
              <div key={doc.id} className={`bg-gray-800 rounded-lg p-4 border ${
                isPersonaMatch 
                  ? 'border-purple-500 bg-purple-900/20 shadow-lg shadow-purple-500/20' 
                  : 'border-gray-700'
              } relative`}>
                {/* Action buttons - positioned at top right */}
                <div className="absolute top-3 right-3 flex gap-1">
                  <button
                    onClick={() => handleEditDocument(doc)}
                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                    title="Edit document"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleLinkPersonas(doc.id, doc.title)}
                    className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded transition-colors"
                    title="Link to personas"
                  >
                    <User className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(doc.id, doc.title)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="pr-24 mb-3">
                  <h3 className="font-medium text-white mb-2 line-clamp-2">{doc.title}</h3>
                  <p className="text-gray-300 text-sm mb-3 line-clamp-3">{doc.content}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {doc.author && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {doc.author}
                      </span>
                    )}
                    {doc.url && (
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Source
                      </a>
                    )}
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Badges at bottom */}
                {(doc.run_id || doc.persona_id || doc.persona_ids?.length || (doc.persona_style_links && doc.persona_style_links.length > 0)) && (
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <div className="flex gap-2 flex-wrap">
                      {doc.run_id && (
                        <button
                          onClick={() => handleRunClick(doc.run_id!)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-orange-600 text-orange-100 text-xs rounded-full hover:bg-orange-700 transition-colors"
                        >
                          🏃 Run: {doc.run_id.slice(0, 8)}...
                        </button>
                      )}
                      {/* Check for persona_ids array (from backend) */}
                      {doc.persona_ids && doc.persona_ids.length > 0 && doc.persona_ids.map((personaId) => {
                         const persona = availablePersonas.find(p => p.id === personaId)
                         const personaName = persona?.name || `Unknown Persona`
                        return (
                          <button
                            key={personaId}
                            onClick={() => handlePersonaClick(personaId)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600 text-purple-100 text-xs rounded-full hover:bg-purple-700 transition-colors"
                          >
                            👤 {personaName}
                          </button>
                        )
                      })}
                      {/* Check for persona_style_links array (legacy) */}
                      {doc.persona_style_links && doc.persona_style_links.length > 0 && doc.persona_style_links.map((link) => (
                        <button
                          key={link.persona_id}
                          onClick={() => handlePersonaClick(link.persona_id)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600 text-purple-100 text-xs rounded-full hover:bg-purple-700 transition-colors"
                          title={`Linked to persona: ${link.persona.name}`}
                        >
                          👤 {link.persona.name}
                        </button>
                      ))}
                      {/* Also check for direct persona_id (legacy) */}
                      {doc.persona_id && !doc.persona_ids && !doc.persona_style_links && (
                        <button
                          onClick={() => handlePersonaClick(doc.persona_id)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600 text-purple-100 text-xs rounded-full hover:bg-purple-700 transition-colors"
                        >
                          👤 {(availablePersonas.find(p => p.id === doc.persona_id)?.name) || 'Unknown Persona'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Run Details Modal */}
      {showRunDetails && selectedRun && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Run Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRunDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Run ID</label>
                  <p className="text-white font-mono text-sm">{selectedRun.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Name</label>
                  <p className="text-white">{selectedRun.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Status</label>
                  <Badge variant={selectedRun.status === 'completed' ? 'default' : 'secondary'}>
                    {selectedRun.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Started</label>
                  <p className="text-white text-sm">{new Date(selectedRun.started_at).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedRun.completed_at && (
                <div>
                  <label className="text-sm font-medium text-gray-300">Completed</label>
                  <p className="text-white text-sm">{new Date(selectedRun.completed_at).toLocaleString()}</p>
                </div>
              )}

              {/* Search Parameters Section */}
              <div>
                <label className="text-sm font-medium text-gray-300">Search Parameters</label>
                <div className="bg-gray-700 rounded p-3 mt-1">
                  {selectedRun.meta_data?.search_query && (
                    <p className="text-white text-sm mb-2">
                      <strong>Query:</strong> "{selectedRun.meta_data.search_query}"
                    </p>
                  )}
                  {selectedRun.meta_data?.search_type && (
                    <p className="text-white text-sm mb-2">
                      <strong>Search Type:</strong> {selectedRun.meta_data.search_type}
                    </p>
                  )}
                  {selectedRun.meta_data?.limit && (
                    <p className="text-white text-sm mb-2">
                      <strong>Limit:</strong> {selectedRun.meta_data.limit} results
                    </p>
                  )}
                  {selectedRun.meta_data?.rank_tweets !== undefined && (
                    <p className="text-white text-sm mb-2">
                      <strong>Ranked:</strong> {selectedRun.meta_data.rank_tweets ? 'Yes' : 'No'}
                    </p>
                  )}
                  {selectedRun.meta_data?.llm_provider && (
                    <p className="text-white text-sm mb-2">
                      <strong>LLM:</strong> {selectedRun.meta_data.llm_provider} ({selectedRun.meta_data.llm_model || 'default model'})
                    </p>
                  )}
                  
                  {/* Show raw metadata for debugging */}
                  {selectedRun.meta_data && (
                    <details className="mt-3">
                      <summary className="text-gray-300 text-xs cursor-pointer hover:text-white">
                        Raw Metadata (Debug)
                      </summary>
                      <pre className="text-xs text-gray-400 mt-2 overflow-x-auto">
                        {JSON.stringify(selectedRun.meta_data, null, 2)}
                      </pre>
                    </details>
                  )}
                  
                  {/* Show input source for debugging */}
                  {selectedRun.input_source && (
                    <details className="mt-3">
                      <summary className="text-gray-300 text-xs cursor-pointer hover:text-white">
                        Input Source (Debug)
                      </summary>
                      <pre className="text-xs text-gray-400 mt-2 overflow-x-auto">
                        {JSON.stringify(selectedRun.input_source, null, 2)}
                      </pre>
                    </details>
                  )}
                  
                  {!selectedRun.meta_data && !selectedRun.input_source && (
                    <p className="text-gray-400 text-sm italic">No search parameters available</p>
                  )}
                </div>
              </div>
              
              {selectedRun.input_source && (
                <div>
                  <label className="text-sm font-medium text-gray-300">Input Source</label>
                  <div className="bg-gray-700 rounded p-3 mt-1">
                    <p className="text-white text-sm"><strong>Type:</strong> {selectedRun.input_source.source_type}</p>
                    <p className="text-white text-sm"><strong>Name:</strong> {selectedRun.input_source.name}</p>
                    {selectedRun.input_source.source_config && (
                      <div className="mt-2">
                        <p className="text-gray-300 text-xs">Configuration:</p>
                        <pre className="text-xs text-gray-300 bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(selectedRun.input_source.source_config, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedRun.meta_data && (
                <div>
                  <label className="text-sm font-medium text-gray-300">Metadata</label>
                  <pre className="text-xs text-gray-300 bg-gray-700 p-3 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(selectedRun.meta_data, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedRun.documents && selectedRun.documents.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Generated Documents ({selectedRun.documents.length})
                  </label>
                  <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                    {selectedRun.documents.map((doc) => (
                      <div key={doc.id} className="bg-gray-700 rounded p-2">
                        <p className="text-white text-sm font-medium">{doc.title}</p>
                        <p className="text-gray-300 text-xs">{doc.reference_type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Document Modal */}
      {showEditModal && editingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Edit Document</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title
                </label>
                <Input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content
                </label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL (optional)
                </label>
                <Input
                  type="text"
                  value={editForm.url}
                  onChange={(e) => setEditForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reference Type
                </label>
                <select
                  value={editForm.reference_type}
                  onChange={(e) => setEditForm(prev => ({ ...prev, reference_type: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  <option value="">None</option>
                  <option value="document">Document</option>
                  <option value="tweet">Tweet</option>
                  <option value="url">URL</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Confirm Deletion</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to permanently delete "{deleteConfirmation.title}"? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={cancelDeleteDocument}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDeleteDocument}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Persona Linking Dialog */}
      {personaLinking.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Link to Personas</h3>
            <p className="text-gray-300 mb-4">
              Select personas to link with "{personaLinking.docTitle}":
            </p>
            <div className="space-y-3 mb-6">
              {availablePersonas.map((persona) => {
                const isSelected = selectedPersonaIds.includes(persona.id)
                
                return (
                  <label
                    key={persona.id}
                    className="flex items-center p-3 rounded border border-gray-600 hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePersonaSelection(persona.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white">{persona.name}</div>
                      <div className="text-sm text-gray-400">{persona.id.slice(0, 8)}...</div>
                    </div>
                    {isSelected && (
                      <div className="text-green-400 text-sm font-medium">✓ Selected</div>
                    )}
                  </label>
                )
              })}
            </div>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={cancelPersonaLinking}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={savePersonaLinks}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Links
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {searchModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">{searchModal.title}</h3>
            <Input
              type="text"
              placeholder={`Enter ${searchModal.type.replace('_', ' ')}...`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
              className="bg-gray-700 border-gray-600 text-white mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={cancelSearchModal}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSearchSubmit}
                disabled={!searchInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
