'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Sparkles, Trash2, CheckCircle, XCircle, Info, Eye } from 'lucide-react';
import { apiClient, TokenManager } from './api-client';

interface Persona {
  id: string;
  name: string;
  description?: string;
}

interface Document {
  id: string;
  title: string;
  content: string;
  author?: string;
  run_id?: string;
}

interface Run {
  id: string;
  name: string;
  created_at: string;
  started_at?: string;
  status?: string;
  input_source?: {
    source_type?: string;
    search_query?: string;
    query?: string;
    config?: any;
  };
  document_count?: number;
  documents?: any[];
  meta_data?: any;
}

interface Output {
  id: string;
  generated_content: any;
  status: string;
  score?: number;
  created_at: string;
  content_type: string;
  persona_id: string;
  source_document_id: string;
  publish_config?: any;
}

export default function GenerateContent() {
  // State
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Form state
  const [commentType, setCommentType] = useState<'reply' | 'new_content'>('new_content');
  const [contentSource, setContentSource] = useState('documents');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedRun, setSelectedRun] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('');
  const [commentStyle, setCommentStyle] = useState('insightful');
  const [outputType, setOutputType] = useState('tweet_single');
  const [customContent, setCustomContent] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [llmProvider, setLlmProvider] = useState<'anthropic' | 'openai' | 'google'>('anthropic');
  const [temperature, setTemperature] = useState(0.7);
  const [apiKey, setApiKey] = useState('');
  
  // Run details modal state
  const [showRunDetails, setShowRunDetails] = useState(false);
  const [selectedRunDetails, setSelectedRunDetails] = useState<any>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchPersonas();
    fetchDocuments();
    fetchRuns();
    fetchOutputs();
  }, []);

  const fetchPersonas = async () => {
    try {
      const data = await apiClient.getPersonas();
      console.log('📋 Fetched personas:', data);
      setPersonas(data);
    } catch (error) {
      console.error('Error fetching personas:', error);
      setPersonas([]);
    }
  };

  const fetchDocuments = async () => {
    try {
      const data = await apiClient.getDocuments();
      console.log('📋 Fetched documents:', data);
      console.log('📋 First 3 document IDs:', data.slice(0, 3).map((d: any) => ({ id: d.id, title: d.title })));
      console.log('📋 All document IDs (first 10):', data.slice(0, 10).map((d: any) => d.id));
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    }
  };

  const fetchRuns = async () => {
    try {
      const data = await apiClient.getRuns();
      setRuns(data);
    } catch (error) {
      console.error('Error fetching runs:', error);
      setRuns([]);
    }
  };

  const fetchOutputs = async () => {
    try {
      const data = await apiClient.getOutputs();
      setOutputs(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching outputs:', error);
      setOutputs([]);
      setLoading(false);
    }
  };

  const handleDeleteOutput = async (outputId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Output',
      message: 'Are you sure you want to delete this generated output? This action cannot be undone.',
      onConfirm: () => confirmDeleteOutput(outputId)
    })
  }

  const confirmDeleteOutput = async (outputId: string) => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    
    try {
      console.log('🗑️ Deleting output:', outputId)
      await apiClient.deleteOutput(outputId)
      console.log('✅ Output deleted')
      await fetchOutputs() // Refresh the list
    } catch (error) {
      console.error('❌ Error deleting output:', error)
      alert('Failed to delete output. Please try again.')
    }
  };

  const handleDocumentSelection = (documentId: string) => {
    console.log('📝 Document selected:', documentId);
    if (commentType === 'reply') {
      setSelectedDocuments([documentId]);
    } else {
      setSelectedDocuments(prev => 
        prev.includes(documentId) 
          ? prev.filter(id => id !== documentId)
          : [...prev, documentId]
      );
    }
  };

  const handleGenerate = async () => {
    console.log('🎯 handleGenerate called with:', {
      selectedPersona,
      commentType,
      contentSource,
      selectedDocuments: selectedDocuments.length,
      selectedRun,
      customContent: !!customContent
    });

    if (!selectedPersona) {
      alert('Please select a persona');
      return;
    }

    if (commentType === 'new_content') {
      if (contentSource === 'documents' && selectedDocuments.length === 0) {
        alert('Please select at least one document');
        return;
      }
      if (contentSource === 'run' && !selectedRun) {
        alert('Please select a search run');
        return;
      }
      if (contentSource === 'custom' && !customContent.trim()) {
        alert('Please provide custom content');
        return;
      }
    }

    if (commentType === 'reply' && selectedDocuments.length === 0 && !customContent) {
      alert('Please select a document or provide custom content');
      return;
    }

    setGenerating(true);
    
    const requestBody: any = {
      comment_type: commentType,
      content_type: outputType,
      persona_id: selectedPersona,
      comment_style: commentStyle,
      llm_provider: llmProvider,
      temperature: temperature
    };

    // Add API key if provided based on LLM provider
    if (apiKey.trim()) {
      if (llmProvider === 'openai') {
        requestBody.openai_api_key = apiKey.trim();
      } else if (llmProvider === 'anthropic') {
        requestBody.anthropic_api_key = apiKey.trim();
      } else if (llmProvider === 'google') {
        requestBody.google_api_key = apiKey.trim();
      }
    }

    if (commentType === 'new_content') {
      if (contentSource === 'documents') {
        requestBody.document_ids = selectedDocuments;
      } else if (contentSource === 'run') {
        if (!selectedRun) {
          alert('Please select a search run');
          setGenerating(false);
          return;
        }
        // Validate that the run exists - documents will be fetched by backend
        const selectedRunData = runs.find(r => r.id === selectedRun);
        console.log('🔍 Search run validation:', {
          selectedRun,
          selectedRunData: selectedRunData ? {
            id: selectedRunData.id,
            query: selectedRunData.query,
            status: selectedRunData.status,
            total_documents: selectedRunData.total_documents || 0
          } : null
        });
        
        if (!selectedRunData) {
          console.error('❌ Search run validation failed: Run not found');
          alert('Selected search run not found. Please choose a different run.');
          setGenerating(false);
          return;
        }
        
        // Check if run has any documents (backend will handle fetching them)
        if (selectedRunData.total_documents === 0) {
          console.error('❌ Search run validation failed: No documents in run');
          alert('Selected search run has no documents. Please choose a different run or use custom content.');
          setGenerating(false);
          return;
        }
        requestBody.run_id = selectedRun;
      } else if (contentSource === 'custom') {
        if (!customContent.trim()) {
          alert('Please provide custom content');
          setGenerating(false);
          return;
        }
        requestBody.post_content = customContent;
        requestBody.post_title = customTitle;
      }
    } else if (commentType === 'reply') {
      if (selectedDocuments.length > 0) {
        requestBody.document_ids = selectedDocuments;
      } else {
        requestBody.post_content = customContent;
      }
    }

    try {
      console.log('🚀 Sending request:', JSON.stringify(requestBody, null, 2));
      console.log('📊 Request details:', {
        contentSource,
        commentType,
        selectedDocuments: selectedDocuments.length,
        selectedRun,
        hasCustomContent: !!customContent
      });
      
      const data = await apiClient.generateComments(requestBody);
      console.log('✅ Generate comments response:', data);
      
      await fetchOutputs();
      // Clear form after successful generation
      setCustomContent('');
      setCustomTitle('');
      setSelectedDocuments([]);
      setSelectedRun('');
      
      alert('Content generated successfully!');
    } catch (error) {
      console.error('❌ Error generating content:', error);
      console.error('📋 Request that failed:', requestBody);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert(`Error generating content: ${error.message || 'Unknown error'}. Please check your API keys and try again.`);
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'pending_review': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'pending_review': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left Panel - Inputs */}
      <div className="w-2/3 bg-gray-800 border-r border-gray-700 p-6 overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <Sparkles className="mr-2 h-5 w-5" />
          Generate Content
        </h2>
        
        <div className="space-y-4">
          {/* Comment Type */}
          <div>
            <Label className="text-gray-300">Comment Type</Label>
            <Select value={commentType} onValueChange={(value) => setCommentType(value as 'reply' | 'new_content')}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="new_content" className="text-white hover:bg-gray-600">New Content</SelectItem>
                <SelectItem value="reply" className="text-white hover:bg-gray-600">Reply</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Output Type */}
          <div>
            <Label className="text-gray-300">Output Type</Label>
            <Select value={outputType} onValueChange={setOutputType}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="tweet_single" className="text-white hover:bg-gray-600">Single Tweet</SelectItem>
                <SelectItem value="tweet_thread" className="text-white hover:bg-gray-600">Tweet Thread</SelectItem>
                <SelectItem value="twitter_reply" className="text-white hover:bg-gray-600">Twitter Reply</SelectItem>
                <SelectItem value="linkedin_post" className="text-white hover:bg-gray-600">LinkedIn Post</SelectItem>
                <SelectItem value="linkedin_comment" className="text-white hover:bg-gray-600">LinkedIn Comment</SelectItem>
                <SelectItem value="social_comment" className="text-white hover:bg-gray-600">Social Comment</SelectItem>
                <SelectItem value="blog_post" className="text-white hover:bg-gray-600">Blog Post</SelectItem>
                <SelectItem value="reddit_comment" className="text-white hover:bg-gray-600">Reddit Comment</SelectItem>
                <SelectItem value="facebook_comment" className="text-white hover:bg-gray-600">Facebook Comment</SelectItem>
                <SelectItem value="instagram_comment" className="text-white hover:bg-gray-600">Instagram Comment</SelectItem>
                <SelectItem value="youtube_comment" className="text-white hover:bg-gray-600">YouTube Comment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Source */}
          {commentType === 'new_content' && (
            <div>
              <Label className="text-gray-300">Content Source</Label>
              <Select value={contentSource} onValueChange={setContentSource}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="documents" className="text-white hover:bg-gray-600">Documents</SelectItem>
                  <SelectItem value="run" className="text-white hover:bg-gray-600">Use Search Run</SelectItem>
                  <SelectItem value="custom" className="text-white hover:bg-gray-600">Custom Content</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Document Selection */}
          {(contentSource === 'documents' || commentType === 'reply') && (
            <div>
              <Label className="text-gray-300">
                Select Context {commentType === 'reply' ? '(Choose one)' : '(Choose multiple)'}
              </Label>
              <div className="max-h-40 overflow-y-auto border border-gray-600 rounded p-2 bg-gray-700">
                {documents.map((doc, index) => {
                  if (index < 3) console.log(`📝 Rendering doc ${index}:`, { id: doc.id, title: doc.title });
                  return (
                  <label key={doc.id} className="flex items-start space-x-2 p-2 hover:bg-gray-600 rounded cursor-pointer">
                    <input
                      type={commentType === 'reply' ? 'radio' : 'checkbox'}
                      name={commentType === 'reply' ? 'document' : undefined}
                      checked={selectedDocuments.includes(doc.id)}
                      onChange={() => handleDocumentSelection(doc.id)}
                      className="text-blue-600 mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{doc.title}</div>
                      {doc.author && (
                        <div className="text-xs text-gray-400 mt-1">by {doc.author}</div>
                      )}
                      <div className="text-xs text-gray-300 mt-1 line-clamp-2">
                        {doc.content ? doc.content.substring(0, 120) + (doc.content.length > 120 ? '...' : '') : 'No content preview'}
                      </div>
                    </div>
                  </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Run Selection */}
          {contentSource === 'run' && (
            <div className="space-y-3">
              <Label className="text-gray-300">Select Search Run</Label>
              <div className="flex gap-2">
                <Select value={selectedRun} onValueChange={setSelectedRun}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white flex-1">
                    <SelectValue placeholder="Select a search run..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {runs
                      .filter(run => {
                        const status = run.status || 'completed';
                        return status !== 'failed'; // Filter out failed runs
                      })
                      .sort((a, b) => {
                        // Sort by created_at in descending order (newest first)
                        const dateA = new Date(a.created_at || a.started_at || '1970-01-01').getTime();
                        const dateB = new Date(b.created_at || b.started_at || '1970-01-01').getTime();
                        return dateB - dateA;
                      })
                       .map((run) => {
                         // Extract search details from run metadata
                         const sourceType = run.input_source?.source_type || 'twitter_keywords';
                         
                         // Convert source type to display format
                         const searchType = sourceType === 'twitter_keywords' ? 'X' : 
                                          sourceType === 'twitter_user' ? 'X User' :
                                          sourceType === 'twitter_hashtag' ? 'X Hashtag' :
                                          'X';
                         
                         // Extract search query from input_source, config, or metadata
                         let searchQuery = run.input_source?.search_query || 
                                         run.input_source?.query || 
                                         run.input_source?.config?.search_query ||
                                         run.input_source?.config?.query ||
                                         run.meta_data?.search_query ||
                                         run.meta_data?.query ||
                                         run.name || // Fallback to run name which might contain query info
                                         'Unknown query';
                         
                         // Extract search parameters from input_source config
                         const config = run.input_source?.config || {};
                         const fetchLimit = config.limit || run.meta_data?.limit || 'N/A';
                         const finalResults = config.target_number || run.meta_data?.target_number || 'N/A';
                         const rankTweets = config.rank_tweets !== undefined ? config.rank_tweets : run.meta_data?.rank_tweets;
                         const searchTypeDetail = config.search_type || run.meta_data?.search_type || 'keywords';
                         
                         // Truncate long queries for display
                         const displayQuery = searchQuery.length > 25 ? 
                                            searchQuery.substring(0, 25) + '...' : 
                                            searchQuery;
                         
                         // Format date
                         const formatDate = () => {
                           const dateStr = run.created_at || run.started_at;
                           if (dateStr) {
                             try {
                               return new Date(dateStr).toLocaleDateString('en-US', {
                                 month: 'short',
                                 day: 'numeric',
                                 hour: '2-digit',
                                 minute: '2-digit'
                               });
                             } catch (e) {
                               return 'No date';
                             }
                           }
                           return 'No date';
                         };
                         
                         // Count results
                         const resultCount = run.documents?.length || 0;
                         
                         return (
                           <SelectItem key={run.id} value={run.id} className="text-white hover:bg-gray-600 data-[highlighted]:bg-gray-600 data-[highlighted]:text-white py-4">
                             <div className="flex flex-col space-y-1 w-full">
                               <div className="flex items-center justify-between">
                                 <span className="font-medium truncate">
                                   {searchType} • {searchTypeDetail} • {formatDate()}
                                 </span>
                                 <span className="text-xs font-medium opacity-80">
                                   {resultCount} results
                                 </span>
                               </div>
                               <div className="text-xs opacity-90">
                                 Query: "{displayQuery}"
                               </div>
                               <div className="flex items-center justify-between text-xs opacity-80">
                                 <span>Fetch: {fetchLimit} → Final: {finalResults}</span>
                                 <span className="flex items-center gap-1">
                                   {rankTweets && <span className="text-green-400">✓ Ranked</span>}
                                   {rankTweets === false && <span className="opacity-60">No Ranking</span>}
                                 </span>
                               </div>
                             </div>
                           </SelectItem>
                         );
                       })}
                  </SelectContent>
                </Select>
                {selectedRun && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const runDetails = await apiClient.getRun(selectedRun);
                        setSelectedRunDetails(runDetails);
                        setShowRunDetails(true);
                      } catch (error) {
                        console.error('Failed to fetch run details:', error);
                      }
                    }}
                    className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white px-3"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Custom Content */}
          {contentSource === 'custom' && (
            <>
              <div>
                <Label className="text-gray-300">Title</Label>
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Enter post title..."
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Content</Label>
                <Textarea
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  placeholder="Enter post content..."
                  className="bg-gray-700 border-gray-600 text-white min-h-32"
                />
              </div>
            </>
          )}

          {/* Persona Selection */}
          <div>
            <Label className="text-gray-300">Persona</Label>
            <Select value={selectedPersona} onValueChange={setSelectedPersona}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select persona..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {personas.map((persona) => (
                  <SelectItem key={persona.id} value={persona.id} className="text-white hover:bg-gray-600">
                    {persona.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Comment Style */}
          <div>
            <Label className="text-gray-300">Comment Style</Label>
            <Select value={commentStyle} onValueChange={setCommentStyle}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="insightful" className="text-white hover:bg-gray-600">Insightful</SelectItem>
                <SelectItem value="engaging" className="text-white hover:bg-gray-600">Engaging</SelectItem>
                <SelectItem value="professional" className="text-white hover:bg-gray-600">Professional</SelectItem>
                <SelectItem value="casual" className="text-white hover:bg-gray-600">Casual</SelectItem>
                <SelectItem value="thoughtful" className="text-white hover:bg-gray-600">Thoughtful</SelectItem>
                <SelectItem value="funny" className="text-white hover:bg-gray-600">Funny</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* LLM Provider */}
          <div>
            <Label className="text-gray-300">LLM Provider</Label>
            <Select value={llmProvider} onValueChange={(value) => setLlmProvider(value as 'anthropic' | 'openai' | 'google')}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="anthropic" className="text-white hover:bg-gray-600">Anthropic</SelectItem>
                <SelectItem value="openai" className="text-white hover:bg-gray-600">OpenAI</SelectItem>
                <SelectItem value="google" className="text-white hover:bg-gray-600">Google</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Temperature */}
          <div>
            <Label className="text-gray-300">Temperature: {temperature}</Label>
            <div className="relative mt-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${temperature * 100}%, #374151 ${temperature * 100}%, #374151 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.0 (Focused)</span>
                <span>0.5 (Balanced)</span>
                <span>1.0 (Creative)</span>
              </div>
            </div>
          </div>

          {/* API Key */}
          <div>
            <Label className="text-gray-300">API Key (Optional)</Label>
            <Input
              type="password"
              placeholder="Enter your LLM API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use server defaults
            </p>
          </div>

          <Button
            onClick={() => {
              console.log('🔘 Generate button clicked!');
              handleGenerate();
            }}
            disabled={generating || !selectedPersona}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Content
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right Panel - Results */}
      <div className="flex-1 bg-gray-900 p-6 overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          Generated Outputs
        </h2>
        
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-400">Loading outputs...</p>
              </div>
            ) : outputs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No generated outputs yet. Use the left panel to generate content.</p>
              </div>
            ) : (
              outputs.map((output) => {
                console.log('🏷️ Output data structure:', output);
                return (
                <Card key={output.id} className="bg-gray-700 border-gray-600 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(output.status)}
                      {/* Content Type Badge */}
                      {output.content_type && (
                        <Badge variant="outline" className="bg-blue-600 text-white border-blue-500">
                          {output.content_type.replace('_', ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                        </Badge>
                      )}
                      {/* Persona Badge */}
                      {output.persona_id && (() => {
                        const persona = personas.find(p => p.id === output.persona_id);
                        return persona ? (
                          <Badge variant="outline" className="bg-green-600 text-white border-green-500">
                            👤 {persona.name}
                          </Badge>
                        ) : null;
                      })()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOutput(output.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="bg-gray-800 p-3 rounded">
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">
                        {(() => {
                          try {
                            if (typeof output.generated_content === 'string') {
                              const parsed = JSON.parse(output.generated_content);
                              return (parsed as any).text || (parsed as any).content || output.generated_content;
                            }
                            return (output.generated_content as any).text || (output.generated_content as any).content || String(output.generated_content);
                          } catch {
                            return String(output.generated_content);
                          }
                        })()}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {output.score && (
                          <>
                            <span className="text-sm text-gray-400">Score:</span>
                            <Badge className="bg-blue-100 text-blue-800">
                              {(output.score / 10).toFixed(1)}/10
                            </Badge>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(output.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
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

      {/* Run Details Modal */}
      {showRunDetails && selectedRunDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Run Details</h3>
              <Button 
                onClick={() => setShowRunDetails(false)}
                variant="outline"
                size="sm"
                className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Basic Run Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Run ID</label>
                  <p className="text-white font-mono text-sm">{selectedRunDetails.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                  <p className="text-white">{selectedRunDetails.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                  <Badge variant={selectedRunDetails.status === 'completed' ? 'default' : 'secondary'}>
                    {selectedRunDetails.status}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Started</label>
                  <p className="text-white text-sm">{new Date(selectedRunDetails.started_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Search Query */}
              {selectedRunDetails.search_query && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Search Query</label>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-white">{selectedRunDetails.search_query}</p>
                  </div>
                </div>
              )}

              {/* Parameters */}
              {selectedRunDetails.search_params && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Search Parameters</label>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {Object.entries(selectedRunDetails.search_params).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-gray-400">{key}:</span>
                          <span className="text-white ml-2">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Results Summary */}
              {selectedRunDetails.results_count !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Results</label>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-white">{selectedRunDetails.results_count} documents found</p>
                  </div>
                </div>
              )}

              {/* Metadata (expandable) */}
              {selectedRunDetails.meta_data && (
                <details className="bg-gray-700 rounded-lg">
                  <summary className="p-3 cursor-pointer text-gray-300 hover:text-white">
                    View Raw Metadata
                  </summary>
                  <div className="px-3 pb-3">
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      {JSON.stringify(selectedRunDetails.meta_data, null, 2)}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
