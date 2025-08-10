'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  const [approvalModal, setApprovalModal] = useState<{
    show: boolean
    output: OutputSchema | null
    action: 'approve' | 'reject'
  }>({ show: false, output: null, action: 'approve' })
  
  const [approvalForm, setApprovalForm] = useState<ApprovalRequest>({
    score: 8,
    feedback: ''
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
        return output.status === 'approved' && output.publish_config
      }
      if (columnId === 'approved') {
        return output.status === 'approved' && !output.publish_config
      }
      return output.status === columnId
    })
  }

  // Handle approval/rejection
  const handleApproval = async () => {
    if (!approvalModal.output) return
    
    try {
      if (approvalModal.action === 'approve') {
        await apiClient.approveOutput(
          approvalModal.output.id, 
          approvalForm.score || 8, 
          approvalForm.feedback
        )
      } else {
        await apiClient.rejectOutput(
          approvalModal.output.id, 
          approvalForm.score || 8, 
          approvalForm.feedback
        )
      }
      
      setApprovalModal({ show: false, output: null, action: 'approve' })
      setApprovalForm({ score: 8, feedback: '' })
      await fetchData() // Refresh data
      setError(`Output ${approvalModal.action}d successfully`)
    } catch (err) {
      console.error(`❌ Error ${approvalModal.action}ing output:`, err)
      setError(`Failed to ${approvalModal.action} output`)
    }
  }

  // Handle delete
  const handleDelete = async (outputId: string) => {
    if (!confirm('Are you sure you want to delete this output?')) return
    
    try {
      await apiClient.deleteOutput(outputId)
      await fetchData()
      setError('Output deleted successfully')
    } catch (err) {
      console.error('❌ Error deleting output:', err)
      setError('Failed to delete output')
    }
  }

  // Format content preview
  const formatContentPreview = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Approval Queue</h1>
          <p className="text-gray-400">Manage and approve generated content</p>
        </div>
        <Button onClick={fetchData} variant="outline">
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
            <option value="all">All Personas</option>
            {personas.map(persona => (
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
            <option value="all">All Types</option>
            <option value="SOCIAL_COMMENT">Social Comment</option>
            <option value="LINKEDIN_COMMENT">LinkedIn Comment</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-gray-400">
          {filteredOutputs.length} items
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-6 min-h-[600px]">
        {COLUMNS.map(column => {
          const columnOutputs = getOutputsForColumn(column.id)
          
          return (
            <div key={column.id} className={`${column.color} rounded-lg p-4`}>
              {/* Column Header */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-1">{column.title}</h3>
                <p className="text-xs text-gray-600 mb-2">{column.description}</p>
                <Badge variant="secondary" className="text-xs">
                  {columnOutputs.length}
                </Badge>
              </div>

              {/* Column Content */}
              <div className="space-y-3">
                {columnOutputs.map(output => {
                  const persona = personas.find(p => p.id === output.persona_id)
                  
                  return (
                    <div key={output.id} className="bg-white rounded-lg p-3 shadow-sm border">
                      {/* Content Preview */}
                      <div className="mb-3">
                        <p className="text-sm text-gray-800 leading-relaxed">
                          {formatContentPreview(output.generated_content)}
                        </p>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-2 mb-3">
                        {persona && (
                          <Badge className={`text-xs ${getPersonaBadgeColor(persona.id)}`}>
                            {persona.name}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {output.content_type}
                        </Badge>
                        {output.score && (
                          <Badge className="text-xs bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" />
                            {output.score}
                          </Badge>
                        )}
                      </div>

                      {/* Timestamps */}
                      <div className="text-xs text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(output.created_at).toLocaleDateString()}
                        </div>
                        {output.published_url && (
                          <div className="flex items-center gap-1 mt-1">
                            <ExternalLink className="h-3 w-3" />
                            <a 
                              href={output.published_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View Post
                            </a>
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
                              className="text-xs h-7 text-green-600 border-green-300"
                              onClick={() => setApprovalModal({
                                show: true,
                                output,
                                action: 'approve'
                              })}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs h-7 text-red-600 border-red-300"
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

                        {(output.status === 'approved' && !output.publish_config) && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs h-7"
                              onClick={() => {
                                // TODO: Schedule post
                              }}
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              Schedule
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs h-7"
                              onClick={() => {
                                // TODO: Post now
                              }}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Post Now
                            </Button>
                          </>
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {approvalModal.action === 'approve' ? '✅ Approve' : '❌ Reject'} Content
              </h3>
              <Button 
                variant="outline" 
                onClick={() => setApprovalModal({ show: false, output: null, action: 'approve' })}
              >
                Cancel
              </Button>
            </div>

            {/* Content Preview */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Content:</h4>
              <p className="text-gray-700 leading-relaxed">
                {approvalModal.output.generated_content}
              </p>
            </div>

            {/* Approval Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 (Poor)</span>
                  <span className="font-medium">Score: {approvalForm.score}</span>
                  <span>10 (Excellent)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback (Optional)
                </label>
                <textarea
                  value={approvalForm.feedback || ''}
                  onChange={(e) => setApprovalForm({
                    ...approvalForm,
                    feedback: e.target.value
                  })}
                  placeholder="Add your feedback or suggestions..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleApproval}
                  className={approvalModal.action === 'approve' ? 
                    'bg-green-600 hover:bg-green-700' : 
                    'bg-red-600 hover:bg-red-700'
                  }
                >
                  {approvalModal.action === 'approve' ? 'Approve' : 'Reject'} Content
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setApprovalModal({ show: false, output: null, action: 'approve' })}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
