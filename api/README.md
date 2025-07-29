# Megaforce Social Media API

🚀 **DEPLOYED & READY**: https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/

A comprehensive FastAPI-based backend for managing social media content generation, approval workflows, and publishing automation with Twitter/X integration via Arcade tools.

## 🎯 Current Status

✅ **Fully Deployed** on Heroku with working endpoints  
✅ **Authentication System** with JWT tokens  
✅ **Twitter/X Integration** via Arcade tools  
✅ **Database Models** with proper relationships  
✅ **CRUD Operations** for all entities  
✅ **Approval Workflow** for ML/RL training  
✅ **Manual Testing** completed and documented

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js UI    │───▶│   FastAPI API    │───▶│  Arcade Tools   │
│   (Frontend)    │    │   (Backend)      │    │  (Twitter/X)    │
│   Port 3000     │    │   Port 8000      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌──────────────────┐             │
         │              │   Supabase DB    │             │
         │              │   (PostgreSQL)   │             │
         │              └──────────────────┘             │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                Integration with Existing Agents                │
│  - parser_agents/x/    - style_agent/    - posting_agents/     │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
api/
├── main.py                 # FastAPI application entry point
├── database.py            # Supabase/PostgreSQL connection
├── models.py              # SQLAlchemy database models
├── schemas.py             # Pydantic request/response schemas
├── auth.py                # JWT authentication system
├── Dockerfile            # Container configuration
├── docker-compose.yml    # Multi-service orchestration
├── alembic.ini           # Database migration configuration
├── alembic/              # Database migrations
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
└── routers/              # API endpoint modules
    ├── auth.py           # Authentication endpoints
    ├── twitter.py        # Twitter/X integration
    ├── input_sources.py  # Input source management
    ├── runs.py           # Execution run tracking
    ├── documents.py      # Content document management
    └── outputs.py        # Output schema & approval workflow

# Dependencies managed in main project's pyproject.toml with uv
```

## 🔗 Integration with Existing Codebase

### **Parser Agents Integration**
- **Twitter/X Agent**: Direct integration with `megaforce.parser_agents.x.agent`
- **Input Schema Mapping**: Converts API requests to agent-compatible schemas
- **Document Processing**: Saves agent results to database with proper metadata

### **Style Agent Integration**
- **Persona System**: New `Persona` model stores author profiles and style preferences
- **Style References**: `StyleReference` model manages URLs, tweets, PDFs, markdown samples
- **Content Generation**: Ready for integration with `megaforce.style_agent`

### **UI Integration**
- **Dashboard Endpoints**: `/api/v1/documents/dashboard/posts` formats data for UI
- **Real-time Updates**: Database changes reflect immediately in UI
- **Approval Workflow**: UI buttons map to `/approve`, `/reject` endpoints

## 📊 Database Models

### **Core Entities**

#### **Users**
- Authentication and authorization
- Role-based access control (admin/user)
- Links to all user-owned resources

#### **Personas** (New)
- Represents content "authors" or writing personas
- Stores style preferences and configuration
- Links to style references and generated content

#### **StyleReferences** (New)
- Content samples for each persona (URLs, tweets, PDFs, markdown)
- Extracted text content and metadata
- Used for style analysis and generation

#### **InputSources** (Enhanced)
- Configurable content ingestion triggers
- Supports Twitter keywords, users, hashtags
- Scheduling configuration for automated runs

#### **Runs**
- Execution tracking for input sources
- Status monitoring (running, completed, failed)
- Performance metrics and metadata

#### **Documents**
- Content discovered by parser agents
- Ranking, scoring, and priority assignment
- Platform-specific metadata storage

#### **OutputSchemas** (New)
- Generated content with approval workflow
- Status tracking (draft, pending, approved, rejected, published)
- Scoring system (1-10) for quality assessment
- Publishing configuration and tracking

#### **ApprovalHistory** (New)
- Complete audit trail of approval actions
- Score tracking for ML/RL training data
- Reviewer feedback and notes

## 🚀 API Endpoints

### **Authentication**
```
POST /api/v1/auth/register     # Register new user
POST /api/v1/auth/login        # Login and get JWT token
GET  /api/v1/auth/me          # Get current user info
```

### **Twitter/X Integration**
```
POST /api/v1/twitter/search                    # Search Twitter/X content
POST /api/v1/twitter/input-sources            # Create Twitter input source
GET  /api/v1/twitter/input-sources            # List Twitter input sources
```

### **Input Sources**
```
POST /api/v1/input-sources                    # Create input source
GET  /api/v1/input-sources                    # List input sources
GET  /api/v1/input-sources/{id}               # Get specific input source
PUT  /api/v1/input-sources/{id}               # Update input source
DELETE /api/v1/input-sources/{id}             # Delete input source
```

### **Runs & Documents**
```
GET  /api/v1/runs                             # List execution runs
GET  /api/v1/runs/{id}                        # Get specific run
DELETE /api/v1/runs/{id}                      # Delete run

GET  /api/v1/documents                        # List documents
GET  /api/v1/documents/{id}                   # Get specific document
GET  /api/v1/documents/dashboard/posts        # UI-formatted posts
DELETE /api/v1/documents/{id}                 # Delete document
```

### **Output Schemas & Approval Workflow**
```
POST /api/v1/outputs                          # Create output schema
GET  /api/v1/outputs                          # List output schemas
GET  /api/v1/outputs/{id}                     # Get specific output
PUT  /api/v1/outputs/{id}                     # Update output
POST /api/v1/outputs/{id}/approve             # Approve content
POST /api/v1/outputs/{id}/reject              # Reject content
GET  /api/v1/outputs/{id}/history             # Get approval history
DELETE /api/v1/outputs/{id}                   # Delete output
```

### **Health & Monitoring**
```
GET  /                                        # API info
GET  /health                                  # Health check for monitoring
```

## 🔧 Configuration

### **Environment Variables**
Copy `.env.template` to `.env` and configure:

```bash
# Arcade Integration (Required for Twitter/X)
USER_ID=your_arcade_user_id_here
ARCADE_API_KEY=your_arcade_api_key_here
ARCADE_PROVIDER_ID=your_arcade_provider_id_here

# LLM Providers (Required for content generation)
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-2024-08-06

# Supabase Database
SUPABASE_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# API Security
SECRET_KEY=your_jwt_secret_key_here_change_in_production
```

## 🚀 Deployment

### ✅ Current Status: DEPLOYED AND WORKING

The API is successfully running locally with Docker at `http://localhost:8000`

### Quick Start

### Prerequisites
- Python 3.11+
- Docker and Docker Compose
- Supabase account and project
- Required API keys (see Environment Variables)

### Local Development

```bash
# 1. Clone the repository
git clone <repository-url>
cd megaforce/api

# 2. Configure environment variables
# Create .env file in api/ directory with your Supabase credentials:
# - Use transaction pooler URL: postgresql://postgres.PROJECT:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
# - Add all required API keys (Arcade, OpenAI, etc.)

# 3. Start with Docker (WORKING)
docker-compose up -d

# 4. Run database migrations (NEXT STEP)
docker-compose exec api uv run alembic upgrade head

# 5. API is available at http://localhost:8000
curl http://localhost:8000/  # Returns: {"message":"Megaforce Social Media API","version":"1.0.0"}
```

### **Production Deployment (Heroku)**
```bash
# Set environment variables in Heroku
heroku config:set USER_ID=your_arcade_user_id
heroku config:set SUPABASE_DATABASE_URL=your_supabase_url
# ... (set all required env vars)

# Deploy
git push heroku main
```

## 🔄 Workflow Integration

### **Content Discovery → Generation → Approval → Publishing**

1. **Input Sources** trigger content discovery via parser agents
2. **Documents** are ranked and prioritized automatically  
3. **Style Agent** generates content using **Personas** and **Style References**
4. **Output Schemas** enter approval workflow (draft → pending → approved/rejected)
5. **Publishing** happens via posting agents to target platforms

### **UI Dashboard Integration**

The API provides endpoints specifically designed for the Next.js UI:
- **Dashboard Posts**: Formatted for the main dashboard display
- **Real-time Updates**: Database changes reflect immediately
- **Approval Actions**: UI buttons map directly to API endpoints

## 📈 Monitoring & Alerts

### **Health Checks**
- `/health` endpoint for uptime monitoring
- Database connectivity verification
- Structured JSON logging

### **Metrics Tracking**
- Run execution times and success rates
- Document processing volumes
- Approval workflow metrics
- API response times and error rates

## 🔮 Future Enhancements

### **Scheduled Ingestion**
- Background task queue with Celery/Redis
- Configurable scheduling per input source
- Automatic content generation pipelines

### **Multi-Platform Support**
- Reddit integration via existing parser agents
- Additional social media platforms
- Cross-platform content adaptation

### **ML/RL Integration**
- Approval history for training data
- Automated quality scoring
- Content optimization based on performance

## 🛠️ Development Notes

### **Key Design Decisions**
- **Supabase**: Chosen for managed PostgreSQL with real-time features
- **Arcade Tools**: Preferred over direct Twitter API for reliability
- **JWT Authentication**: Reused from existing `api_old` implementation
- **Approval Workflow**: Built-in scoring system for future ML training

### **Integration Points**
- Parser agents called directly from API endpoints
- Style agent integration ready via Persona system
- UI expects specific response formats (implemented)
- Existing authentication system preserved and enhanced

This API serves as the central hub connecting your existing agents, UI, and database while providing the approval workflow and monitoring capabilities needed for production deployment.

## 🧪 API Testing Guide

### **Interactive Documentation**
Access the live API docs: https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/docs

### **Authentication Flow**
1. **Register a user:**
```bash
POST /api/v1/auth/register
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "testpassword123"
}
```

2. **Login to get token:**
```bash
POST /api/v1/auth/login
{
  "username": "testuser",
  "password": "testpassword123"
}
# Returns: {"access_token": "your-jwt-token", "token_type": "bearer"}
```

3. **Use token in headers:**
```bash
Authorization: Bearer your-jwt-token
```

### **Core Endpoints (All Working ✅)**

#### **Input Sources**
```bash
# List input sources
GET /api/v1/input-sources/

# Create input source
POST /api/v1/input-sources/
{
  "name": "AI News Keywords",
  "source_type": "twitter_keywords",
  "config": {
    "keywords": ["artificial intelligence", "AI news"],
    "limit": 10
  },
  "schedule_config": {
    "frequency": "manual",
    "enabled": false
  }
}
```

#### **Personas**
```bash
# Create persona
POST /api/v1/personas/
{
  "name": "Tech Influencer",
  "description": "Expert in AI and technology trends",
  "style_preferences": {
    "tone": "professional",
    "length": "medium"
  }
}
```

#### **Twitter Integration**
```bash
# Basic tweet search (no LLM ranking)
POST /api/v1/twitter/search
{
  "search_type": "keywords",
  "search_query": "artificial intelligence",
  "limit": 10,
  "rank_tweets": false,
  "arcade_user_id": "your-arcade-user-id",
  "arcade_api_key": "your-arcade-api-key"
}

# Tweet search with LLM ranking (requires LLM credentials)
POST /api/v1/twitter/search
{
  "search_type": "keywords",
  "search_query": "artificial intelligence",
  "limit": 20,
  "target_number": 5,
  "rank_tweets": true,
  "llm_provider": "openai",
  "llm_model": "gpt-4o-2024-08-06",
  "openai_api_key": "your-openai-api-key",
  "arcade_user_id": "your-arcade-user-id",
  "arcade_api_key": "your-arcade-api-key"
}

# Tweet search with Anthropic ranking
POST /api/v1/twitter/search
{
  "search_type": "keywords",
  "search_query": "machine learning",
  "limit": 15,
  "target_number": 3,
  "rank_tweets": true,
  "llm_provider": "anthropic",
  "anthropic_api_key": "your-anthropic-api-key",
  "arcade_user_id": "your-arcade-user-id",
  "arcade_api_key": "your-arcade-api-key"
}
```

#### **Documents & Outputs**
```bash
# List documents
GET /api/v1/documents/

# List outputs
GET /api/v1/outputs/

# Create output
POST /api/v1/outputs/
{
  "content_type": "twitter_thread",
  "generated_content": "Test content",
  "persona_id": "your-persona-id"
}
```

### **Health Check**
```bash
GET /health
# Returns: {"status": "healthy", "timestamp": "...", "database": "connected"}
```

### **Recent Fixes Applied ✅**
- Fixed field name mismatches (`user_id` → `owner_id`)
- Added UUID generation for all create endpoints
- Fixed database relationship queries
- Added comprehensive error handling and debugging
- Enhanced Twitter search with optional LLM ranking
- Added support for multiple LLM providers (OpenAI, Anthropic, Google)
- Set `rank_tweets` default to `false` (no LLM required by default)
- Deployed all fixes to production

### **Testing Status**
- ✅ Authentication endpoints working
- ✅ All CRUD operations functional
- ✅ Twitter integration operational
- ✅ Database relationships correct
- ✅ Error handling implemented
- ✅ Production deployment stable
