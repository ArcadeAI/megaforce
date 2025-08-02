# Megaforce UI - Social Media Management Frontend

This is the Next.js frontend for the Megaforce Social Media Management System. It connects to the **existing FastAPI backend** located in the `/api` directory to provide a modern web interface for AI-powered social media content generation and management.

## Project Status

### ✅ What's Already Built
- **Complete FastAPI Backend** (`/api` directory)
  - Authentication system with JWT tokens
  - Twitter/X integration via Arcade API
  - AI comment generation with multiple LLM providers
  - Approval workflow with scoring system
  - Persona management system
  - Database models and migrations (Supabase PostgreSQL)
  - All API endpoints documented and tested

- **Environment Configuration** (`.env` file)
  - Arcade API integration for Twitter/X access
  - Multiple LLM providers (OpenAI, Google, Anthropic)
  - Supabase database connection
  - Production API deployment on Heroku

- **Basic UI Structure** (`/ui` directory)
  - Next.js 15 with App Router setup
  - Tailwind CSS + shadcn/ui components
  - Basic sidebar and dashboard layout (currently Reddit-focused)

### 🚧 What Needs to Be Built
- **Frontend API Client** - Connect UI to existing backend
- **Authentication UI** - Login/register forms and JWT handling
- **Transform Existing Components** - Change from Reddit to social media focus
- **New UI Components** - Comment generation, approval workflow, persona management
- **Real Data Integration** - Replace hardcoded data with API calls

## Architecture

### Current Tech Stack
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL (Supabase)
- **Environment**: uv for Python dependencies
- **APIs**: Arcade (Twitter/X), OpenAI, Anthropic, Google
- **Deployment**: Heroku (backend), Netlify/Vercel (frontend)

### API Integration Points

The UI will connect to these **existing API endpoints**:
- **Production**: `https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/`
- **Local Development**: `http://localhost:8000` (when running API locally)

## Folder Structure

```
ui/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx         # Login page
│   │   └── register/
│   │       └── page.tsx         # Registration page
│   ├── dashboard/                # Main dashboard routes
│   │   ├── page.tsx             # Main dashboard overview
│   │   ├── twitter/
│   │   │   ├── page.tsx         # Twitter search & management
│   │   │   └── search/
│   │   │       └── page.tsx     # Search results view
│   │   ├── comments/
│   │   │   ├── page.tsx         # Comment generation hub
│   │   │   ├── generate/
│   │   │   │   └── page.tsx     # Comment generation wizard
│   │   │   └── approve/
│   │   │       └── page.tsx     # Approval workflow interface
│   │   ├── personas/
│   │   │   ├── page.tsx         # Persona management
│   │   │   ├── create/
│   │   │   │   └── page.tsx     # Create new persona
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Edit existing persona
│   │   └── analytics/
│   │       └── page.tsx         # Analytics dashboard
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout with auth
│   └── page.tsx                 # Landing/redirect page
├── components/                   # Reusable UI components
│   ├── auth/                    # Authentication components
│   │   ├── login-form.tsx       # Login form with validation
│   │   ├── register-form.tsx    # Registration form
│   │   └── auth-guard.tsx       # Protected route wrapper
│   ├── dashboard/               # Dashboard-specific components
│   │   ├── sidebar.tsx          # Navigation sidebar
│   │   ├── header.tsx           # Top header with user menu
│   │   └── stats-cards.tsx      # Dashboard overview cards
│   ├── twitter/                 # Twitter-related components
│   │   ├── search-form.tsx      # Twitter search interface
│   │   ├── tweet-card.tsx       # Individual tweet display
│   │   ├── search-results.tsx   # Search results grid
│   │   └── tweet-detail.tsx     # Detailed tweet view
│   ├── comments/                # Comment generation components
│   │   ├── comment-generator.tsx # Main generation interface
│   │   ├── comment-card.tsx     # Generated comment display
│   │   ├── approval-interface.tsx # Approve/reject interface
│   │   ├── style-selector.tsx   # Style/persona selector
│   │   └── comment-preview.tsx  # Comment preview with editing
│   ├── personas/                # Persona management components
│   │   ├── persona-card.tsx     # Persona display card
│   │   ├── persona-form.tsx     # Create/edit persona form
│   │   ├── style-preferences.tsx # Style configuration
│   │   └── persona-list.tsx     # Persona grid/list view
│   ├── publishing/              # Content publishing components
│   │   ├── publish-queue.tsx    # Publishing queue management
│   │   ├── publish-form.tsx     # Publish to platform form
│   │   └── publish-status.tsx   # Publishing status tracker
│   └── ui/                      # Base UI components (shadcn/ui)
│       └── ... (button, card, input, etc.)
├── lib/                         # Core utilities and API client
│   ├── api/                     # API client functions
│   │   ├── client.ts            # Base API client with auth
│   │   ├── auth.ts              # Authentication endpoints
│   │   ├── twitter.ts           # Twitter API endpoints
│   │   ├── comments.ts          # Comment generation API
│   │   ├── personas.ts          # Persona management API
│   │   ├── outputs.ts           # Output/approval API
│   │   └── types.ts             # API response types
│   ├── auth/                    # Authentication utilities
│   │   ├── context.tsx          # Auth context provider
│   │   ├── hooks.ts             # Auth hooks (useAuth, useUser)
│   │   └── storage.ts           # Token storage utilities
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-api.ts           # Generic API hook
│   │   ├── use-twitter.ts       # Twitter-specific hooks
│   │   ├── use-comments.ts      # Comment generation hooks
│   │   └── use-personas.ts      # Persona management hooks
│   ├── utils.ts                 # General utilities
│   └── constants.ts             # App constants and config
├── types/                       # TypeScript type definitions
│   ├── api.ts                   # API response types
│   ├── auth.ts                  # Authentication types
│   ├── twitter.ts               # Twitter data types
│   ├── comments.ts              # Comment types
│   └── personas.ts              # Persona types
└── ... (config files: package.json, next.config.mjs, etc.)
```

## Key Features & Integration Points

### 1. Authentication System
- **JWT-based authentication** with automatic token refresh
- **Protected routes** using auth guards
- **User context** available throughout the app
- **Secure token storage** in localStorage/httpOnly cookies

### 2. Twitter/X Integration
- **Search interface** for finding relevant content
- **Tweet display** with engagement metrics
- **Content analysis** for comment generation context
- **Real-time search** with filtering and sorting

### 3. AI Comment Generation
- **Multi-LLM support** (OpenAI, Anthropic, Google)
- **Persona-based styling** for consistent brand voice
- **Context-aware generation** from Twitter content
- **Confidence scoring** and quality metrics

### 4. Approval Workflow
- **Review interface** for generated content
- **Scoring system** (1-10) for quality feedback
- **Approve/reject workflow** with comments
- **ML/RL training data** collection

### 5. Persona Management
- **Brand persona creation** with detailed preferences
- **Style configuration** for consistent voice
- **Persona-based generation** across all content
- **Team collaboration** on persona development

### 6. Content Publishing
- **Multi-platform publishing** (Twitter/X, LinkedIn, etc.)
- **Publishing queue** with scheduling
- **Success tracking** and analytics
- **Audit trail** for all published content

## API Integration Patterns

### Authentication Flow
```typescript
// Login and store JWT token
const { token, user } = await authApi.login(credentials)
authStorage.setToken(token)
setUser(user)

// Use token in subsequent requests
const response = await apiClient.get('/api/v1/twitter/search', {
  headers: { Authorization: `Bearer ${token}` }
})
```

### Data Fetching Pattern
```typescript
// Custom hook for API calls
const { data, loading, error } = useApi('/api/v1/personas')

// Component usage
function PersonaList() {
  const { personas, loading } = usePersonas()
  
  if (loading) return <LoadingSpinner />
  return <PersonaGrid personas={personas} />
}
```

### Form Handling Pattern
```typescript
// Form with API integration
const { mutate: createPersona } = useCreatePersona()

const handleSubmit = async (data) => {
  try {
    await createPersona(data)
    router.push('/dashboard/personas')
  } catch (error) {
    setError(error.message)
  }
}
```

## Development Workflow

### 1. Setup
```bash
cd ui
npm install
cp .env.example .env.local
# Configure API_BASE_URL and other environment variables
npm run dev
```

### 2. API Integration Steps
1. **Define TypeScript types** based on API schemas
2. **Create API client functions** for each endpoint
3. **Build custom hooks** for data fetching/mutations
4. **Create UI components** that use the hooks
5. **Add routing** and navigation
6. **Test integration** with backend API

### 3. Component Development Pattern
1. **Start with static UI** using mock data
2. **Add API integration** with loading/error states
3. **Implement user interactions** (forms, buttons)
4. **Add validation** and error handling
5. **Test with real API** data

## Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com
NEXT_PUBLIC_APP_NAME=Megaforce
NEXT_PUBLIC_VERSION=1.0.0
```

## Deployment

The UI can be deployed to various platforms:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Heroku**
- **AWS Amplify**

Build command: `npm run build`
Output directory: `.next`

## API Backend Integration

This UI connects to the Megaforce API backend with the following endpoints:

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Token refresh

### Twitter Integration
- `POST /api/v1/twitter/search` - Search Twitter content
- `POST /api/v1/twitter/post` - Post to Twitter
- `GET /api/v1/twitter/history` - Get posting history

### Comment Generation
- `POST /api/v1/style/generate-comments` - Generate AI comments
- `POST /api/v1/style/transfer` - Style transfer

### Content Management
- `GET /api/v1/documents/` - List documents
- `GET /api/v1/outputs/` - List generated outputs
- `POST /api/v1/outputs/{id}/approve` - Approve content
- `POST /api/v1/outputs/{id}/reject` - Reject content

### Persona Management
- `GET /api/v1/personas/` - List personas
- `POST /api/v1/personas/` - Create persona
- `PUT /api/v1/personas/{id}` - Update persona
- `DELETE /api/v1/personas/{id}` - Delete persona

## Contributing

1. **Follow the folder structure** outlined above
2. **Use TypeScript** for all new components
3. **Create reusable components** in the appropriate feature folders
4. **Add proper error handling** and loading states
5. **Test API integration** thoroughly
6. **Document new features** and API integrations

## Next Steps

1. **Implement API client foundation** (`lib/api/`)
2. **Add authentication system** (`lib/auth/`, `components/auth/`)
3. **Transform existing components** to use real API data
4. **Build comment generation interface** (`components/comments/`)
5. **Add persona management** (`components/personas/`)
6. **Implement publishing workflow** (`components/publishing/`)
7. **Add analytics dashboard** (`app/dashboard/analytics/`)

This structure provides a solid foundation for building a comprehensive social media management system that seamlessly integrates with the existing Megaforce API backend.
