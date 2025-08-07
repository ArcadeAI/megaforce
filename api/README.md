# Megaforce Social Media API

🚀 **DEPLOYED & READY**: https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/

A comprehensive FastAPI-based backend for AI-powered social media content generation, approval workflows, and automated publishing. Features complete end-to-end workflow from AI comment generation to Twitter posting with quality control and ML training capabilities.

## 🎯 Current Status

✅ **Production Ready** - Deployed on Heroku v33 with full functionality  
✅ **AI Comment Generation** - Multi-style comments with confidence scoring  
✅ **Complete Approval Workflow** - Generate → Save → Approve/Reject → Post  
✅ **Twitter/X Posting** - Live posting with tweet ID tracking  
✅ **Persona-Based Style Transfer** - Consistent brand voice across content  
✅ **Quality Control System** - Score-based feedback for ML/RL training  
✅ **Authentication & Security** - JWT-based user management  
✅ **Database Integration** - PostgreSQL with complete audit trails  
✅ **End-to-End Testing** - Verified from generation to publication

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
POST /api/v1/twitter/post                      # Post tweet to Twitter/X
DELETE /api/v1/twitter/delete                  # Delete tweet from Twitter/X
POST /api/v1/twitter/input-sources            # Create Twitter input source
GET  /api/v1/twitter/input-sources            # List Twitter input sources
```

### **AI Comment Generation & Style Transfer**
```
POST /api/v1/style/generate-comments           # Generate AI comments with approval workflow
POST /api/v1/style/transfer                    # Transform content style (persona-based)
GET  /api/v1/personas                          # List user personas
POST /api/v1/personas                          # Create new persona
GET  /api/v1/style-references                  # List style reference documents
POST /api/v1/style-references                  # Add style reference
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

## 🎯 Complete End-to-End Workflow

### **AI-Powered Content Generation → Approval → Publishing**

The Megaforce API provides a complete workflow for AI-powered social media content management:

```
1. Generate AI Comments
   ↓
2. Automatic Database Save
   ↓
3. Review & Approval Process
   ↓
4. Direct Twitter/X Posting
   ↓
5. Performance Tracking & ML Training
```

### **🧪 Production Testing Results**

**✅ AI Comment Generation**
- **Endpoint:** `POST /api/v1/style/generate-comments`
- **LLM Integration:** Anthropic Claude, OpenAI GPT, Google Gemini
- **Comment Styles:** Congratulatory, Question, Insightful, Supportive
- **Processing Time:** ~3.5 seconds for 3 comments
- **Confidence Scoring:** 75-95% automatic scoring
- **Database Persistence:** Comments saved with `output_id` tracking

**✅ Approval Workflow**
- **Review:** Comments saved as `OutputSchema` with `draft` status
- **Approve:** `POST /outputs/{id}/approve` with 1-10 scoring
- **Reject:** `POST /outputs/{id}/reject` with feedback notes
- **Audit Trail:** Complete approval history for ML/RL training
- **Quality Control:** Score-based feedback collection

**✅ Twitter/X Posting**
- **Endpoint:** `POST /api/v1/twitter/post`
- **Live Testing:** Successfully posted tweet ID `1950211317903540361`
- **Tweet URL:** https://x.com/x/status/1950211317903540361
- **Response Time:** ~1-2 seconds for posting
- **Error Handling:** Comprehensive validation and error messages

### **🎨 Persona-Based Style Transfer**

- **Persona Management:** Create and manage writing personas with style preferences
- **Style References:** Upload example content (URLs, tweets, PDFs, markdown)
- **Consistent Voice:** AI generates content matching specific persona styles
- **Context Integration:** Combines persona data with custom style descriptions
- **Quality Assurance:** Style references provide rich context for better LLM outputs

### **📊 ML/RL Training Integration**

- **Confidence Scoring:** Each generated comment includes confidence metrics
- **Approval Feedback:** 1-10 scoring system with detailed feedback notes
- **Pattern Recognition:** Track which comment styles perform best
- **Continuous Improvement:** Approval history enables model fine-tuning
- **Quality Metrics:** Complete audit trail for performance analysis

## 🔧 Configuration

### **Environment Variables**
Copy `.env.template` to `.env` and configure:

```bash
# Arcade Integration (Required for Twitter/X)
USER_ID=your_arcade_user_id_here
ARCADE_API_KEY=your_arcade_api_key_here

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

## 📝 Example API Usage

### **Complete Workflow Example**

**1. Login and Get Token**
```bash
curl -X POST "https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'

# Response: {"access_token": "eyJhbGciOiJIUzI1NiIs...", "token_type": "bearer"}
```

**2. Generate AI Comments**
```bash
curl -X POST "https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/api/v1/style/generate-comments" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "post_content": "Just launched our new AI-powered social media tool!",
    "post_title": "Product Launch",
    "num_suggestions": 3,
    "comment_styles": ["Congratulatory", "Question", "Insightful"],
    "llm_provider": "anthropic",
    "anthropic_api_key": "your_anthropic_key"
  }'

# Response: Comments with output_ids for approval workflow
```

**3. Approve Generated Comment**
```bash
curl -X POST "https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/api/v1/outputs/{output_id}/approve" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 9,
    "feedback_notes": "Excellent comment! Professional tone and engaging content."
  }'
```

**4. Post Approved Comment to Twitter**
```bash
curl -X POST "https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/api/v1/twitter/post" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tweet_text": "Your approved comment text here"
  }'

# Response: {"success": true, "tweet_id": "1950211317903540361", "tweet_url": "https://x.com/x/status/1950211317903540361"}
```

**5. Search Twitter Content**
```bash
curl -X POST "https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/api/v1/twitter/search" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "search_type": "keywords",
    "search_query": "AI social media",
    "limit": 10,
    "rank_tweets": false
  }'
```

**6. Persona-Based Style Transfer**
```bash
curl -X POST "https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/api/v1/style/transfer" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Original content to transform",
    "persona_id": "your_persona_id",
    "llm_provider": "openai",
    "openai_api_key": "your_openai_key"
  }'
```

## 🚀 Deployment

### ✅ Current Status: PRODUCTION READY

**🌐 Live Production API:** https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/  
**📊 Version:** v33 (Latest)  
**🔄 Status:** Fully operational with complete end-to-end workflow  
**📝 Testing:** All endpoints verified and working  
**🔐 Security:** JWT authentication enabled  
**💾 Database:** PostgreSQL with complete data persistence  

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
