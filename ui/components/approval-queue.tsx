'use client'

import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Trash2, 
  Send, 
  ExternalLink,
  Filter,
  Star,
  MessageSquare,
  MoreHorizontal
} from 'lucide-react'
import { apiClient } from './api-client'

// Types based on API schemas
interface OutputSchema {
  id: string
  content_type: string
  generated_content: string
  status: 'pending_review' | 'approved' | 'rejected' | 'published'
  score?: number
  feedback_notes?: string
  persona_id: string
  source_document_id?: string
  created_at: string
  reviewed_at?: string
  published_at?: string
  publish_config?: Record<string, any>
  published_url?: string
  persona?: {
    id: string
    name: string
    description?: string
  }
}

interface Persona {
  id: string
  name: string
  description?: string
  style_preferences?: Record<string, any>
}

interface ApprovalRequest {
  score?: number
  feedback?: string
}

// Kanban column configuration
const COLUMNS = [
  {
    id: 'pending_review',
    title: '⏳ Pending',
    status: 'pending_review',
    description: 'Awaiting approval',
    color: 'bg-yellow-50 border-yellow-300'
  },
  {
    id: 'approved',
    title: '✅ Approved',
    status: 'approved',
    description: 'Ready to schedule/post',
    color: 'bg-green-50 border-green-300'
  },
  {
    id: 'scheduled',
    title: '📅 Scheduled',
    status: 'approved',
    description: 'Scheduled for posting',
    color: 'bg-blue-50 border-blue-300'
  },
  {
    id: 'published',
    title: '🚀 Posted',
    status: 'published',
    description: 'Successfully posted',
    color: 'bg-purple-50 border-purple-300'
  }
]

export default function ApprovalQueue() {
  const [outputs, setOutputs] = useState<OutputSchema[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters
  const [selectedPersona, setSelectedPersona] = useState<string>('all')
  const [selectedContentType, setSelectedContentType] = useState<string>('all')
  
  // Modals
  const [deleteConfirmation, setDeleteConfirmation] = useState<{show: boolean, outputId: string, title: string}>({show: false, outputId: '', title: ''})
  const [approvalModal, setApprovalModal] = useState<{
    show: boolean
    output: OutputSchema | null
    action: 'approve_as_is' | 'edit_approve' | 'reject'
  }>({ show: false, output: null, action: 'approve_as_is' })
  
  const [approvalForm, setApprovalForm] = useState<ApprovalRequest>({
    score: 8,
    feedback: ''
  })
  
  // Edit modal state
  const [editedContent, setEditedContent] = useState('')
  const [editedContentType, setEditedContentType] = useState('')
  
  // Twitter credential modal
  const [twitterModal, setTwitterModal] = useState<{
    show: boolean
    output: OutputSchema | null
  }>({ show: false, output: null })
  
  const [twitterCredentials, setTwitterCredentials] = useState({
    arcade_user_id: '',
    arcade_api_key: ''
  })

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true)
      const [outputsData, personasData] = await Promise.all([
        apiClient.getOutputs(),
        apiClient.getPersonas()
      ])
      setOutputs(outputsData)
      setPersonas(personasData)
      setError('')
    } catch (err) {
      console.error('❌ Error fetching approval queue data:', err)
      setError('Failed to load approval queue data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter outputs by persona and content type
  const filteredOutputs = outputs.filter(output => {
    const personaMatch = selectedPersona === 'all' || output.persona_id === selectedPersona
    const contentTypeMatch = selectedContentType === 'all' || output.content_type === selectedContentType
    return personaMatch && contentTypeMatch
  })

  // Group outputs by column
  const getOutputsForColumn = (columnId: string) => {
    return filteredOutputs.filter(output => {
      if (columnId === 'scheduled') {
        // Only show items that are actually scheduled for future posting
        // This would require a specific "scheduled" status or scheduled_at timestamp
        return false // For now, no items go to scheduled automatically
      }
      if (columnId === 'approved') {
        // ALL approved items stay in approved column until posted
        return output.status === 'approved'
      }
      if (columnId === 'published') {
        // Only items with published status go to posted column
        return output.status === 'published'
      }
      return output.status === columnId
    })
  }

  // Handle approval/rejection
  const handleApproval = async () => {
    if (!approvalModal.output) return
    
    try {
      if (approvalModal.action === 'reject') {
        // Reject the original output
        await apiClient.rejectOutput(
          approvalModal.output.id, 
          approvalForm.score || 8, 
          approvalForm.feedback
        )
        setError('Output rejected successfully')
      } else if (approvalModal.action === 'approve_as_is') {
        // Approve the original output as-is
        await apiClient.approveOutput(
          approvalModal.output.id, 
          approvalForm.score || 8, 
          approvalForm.feedback
        )
        setError('Output approved successfully')
      } else if (approvalModal.action === 'edit_approve') {
        // Create a new approved output with edited content
        await handleEditAndApprove()
        return // handleEditAndApprove handles its own success/error messages
      }
      
      setApprovalModal({ show: false, output: null, action: 'approve_as_is' })
      setApprovalForm({ score: 8, feedback: '' })
      setEditedContent('')
      await fetchData() // Refresh data
    } catch (err) {
      console.error(`❌ Error processing approval:`, err)
      setError(`Failed to process approval`)
    }
  }
  
  // Validate content length based on type
  const validateContentLength = (content: string, contentType: string): { isValid: boolean; message?: string } => {
    const trimmedContent = content.trim()
    
    if (!trimmedContent) {
      return { isValid: false, message: 'Content cannot be empty' }
    }
    
    // Twitter character limits
    if (contentType === 'tweet_single' || contentType === 'twitter' || contentType === 'x') {
      if (trimmedContent.length > 280) {
        return { 
          isValid: false, 
          message: `Tweet too long: ${trimmedContent.length}/280 characters` 
        }
      }
    }
    
    // LinkedIn post limits (approximate)
    if (contentType === 'linkedin_post' || contentType === 'linkedin_comment') {
      if (trimmedContent.length > 3000) {
        return { 
          isValid: false, 
          message: `LinkedIn post too long: ${trimmedContent.length}/3000 characters` 
        }
      }
    }
    
    return { isValid: true }
  }
  
  // Handle edit and approve workflow
  const handleEditAndApprove = async () => {
    if (!approvalModal.output || !editedContent.trim()) {
      setError('Please provide edited content')
      return
    }
    
    // Validate content length
    const validation = validateContentLength(editedContent, editedContentType)
    if (!validation.isValid) {
      setError(validation.message || 'Content validation failed')
      return
    }
    
    try {
      // Create a new output with edited content using the direct output creation API
      const newOutput = {
        content_type: editedContentType,
        generated_content: editedContent,
        persona_id: approvalModal.output.persona_id,
        source_document_id: approvalModal.output.source_document_id,
        publish_config: approvalModal.output.publish_config
      }
      
      // First create the new output
      const createdOutput = await apiClient.createOutput(newOutput)
      
      // Then immediately approve it
      if (createdOutput && createdOutput.id) {
        await apiClient.approveOutput(
          createdOutput.id,
          approvalForm.score || 8,
          `Edited version. Original feedback: ${approvalForm.feedback || 'None'}`
        )
      }
      
      // Reject the original output with reference to the edited version
      await apiClient.rejectOutput(
        approvalModal.output.id,
        approvalForm.score || 8,
        `Replaced with edited version. ${approvalForm.feedback || ''}`
      )
      
      setApprovalModal({ show: false, output: null, action: 'approve_as_is' })
      setApprovalForm({ score: 8, feedback: '' })
      setEditedContent('')
      setEditedContentType('')
      await fetchData() // Refresh data
      setError('Edited content created and approved successfully')
    } catch (err) {
      console.error('❌ Error creating edited version:', err)
      setError('Failed to create edited version')
    }
  }

  // Handle posting to Twitter
  const handlePostToTwitter = (output: OutputSchema) => {
    // Show credential modal first
    setTwitterModal({ show: true, output })
    setTwitterCredentials({ arcade_user_id: '', arcade_api_key: '' })
  }
  
  const submitTwitterPost = async () => {
    if (!twitterModal.output) return
    
    try {
      // Extract content from JSON if needed
      let content = twitterModal.output.generated_content
      try {
        if (typeof content === 'string' && content.startsWith('{')) {
          const parsed = JSON.parse(content)
          content = parsed.text || parsed.content || content
        }
      } catch {
        // Use original content if JSON parsing fails
      }

      const result = await apiClient.postToTwitter(content, twitterCredentials)
      
      // Update output status to "published" after successful posting
      await apiClient.updateOutput(twitterModal.output.id, {
        status: 'published',
        published_url: result.tweet_url || `https://twitter.com/i/web/status/${result.tweet_id}`
      })
      
      await fetchData() // Refresh data to show updated status
      setError(`Content posted to X successfully! Tweet ID: ${result.tweet_id || 'N/A'}`)
      setTwitterModal({ show: false, output: null })
    } catch (err: any) {
      console.error('❌ Error posting to X:', err)
      // Try to extract more specific error details
      let errorMessage = 'Failed to post to X. Please try again.'
      if (err.message && err.message !== '[object Object]') {
        errorMessage = `Failed to post to X: ${err.message}`
      }
      setError(errorMessage)
    }
  }

  // Handle delete - show confirmation modal
  const handleDelete = (outputId: string) => {
    const output = outputs.find(o => o.id === outputId)
    const title = output ? formatContentPreview(output.generated_content, 50) : 'this output'
    console.log(`🗑️ Preparing to delete output: ${outputId} - "${title}"`)
    setDeleteConfirmation({
      show: true,
      outputId: outputId,
      title: title
    })
  }

  // Confirm delete after modal confirmation
  const confirmDelete = async () => {
    const outputId = deleteConfirmation.outputId
    const title = deleteConfirmation.title
    
    // Immediately hide the dialog to improve UX
    setDeleteConfirmation({show: false, outputId: '', title: ''})
    
    // Show a loading message
    setError(`Deleting "${title}"...`)
    
    try {
      console.log(`🗑️ DELETE API CALL: Deleting output ${outputId} - "${title}"`)
      
      // Optimistically remove from UI first
      setOutputs(prevOutputs => prevOutputs.filter(output => output.id !== outputId))
      
      // Call delete API
      await apiClient.deleteOutput(outputId)
      console.log('✅ Output deleted successfully:', outputId)
      
      // Refresh data to ensure consistency
      await fetchData()
      setError('Output deleted successfully')
    } catch (err) {
      console.error('❌ Error deleting output:', err)
      setError('Failed to delete output')
      // Refresh data to restore UI state if delete failed
      await fetchData()
    }
  }

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirmation({show: false, outputId: '', title: ''})
  }

  // Format content preview
  const formatContentPreview = (content: string, maxLength: number = 150) => {
    try {
      // Try to parse JSON and extract readable text
      if (typeof content === 'string' && content.startsWith('{')) {
        const parsed = JSON.parse(content);
        const text = parsed.text || parsed.content || content;
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
      }
      // Handle regular text content
      if (content.length <= maxLength) return content;
      return content.substring(0, maxLength) + '...';
    } catch {
      // If JSON parsing fails, treat as regular text
      if (content.length <= maxLength) return content;
      return content.substring(0, maxLength) + '...';
    }
  }

  // Get persona badge color
  const getPersonaBadgeColor = (personaId: string) => {
    const colors = [
      'bg-red-100 text-red-800',
      'bg-blue-100 text-blue-800', 
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800'
    ]
    const index = personaId.charCodeAt(0) % colors.length
    return colors[index]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading approval queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-gray-900 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Approval Queue</h1>
          <p className="text-gray-400">Manage and approve generated content</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-gray-800 p-4 rounded-lg">
        <Filter className="h-5 w-5 text-gray-400" />
        
        {/* Persona Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-300">Persona:</label>
          <select
            value={selectedPersona}
            onChange={(e) => setSelectedPersona(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-1 text-sm"
          >
            <option value="">All Personas</option>
            {personas.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.name}
              </option>
            ))}
          </select>
        </div>

        {/* Content Type Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-300">Type:</label>
          <select
            value={selectedContentType}
            onChange={(e) => setSelectedContentType(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-1 text-sm"
          >
            <option value="">All Types</option>
            <option value="linkedin_comment">LinkedIn Comment</option>
            <option value="twitter_reply">Twitter Reply</option>
            <option value="social_comment">Social Comment</option>
          </select>
        </div>

        {error && (
          <div className="ml-auto text-sm text-green-400 bg-green-900/20 px-3 py-1 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4 h-[calc(100vh-280px)]">
        {COLUMNS.map((column) => {
          const columnOutputs = getOutputsForColumn(column.id)

          return (
            <div key={column.id} className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">{column.title}</h3>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                    {columnOutputs.length}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mt-1">{column.description}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {columnOutputs.map((output: OutputSchema) => {
                  const persona = personas.find(p => p.id === output.persona_id)
                  
                  return (
                    <div key={output.id} className="bg-gray-700 rounded-lg p-3 border border-gray-600 hover:border-gray-500 transition-colors">
                      {/* Content Preview */}
                      <div className="mb-3">
                        <p className="text-sm text-gray-200 leading-relaxed">
                          {formatContentPreview(output.generated_content)}
                        </p>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {persona && (
                          <Badge className={`text-xs ${getPersonaBadgeColor(persona.id)}`}>
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

                      {/* Timestamps */}
                      <div className="text-xs text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(output.created_at).toLocaleDateString()}
                        </div>
                        {/* URL Link - Only for Posted items */}
                        {output.status === 'posted' && (
                          <div className="mt-1">
                            {output.published_url ? (
                              <a 
                                href={output.published_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline text-xs"
                              >
                                View Post
                              </a>
                            ) : (
                              <span className="text-gray-500 text-xs">URL not saved</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-1">
                        {output.status === 'pending_review' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs h-7 text-green-400 border-green-600 hover:bg-green-900/20"
                              onClick={() => {
                                setApprovalModal({
                                  show: true,
                                  output,
                                  action: 'approve_as_is'
                                })
                                // Initialize edited content and type with current values
                                try {
                                  const content = output.generated_content
                                  if (typeof content === 'string' && content.startsWith('{')) {
                                    const parsed = JSON.parse(content)
                                    setEditedContent(parsed.text || parsed.content || content)
                                  } else {
                                    setEditedContent(content)
                                  }
                                } catch {
                                  setEditedContent(output.generated_content)
                                }
                                setEditedContentType(output.content_type)
                              }}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Review
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs h-7 text-red-400 border-red-600 hover:bg-red-900/20"
                              onClick={() => setApprovalModal({
                                show: true,
                                output,
                                action: 'reject'
                              })}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        {output.status === 'approved' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs h-7 text-blue-400 border-blue-600 hover:bg-blue-900/20"
                              onClick={() => {
                                // TODO: Schedule post
                              }}
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              Schedule
                            </Button>
                            
                            {/* Only show Post to X for Twitter/X content */}
                            {(output.content_type === 'twitter' || output.content_type === 'x' || output.content_type === 'tweet_single' || output.content_type === 'tweet_thread' || output.content_type === 'twitter_reply') && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs h-7 text-green-400 border-green-600 hover:bg-green-900/20"
                                onClick={() => handlePostToTwitter(output)}
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Post to X
                              </Button>
                            )}
                            
                            {/* Show LinkedIn post button for LinkedIn content */}
                            {output.content_type === 'linkedin' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs h-7 text-blue-400 border-blue-600 hover:bg-blue-900/20"
                                onClick={() => {
                                  // TODO: Implement LinkedIn posting
                                  setError('LinkedIn posting not yet implemented')
                                }}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Post to LinkedIn
                              </Button>
                            )}
                            
                            {/* Generic post button for other content types */}
                            {!['twitter', 'x', 'linkedin', 'tweet_single', 'tweet_thread', 'twitter_reply'].includes(output.content_type) && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs h-7 text-gray-400 border-gray-600 hover:bg-gray-700/20"
                                onClick={() => {
                                  setError(`Direct posting not available for ${output.content_type} content. Use Schedule instead.`)
                                }}
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Post ({output.content_type})
                              </Button>
                            )}
                          </>
                        )}

                        {/* URL for posted items */}
                        {output.published_url && (
                          <a 
                            href={output.published_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:underline text-xs px-2 py-1 border border-blue-600 rounded hover:bg-blue-900/20"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Post
                          </a>
                        )}

                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-7 text-red-600 border-red-300 ml-auto"
                          onClick={() => handleDelete(output.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}

                {columnOutputs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-sm">No items</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Approval Modal */}
      {approvalModal.show && approvalModal.output && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-white">
                📝 Review Content
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                Choose how to handle this content
              </p>
            </div>

            {/* Content Preview/Edit */}
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-white mb-2">Content:</h4>
              {approvalModal.action === 'edit_approve' ? (
                <div className="space-y-4">
                  {/* Content Type Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Content Type:
                    </label>
                    <select
                      value={editedContentType}
                      onChange={(e) => setEditedContentType(e.target.value)}
                      className="w-full p-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="tweet_single">Single Tweet</option>
                      <option value="tweet_thread">Tweet Thread</option>
                      <option value="twitter_reply">Twitter Reply</option>
                      <option value="linkedin_post">LinkedIn Post</option>
                      <option value="linkedin_comment">LinkedIn Comment</option>
                      <option value="blog_post">Blog Post</option>
                      <option value="social_comment">Social Comment</option>
                    </select>
                  </div>
                  
                  {/* Content Editor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Edit content below:
                    </label>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg resize-none text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      rows={6}
                      placeholder="Edit the content..."
                    />
                    
                    {/* Character count and validation */}
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <div className="text-gray-400">
                        {editedContentType === 'tweet_single' || editedContentType === 'twitter' || editedContentType === 'x' ? (
                          <span className={editedContent.length > 280 ? 'text-red-400' : 'text-gray-400'}>
                            {editedContent.length}/280 characters
                          </span>
                        ) : editedContentType === 'linkedin_post' || editedContentType === 'linkedin_comment' ? (
                          <span className={editedContent.length > 3000 ? 'text-red-400' : 'text-gray-400'}>
                            {editedContent.length}/3000 characters
                          </span>
                        ) : (
                          <span className="text-gray-400">
                            {editedContent.length} characters
                          </span>
                        )}
                      </div>
                      
                      {(() => {
                        const validation = validateContentLength(editedContent, editedContentType)
                        if (!validation.isValid) {
                          return <span className="text-red-400 text-xs">{validation.message}</span>
                        }
                        return null
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-300 leading-relaxed">
                  {(() => {
                    try {
                      const content = approvalModal.output.generated_content;
                      if (typeof content === 'string' && content.startsWith('{')) {
                        const parsed = JSON.parse(content);
                        return parsed.text || parsed.content || content;
                      }
                      return content;
                    } catch {
                      return approvalModal.output.generated_content;
                    }
                  })()}
                </p>
              )}
            </div>

            {/* Approval Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Score (1-10) *
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={approvalForm.score || 8}
                  onChange={(e) => setApprovalForm({
                    ...approvalForm,
                    score: parseInt(e.target.value)
                  })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1 (Poor)</span>
                  <span className="font-medium">Score: {approvalForm.score}</span>
                  <span>10 (Excellent)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Feedback *
                </label>
                <textarea
                  value={approvalForm.feedback || ''}
                  onChange={(e) => setApprovalForm({
                    ...approvalForm,
                    feedback: e.target.value
                  })}
                  placeholder="Add your feedback or suggestions... (required)"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg resize-none text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {approvalModal.action === 'edit_approve' ? (
                  <>
                    <Button
                      onClick={handleApproval}
                      disabled={!editedContent.trim() || !approvalForm.feedback?.trim() || !validateContentLength(editedContent, editedContentType).isValid}
                      className="bg-green-700 hover:bg-green-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save & Approve Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setApprovalModal({ ...approvalModal, action: 'approve_as_is' })}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      ← Back to Review
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={async () => {
                        // Set action and handle approval directly
                        try {
                          await apiClient.approveOutput(
                            approvalModal.output.id, 
                            approvalForm.score || 8, 
                            approvalForm.feedback
                          )
                          setError('Output approved successfully')
                          setApprovalModal({ show: false, output: null, action: 'approve_as_is' })
                          setApprovalForm({ score: 8, feedback: '' })
                          await fetchData() // Refresh data
                        } catch (err) {
                          console.error(`❌ Error approving output:`, err)
                          setError(`Failed to approve output`)
                        }
                      }}
                      disabled={!approvalForm.feedback?.trim()}
                      className="bg-green-700 hover:bg-green-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve as-is
                    </Button>
                    <Button
                      onClick={() => setApprovalModal({ ...approvalModal, action: 'edit_approve' })}
                      className="bg-blue-700 hover:bg-blue-800 text-white"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit & Approve
                    </Button>
                    <Button
                      onClick={() => {
                        setApprovalModal({ ...approvalModal, action: 'reject' })
                        handleApproval()
                      }}
                      disabled={!approvalForm.feedback?.trim()}
                      className="bg-red-700 hover:bg-red-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setApprovalModal({ show: false, output: null, action: 'approve_as_is' })
                    setApprovalForm({ score: 8, feedback: '' })
                    setEditedContent('')
                    setEditedContentType('')
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white ml-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Twitter Credential Modal */}
      {twitterModal.show && twitterModal.output && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-white">🐦 Post to X</h3>
              <p className="text-gray-400 text-sm mt-1">Enter your Arcade credentials to post</p>
            </div>

            {/* Content Preview */}
            <div className="bg-gray-700 rounded-lg p-3 mb-4">
              <h4 className="font-medium text-white mb-2 text-sm">Content to post:</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                {(() => {
                  try {
                    const content = twitterModal.output.generated_content;
                    if (typeof content === 'string' && content.startsWith('{')) {
                      const parsed = JSON.parse(content);
                      const text = parsed.text || parsed.content || content;
                      return text.length > 150 ? text.substring(0, 150) + '...' : text;
                    }
                    const text = content.toString();
                    return text.length > 150 ? text.substring(0, 150) + '...' : text;
                  } catch {
                    return twitterModal.output.generated_content.toString().substring(0, 150) + '...';
                  }
                })()}
              </p>
            </div>

            {/* Credential Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Arcade User ID
                </label>
                <input
                  type="text"
                  value={twitterCredentials.arcade_user_id}
                  onChange={(e) => setTwitterCredentials(prev => ({ ...prev, arcade_user_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your Arcade User ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Arcade API Key
                </label>
                <input
                  type="password"
                  value={twitterCredentials.arcade_api_key}
                  onChange={(e) => setTwitterCredentials(prev => ({ ...prev, arcade_api_key: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your Arcade API Key"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setTwitterModal({ show: false, output: null })}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={submitTwitterPost}
                disabled={!twitterCredentials.arcade_user_id || !twitterCredentials.arcade_api_key}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-2" />
                Post to X
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
                onClick={cancelDelete}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
