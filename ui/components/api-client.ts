// API Client for Megaforce Backend Integration
// Connects the Next.js frontend to the existing FastAPI backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

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
    
    const response = await fetch(`${this.baseURL}${endpoint}`, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response.json()
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
  
  async postToTwitter(content: string): Promise<any> {
    return this.request('/api/v1/twitter/post', {
      method: 'POST',
      body: JSON.stringify({ content }),
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
  
  // Document endpoints
  async getDocuments(): Promise<any[]> {
    return this.request('/api/v1/documents/')
  }
  
  async getDocument(id: string): Promise<any> {
    return this.request(`/api/v1/documents/${id}`)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export { TokenManager }
