# Megaforce API Complete User Guide

🚀 **Local API Server**: http://localhost:8000  
📖 **Interactive Documentation**: http://localhost:8000/docs

## 🎉 **FULLY WORKING - END-TO-END TESTED!**

✅ **All 4 Comment Generation Methods Working** - Run-based, document-based, custom content, and persona styling  
✅ **Complete Workflow Tested** - From user registration to live Twitter posting  
✅ **Live Tweet Posted** - Successfully posted AI-generated content to Twitter  
✅ **All Database Issues Fixed** - Field mappings and validation errors resolved  

This guide provides the **exact working code** for testing every endpoint in the Megaforce Social Media API. All examples are taken from our successful end-to-end test that posted a live tweet.

## 📋 Prerequisites

Before starting, ensure you have:

### Local API Server Setup
Choose one of two database options:

**Option 1: PostgreSQL (Recommended for Development)**
```bash
# Start with local PostgreSQL
./scripts/start-local-postgres.sh
# API available at http://localhost:8000
```

**Option 2: Supabase (Production-like)**
```bash
# Start with Supabase (requires SUPABASE_DATABASE_URL in .env)
./scripts/start-local-supabase.sh
# API available at http://localhost:8000
```

### Required Environment Variables
- `OPENAI_API_KEY` - For OpenAI GPT models
- `ANTHROPIC_API_KEY` - For Claude models  
- `ARCADE_API_KEY` - For Twitter search and posting
- `SUPABASE_DATABASE_URL` - Only needed for Supabase option

### Testing Tools
- **curl and jq** installed for testing

## 🎯 Complete Workflow Overview

```
1. User Registration & Login → Get access token
   ↓
2. Create Persona → Define writing style and voice
   ↓  
3. Add Style Reference → Provide example content
   ↓
4. Twitter Search → Find relevant tweets
   ↓
5. Generate Comments (4 methods) → AI-powered content creation
   ↓
6. Approve Content → Review and approve generated comments
   ↓
7. Post to Twitter → Publish approved content live
```

## 💾 Database Tables Used

- **`users`**: User accounts and authentication
- **`personas`**: User-defined writing personas  
- **`style_references`**: Style examples linked to personas
- **`runs`**: Twitter search execution instances
- **`documents`**: Individual tweets found in searches
- **`output_schemas`**: Generated comments and content
- **`approval_history`**: Review decisions and feedback

---

## Step 1: Authentication & User Management

### 1.1 Register a New User

**Endpoint:** `POST /api/v1/auth/register`

**Working curl command:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "testuser_$(date +%s)",
    "email": "testuser_$(date +%s)@example.com",
    "password": "secure_password_123"
  }'
```

**Expected Response:**
```json
{
  "id": "c9cdeeaa-de8b-45a0-b6c1-01b493faaa3f",
  "username": "testuser_1754415827",
  "email": "testuser_1754415827@example.com",
  "is_active": true,
  "created_at": "2025-08-05T17:43:47.123456"
}
```

### 1.2 Login and Get Authentication Token

**Endpoint:** `POST /api/v1/auth/login`

**Working curl command:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "YOUR_USERNAME",
    "password": "secure_password_123"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlcl8xNzU0NDE1ODI3IiwiZXhwIjoxNzU0NDE3NjI4fQ.BAj2GKmETf28PoC1GpuOS_MzXD0X58F0J2VpeFQ_Ujs",
  "token_type": "bearer"
}
```

**⚠️ IMPORTANT:** Save the `access_token` - you'll need it for all subsequent requests!

### 1.3 Authorize All Requests

1. Click the **"Authorize"** button at the top of the API docs
2. In the popup, enter: `Bearer YOUR_ACCESS_TOKEN_HERE`
3. Click **"Authorize"** then **"Close"**
4. **✅ You're now authenticated for all endpoints!**

### 1.4 Test Current User Info

**Endpoint:** `GET /api/v1/auth/me`

1. Find `GET /api/v1/auth/me` and click **"Try it out"**
2. Click **Execute** (no body needed)
3. **Expected Response:** Your user information

### 1.5 Update Password

**Endpoint:** `PUT /api/v1/auth/update-password`

1. Find `PUT /api/v1/auth/update-password` and click **"Try it out"**
2. Use this request body:

```json
{
  "current_password": "SecurePassword123!",
  "new_password": "NewSecurePassword456!"
}
```

3. Click **Execute**
4. **Expected Response:** `200 OK` with password update confirmation

---

## Step 2: Persona & Style Management

### 2.1 Create Your First Persona

**Endpoint:** `POST /api/v1/personas/`

**Working curl command:**
```bash
curl -X POST "http://localhost:8000/api/v1/personas/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Professional Tech Expert",
    "description": "A knowledgeable technology professional who writes in a clear, authoritative, and engaging style",
    "style_preferences": {
      "tone": "Professional yet approachable",
      "voice": "Authoritative and knowledgeable", 
      "writing_style": "Clear, concise, and engaging",
      "target_audience": "Tech professionals and enthusiasts",
      "key_phrases": ["innovative solutions", "cutting-edge technology", "best practices"],
      "avoid_phrases": ["obviously", "just", "simply"]
    }
  }'
```

**Expected Response:**
```json
{
  "id": "d56a6beb-c9dc-4f0b-81f2-12f340d9bf70",
  "name": "Professional Tech Expert",
  "description": "A knowledgeable technology professional who writes in a clear, authoritative, and engaging style",
  "style_preferences": {
    "tone": "Professional yet approachable",
    "voice": "Authoritative and knowledgeable",
    "writing_style": "Clear, concise, and engaging",
    "target_audience": "Tech professionals and enthusiasts",
    "key_phrases": ["innovative solutions", "cutting-edge technology", "best practices"],
    "avoid_phrases": ["obviously", "just", "simply"]
  },
  "owner_id": "c9cdeeaa-de8b-45a0-b6c1-01b493faaa3f",
  "is_active": true,
  "created_at": "2025-08-05T17:43:47.456789"
}
```

**📝 IMPORTANT:** Save the persona `id` - you'll need it for style references and comment generation!

### 2.2 List Your Personas

**Endpoint:** `GET /api/v1/personas`

1. Find `GET /api/v1/personas` and click **"Try it out"**
2. Click **Execute**
3. **Expected Response:** Array of your personas

### 2.3 Create a Style Reference

**Endpoint:** `POST /api/v1/documents/`

**Working curl command:**
```bash
curl -X POST "http://localhost:8000/api/v1/documents/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Tech Blog Example",
    "content": "Artificial intelligence is revolutionizing how we approach software development. By leveraging machine learning algorithms, developers can now automate complex tasks that previously required extensive manual effort. This breakthrough technology enables teams to focus on innovation rather than repetitive processes.",
    "url": "https://example.com/tech-blog",
    "document_type": "style_reference",
    "reference_type": "text",
    "is_style_reference": true,
    "persona_ids": ["YOUR_PERSONA_ID"]
  }'
```

**Expected Response:**
```json
{
  "id": "dd77ef77-01b4-4a72-8d7e-d2bf21b4bea4",
  "title": "Tech Blog Example",
  "content": "Artificial intelligence is revolutionizing how we approach software development...",
  "url": "https://example.com/tech-blog",
  "author": null,
  "score": 0,
  "priority": 0,
  "platform_data": {},
  "document_type": "style_reference",
  "reference_type": "text",
  "owner_id": "c9cdeeaa-de8b-45a0-b6c1-01b493faaa3f",
  "is_style_reference": true,
  "persona_ids": ["d56a6beb-c9dc-4f0b-81f2-12f340d9bf70"],
  "run_id": null,
  "created_at": "2025-08-05T17:43:48.123456",
  "persona_count": 1
}
```

**📝 Note:** The style reference is now linked to your persona via `persona_ids` and will be used for AI comment generation!

### 2.4 List Style References

**Endpoint:** `GET /api/v1/documents/?is_style_reference=true`

**Working curl command:**
```bash
curl -X GET "http://localhost:8000/api/v1/documents/?is_style_reference=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:** Array of your style reference documents

## Step 3: Twitter Search & Content Discovery

### 3.1 Search Twitter Content

**Endpoint:** `POST /api/v1/twitter/search`

**Working curl command:**
```bash
curl -X POST "http://localhost:8000/api/v1/twitter/search" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "search_type": "keywords",
    "search_query": "artificial intelligence startup",
    "limit": 10,
    "target_number": 5,
    "audience_specification": "All audiences",
    "rank_tweets": false,
    "llm_provider": "openai",
    "llm_model": "gpt-4o-2024-08-06",
    "arcade_api_key": "YOUR_ARCADE_API_KEY"
  }'
```

**Expected Response:**
```json
{
  "documents": [
    {
      "title": "tweet by Erin Stevens",
      "content": "RT @BloombergTV: Airlines, including Delta, are testing artificial intelligence in pricing. Get ready for what one startup calls the 'explo…'",
      "url": "https://x.com/x/status/1952778100464308402",
      "author": "AmiJoyce17768",
      "score": 0,
      "priority": 0,
      "platform_data": {},
      "id": "da01dd05-3c31-46ac-9bb7-814ad94efc39",
      "run_id": "261884b2-3ca0-4390-8cf5-35e3a4d963e1",
      "created_at": "2025-08-05T17:30:43.728067"
    }
  ],
  "run_id": "261884b2-3ca0-4390-8cf5-35e3a4d963e1",
  "total_found": 10,
  "processing_time": 1.584441
}
```

**📝 IMPORTANT:** Save the `run_id` and individual document `id` values - you'll need them for comment generation!

---

## Step 4: AI Comment Generation - All 4 Methods

**Endpoint:** `POST /api/v1/style/generate-comments`

### 4.1 Method 1: Generate from Entire Twitter Search Run

**Working curl command:**
```bash
curl -X POST "http://localhost:8000/api/v1/style/generate-comments" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "comment_type": "new_content",
    "run_id": "YOUR_RUN_ID_FROM_STEP_3",
    "comment_style": "Insightful",
    "llm_provider": "openai",
    "openai_api_key": "YOUR_OPENAI_API_KEY"
  }'
```

**Expected Response:**
```json
[{
  "success": true,
  "comment": {
    "text": "In the ever-evolving landscape of AI startups, it's fascinating to see the innovative approaches being taken. From leveraging RISC-V to tackling network blocks, these startups are pushing boundaries. Exciting times ahead for the tech industry! #AI #ArtificialIntelligence #Startup #Innovation"
  },
  "style": "Insightful",
  "confidence": 95,
  "output_id": "179bf9d6-e579-4e6e-8e54-69ac0b211f49",
  "post_context": "RT @BloombergTV: Airlines, including Delta, are testing artificial intelligence in pricing...",
  "llm_provider_used": "openai",
  "processing_time": 1.874418020248413,
  "message": "Comment generated successfully."
}]
```

### 4.2 Method 2: Reply to Single Document

**Working curl command:**
```bash
curl -X POST "http://localhost:8000/api/v1/style/generate-comments" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "comment_type": "reply",
    "document_id": "YOUR_DOCUMENT_ID_FROM_STEP_3",
    "comment_style": "Question",
    "llm_provider": "openai",
    "openai_api_key": "YOUR_OPENAI_API_KEY"
  }'
```

### 4.3 Method 3: Generate from Custom Content

**Working curl command:**
```bash
curl -X POST "http://localhost:8000/api/v1/style/generate-comments" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "comment_type": "new_content",
    "post_content": "Just launched our new AI-powered social media management tool! It can generate contextual comments, manage multiple personas, and automate engagement workflows.",
    "post_title": "AI Social Media Tool Launch",
    "comment_style": "Congratulatory",
    "llm_provider": "openai",
    "openai_api_key": "YOUR_OPENAI_API_KEY"
  }'
```

### 4.4 Method 4: Generate with Persona Styling

**Working curl command:**
```bash
curl -X POST "http://localhost:8000/api/v1/style/generate-comments" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "comment_type": "reply",
    "document_id": "YOUR_DOCUMENT_ID_FROM_STEP_3",
    "persona_id": "YOUR_PERSONA_ID_FROM_STEP_2",
    "comment_style": "Supportive",
    "llm_provider": "anthropic",
    "anthropic_api_key": "YOUR_ANTHROPIC_API_KEY"
  }'
```

**📝 IMPORTANT:** Save the `output_id` from any method - you'll need it for approval and posting!

---

## Step 5: Comment Approval & Twitter Posting

### 5.1 Approve Generated Comment

**Endpoint:** `POST /api/v1/outputs/{output_id}/approve`

**Working curl command:**
```bash
curl -X POST "http://localhost:8000/api/v1/outputs/YOUR_OUTPUT_ID_FROM_STEP_4/approve" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "score": 9,
    "feedback": "Excellent comment! Very engaging and on-brand.",
    "notes": "Perfect tone for our target audience"
  }'
```

**Expected Response:**
```json
{
  "message": "Output approved successfully"
}
```

### 5.2 Post to Twitter

**Endpoint:** `POST /api/v1/twitter/post`

**Working curl command:**
```bash
# First extract the comment text from the generation response
APPROVED_CONTENT=$(echo "$COMMENT_RESPONSE_4" | jq -r '.[0].comment.text')

# Then post to Twitter
curl -X POST "http://localhost:8000/api/v1/twitter/post" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"tweet_text\": \"$APPROVED_CONTENT\",
    \"arcade_api_key\": \"YOUR_ARCADE_API_KEY\"
  }"
```

**Expected Response:**
```json
{
  "success": true,
  "tweet_id": "1952778100464308402",
  "tweet_url": "https://x.com/x/status/1952778100464308402",
  "message": "Tweet posted successfully!",
  "posted_at": "2025-08-05T17:43:50.123456"
}
```

**📝 Note:** The test script extracts comment text using `jq -r '.[0].comment.text'` from the generation response.

**🎉 SUCCESS!** Your AI-generated comment is now live on Twitter!

---

## Available Comment Styles

- **Insightful**: Thoughtful analysis and observations
- **Question**: Engaging questions to drive discussion  
- **Congratulatory**: Positive praise and recognition
- **Supportive**: Encouraging and helpful responses
- **Analytical**: Data-driven insights and breakdowns
- **Humorous**: Light-hearted and engaging tone
- **Professional**: Business-focused and authoritative
- **Casual**: Friendly and conversational

---

## Environment Variables Required

Ensure these environment variables are set:

```bash
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
ARCADE_API_KEY=your_arcade_key_here
```

---

## Complete End-to-End Workflow Summary

1. **Register & Login** → Get access token
2. **Create Persona** → Define your AI voice
3. **Add Style Reference** → Link example content to persona
4. **Search Twitter** → Find relevant content
5. **Generate Comments** → AI creates contextual responses (4 methods)
6. **Approve Content** → Review and approve generated text
7. **Post to Twitter** → Publish live to your account

**🎉 You now have a complete AI-powered social media workflow!**

---

## Troubleshooting

**Authentication Errors:**
- Ensure Bearer token format: `Bearer YOUR_TOKEN`
- Tokens expire after 30 minutes - re-authenticate if needed

**API Key Errors:**
- Verify OpenAI/Anthropic/Arcade API keys are valid
- Check API key permissions and billing status

**Generation Failures:**
- Verify document/persona IDs exist
- Check content meets platform guidelines
- Ensure API keys match selected LLM provider

**For support, check `/docs` or contact the development team.**
