// API Client for Megaforce Backend Integration
// Connects the Next.js frontend to the existing FastAPI backend

// Use deployed Heroku API directly
const API_BASE_URL = 'https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com'
console.log('🔧 Using deployed API:', API_BASE_URL)

// Types for API responses (based on existing backend schemas)
export interface User {
  id: string
  email: string
  username: string
  created_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface TwitterSearchRequest {
  search_type: 'keywords' | 'user'
  search_query: string
  limit?: number
  rank_tweets?: boolean
  llm_provider?: string
  llm_model?: string
  openai_api_key?: string
  anthropic_api_key?: string
  google_api_key?: string
  arcade_user?: string
  arcade_secret?: string
}

export interface CommentGenerationRequest {
  comment_type: 'reply' | 'new_content'
  document_id?: string
  document_ids?: string[]
  run_id?: string
  post_content?: string
  post_title?: string
  persona_ids?: string[]
  num_comments?: number
  llm_provider?: string
  llm_model?: string
  openai_api_key?: string
  anthropic_api_key?: string
  google_api_key?: string
}

export interface Comment {
  id: string
  text: string
  style: string
  confidence: number
  processing_time: number
  created_at: string
}

export interface Persona {
  id: string
  name: string
  description: string
  style_preferences: Record<string, any>
  owner_id: string
  created_at: string
  is_active?: boolean
  updated_at?: string
}

export interface Document {
  id: string
  title: string
  content: string
  url?: string
  author?: string
  score: number
  priority: number
  platform_data?: Record<string, any>
  document_type: string
  reference_type?: string
  owner_id: string
  is_style_reference: boolean
  persona_ids: string[]
  run_id?: string
  created_at: string
  persona_count?: number
}

export interface DocumentCreate {
  title: string
  content: string
  url?: string
  author?: string
  score?: number
  priority?: number
  platform_data?: Record<string, any>
  document_type?: string
  reference_type?: string
  is_style_reference?: boolean
  persona_ids?: string[]
  run_id?: string
}

// Token management
class TokenManager {
  private static TOKEN_KEY = 'megaforce_token'
  
  static getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.TOKEN_KEY)
  }
  
  static setToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.TOKEN_KEY, token)
  }
  
  static removeToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.TOKEN_KEY)
  }
}

// Base API client with authentication
class ApiClient {
  private baseURL: string
  
  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }
  
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = TokenManager.getToken()
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    }
    
    console.log(`🔄 API request: ${options.method || 'GET'} ${endpoint}`)
    const response = await fetch(`${this.baseURL}${endpoint}`, config)
    console.log(`📥 API response status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
      }
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      if (errorData?.detail) {
        if (Array.isArray(errorData.detail)) {
          // Handle FastAPI validation errors
          const validationErrors = errorData.detail.map((err: any) => 
            `${err.loc?.join('.') || 'field'}: ${err.msg || err.message || 'validation error'}`
          ).join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else {
          errorMessage = JSON.stringify(errorData.detail);
        }
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
      console.error('💥 API Error Details:', errorData);
      throw new Error(errorMessage);
    }
    
    // For DELETE requests or empty responses (204 No Content), return empty object
    if (options.method === 'DELETE' || response.status === 204 || response.headers.get('content-length') === '0') {
      console.log(`✅ Empty response handled correctly for ${options.method}`)
      return {} as T
    }
    
    try {
      return await response.json()
    } catch (error) {
      console.warn('Failed to parse response as JSON, returning empty result', error)
      return {} as T
    }
  }
  
  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Login failed')
    }
    
    const data = await response.json()
    TokenManager.setToken(data.access_token)
    return data
  }
  
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }
  
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/v1/auth/me')
  }
  
  logout(): void {
    TokenManager.removeToken()
  }
  
  // Twitter endpoints
  async searchTwitter(searchRequest: TwitterSearchRequest): Promise<any> {
    return this.request('/api/v1/twitter/search', {
      method: 'POST',
      body: JSON.stringify(searchRequest),
    })
  }
  
  async postToTwitter(content: string, credentials?: { arcade_user_id: string; arcade_api_key: string }): Promise<any> {
    const payload: any = { tweet_text: content }
    if (credentials) {
      payload.arcade_user_id = credentials.arcade_user_id
      payload.arcade_api_key = credentials.arcade_api_key
    }
    return this.request('/api/v1/twitter/post', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }
  
  // Comment generation endpoints
  async generateComments(request: CommentGenerationRequest): Promise<Comment[]> {
    return this.request('/api/v1/style/generate-comments', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }
  
  // Persona endpoints
  async getPersonas(): Promise<Persona[]> {
    return this.request('/api/v1/personas/')
  }
  
  async createPersona(persona: Omit<Persona, 'id' | 'owner_id' | 'created_at'>): Promise<Persona> {
    return this.request('/api/v1/personas/', {
      method: 'POST',
      body: JSON.stringify(persona),
    })
  }
  
  async updatePersona(id: string, persona: Partial<Persona>): Promise<Persona> {
    return this.request(`/api/v1/personas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(persona),
    })
  }
  
  async deletePersona(id: string): Promise<void> {
    return this.request(`/api/v1/personas/${id}`, {
      method: 'DELETE',
    })
  }
  




  async getStyleReferences(personaId?: string): Promise<Document[]> {
    const params = personaId ? `?persona_id=${personaId}&is_style_reference=true` : '?is_style_reference=true'
    return this.request(`/api/v1/documents${params}`)
  }

  async createStyleReference(personaId: string, styleRef: DocumentCreate): Promise<Document> {
    const documentData = {
      title: styleRef.title,
      content: styleRef.content,
      document_type: 'style_reference',
      reference_type: styleRef.reference_type || 'document',
      is_style_reference: true,
      url: styleRef.url || '',
      platform_data: styleRef.platform_data || {},
      persona_ids: [personaId]  // Link to persona during creation
    }
    
    const document = await this.request(`/api/v1/documents/`, {
      method: 'POST',
      body: JSON.stringify(documentData)
    }) as Document
    
    return document
  }

  async updateStyleReference(id: string, styleRef: Partial<DocumentCreate>): Promise<Document> {
    console.log('✏️ API Client: Updating style reference', id, 'with data:', styleRef)
    
    const updateData = {
      title: styleRef.title,
      content: styleRef.content || '',
      reference_type: styleRef.reference_type || 'document',
      url: styleRef.url || '',
      platform_data: styleRef.platform_data || {}
    }
    
    console.log('📄 API Client: Updating document with data:', updateData)
    
    const result = await this.request(`/api/v1/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    }) as Document
    
    console.log('✅ API Client: Successfully updated style reference:', result)
    
    return result
  }

  async linkStyleReference(documentId: string, personaId: string): Promise<void> {
    console.log(`🔗 API Client: Linking document ${documentId} to persona ${personaId}`)
    try {
      // First, get the current document to see its current persona_ids
      const currentDocument = await this.request(`/api/v1/documents/${documentId}`, {
        method: 'GET'
      }) as any
      
      console.log(`🔍 Current document persona_ids:`, currentDocument.persona_ids)
      
      // Add the persona to the list if not already present
      const currentPersonaIds = currentDocument.persona_ids || []
      const updatedPersonaIds = currentPersonaIds.includes(personaId) 
        ? currentPersonaIds 
        : [...currentPersonaIds, personaId]
      
      console.log(`🔍 Updated persona_ids after adding ${personaId}:`, updatedPersonaIds)
      
      // Update document with the new persona_ids list
      await this.request(`/api/v1/documents/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          persona_ids: updatedPersonaIds
        })
      })
      
      console.log(`✅ API Client: Successfully linked document to persona`)
    } catch (error) {
      console.error(`❌ API Client: Error linking document:`, error)
      throw error
    }
  }

  async unlinkStyleReference(documentId: string, personaId: string): Promise<void> {
    try {
      // First, get the current document to see its current persona_ids
      const currentDocument = await this.request(`/api/v1/documents/${documentId}`, {
        method: 'GET'
      }) as any
      
      // Remove the specific persona from the list
      const updatedPersonaIds = (currentDocument.persona_ids || []).filter((id: string) => id !== personaId)
      
      // Update document with the new persona_ids list
      await this.request(`/api/v1/documents/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          persona_ids: updatedPersonaIds
        })
      })
    } catch (error) {
      console.error('Error unlinking document:', error)
      throw error
    }
  }

  async deleteStyleReference(id: string): Promise<void> {
    console.log(`🗑️ API Client: Permanently deleting document: ${id}`)
    try {
      await this.request(`/api/v1/documents/${id}`, {
        method: 'DELETE'
      })
      console.log(`✅ API Client: Successfully deleted document: ${id}`)
    } catch (error) {
      console.error(`❌ API Client: Error deleting document ${id}:`, error)
      throw error
    }
  }
  
  // Output/Approval endpoints
  async getOutputs(): Promise<any[]> {
    return this.request('/api/v1/outputs/')
  }
  
  async approveOutput(id: string, score: number, feedback?: string): Promise<any> {
    return this.request(`/api/v1/outputs/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ score, feedback }),
    })
  }
  
  async rejectOutput(id: string, score: number, feedback?: string): Promise<any> {
    return this.request(`/api/v1/outputs/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ score, feedback }),
    })
  }
  
  async deleteOutput(id: string): Promise<void> {
    return this.request(`/api/v1/outputs/${id}`, {
      method: 'DELETE',
    })
  }
  
  // Run endpoints
  async getRuns(): Promise<any[]> {
    return this.request('/api/v1/runs/')
  }
  
  async getRun(id: string): Promise<any> {
    return this.request(`/api/v1/runs/${id}`)
  }
  
  // Document endpoints
  async getDocuments(params?: Record<string, any>): Promise<any> {
    if (!params || Object.keys(params).length === 0) {
      return this.request('/api/v1/documents/')
    }
    
    // Convert params object to URL query string
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString())
      }
    })
    
    return this.request(`/api/v1/documents/?${queryParams.toString()}`)
  }
  
  async getDocument(id: string): Promise<any> {
    return this.request(`/api/v1/documents/${id}`)
  }
  
  async updateDocument(id: string, updates: Partial<{title: string, content: string, reference_type: string, url: string, persona_ids: string[]}>): Promise<any> {
    return this.request(`/api/v1/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }
  
  async deleteDocument(id: string): Promise<void> {
    console.log(`🗑️ API Client: Sending DELETE request for document ${id}`)
    try {
      await this.request(`/api/v1/documents/${id}`, {
        method: 'DELETE'
      })
      console.log(`✅ API Client: Successfully deleted document ${id}`)
      return
    } catch (error: any) {
      // If the document was not found, consider it already deleted
      if (error.message && error.message.includes('not found')) {
        console.log(`⚠️ API Client: Document ${id} not found (already deleted)`)
        return
      }
      
      console.error(`❌ API Client: Error deleting document ${id}:`, error)
      throw error
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export { TokenManager }
