# Megaforce API Complete User Guide

🚀 **Interactive API Documentation**: https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/docs

## 🎉 **PRODUCTION READY - v50 DEPLOYED!**

✅ **All Database Issues RESOLVED** - Enum mismatches and foreign key constraints fixed  
✅ **Complete Workflow Tested** - Comment generation, approval, and Twitter posting working  
✅ **Production Validated** - Full end-to-end testing completed successfully  

This guide walks you through testing **every endpoint** in the Megaforce Social Media API using the interactive Swagger documentation. Follow these steps in order to experience the complete workflow from authentication to AI-powered social media posting.

## 📋 Prerequisites

Before starting, ensure you have:
- Access to the API documentation URL above
- Valid API credentials (see Environment Setup section)
- A Twitter/X account for posting tests (optional)

## 🎯 Complete Workflow Overview

```
1. Authentication & User Management → users table
   ↓
2. Persona & Style Management → personas, style_references tables
   ↓
3. Twitter Search → input_sources, runs, documents tables
   ↓
4. Comment Generation → output_schemas table
   ↓
5. Style Transfer → output_schemas table
   ↓
6. Approval Workflow → approval_history table
   ↓
7. Social Media Posting → Twitter/X platform
```

## 💾 Data Storage Overview

Each step in the workflow saves data to specific database tables:

- **`users`**: User accounts and authentication
- **`personas`**: User-defined writing personas
- **`style_references`**: Style examples linked to personas
- **`input_sources`**: Content source configurations (Twitter, etc.)
- **`runs`**: Execution instances of content searches
- **`documents`**: Individual pieces of content found (tweets, posts)
- **`output_schemas`**: Generated content (comments, style transfers)
- **`approval_history`**: Review decisions and feedback

---

## Step 1: Authentication & User Management

### 1.1 Register a New User

**Endpoint:** `POST /api/v1/auth/register`

1. Click on the **auth** section in the API docs
2. Find `POST /api/v1/auth/register` and click **"Try it out"**
3. Use this request body:

```json
{
  "username": "demo_user_2024",
  "email": "demo@megaforce.com", 
  "password": "SecurePassword123!"
}
```

4. Click **Execute**
5. **Expected Response:** `200 OK` with user creation confirmation

### 1.2 Login and Get Authentication Token

**Endpoint:** `POST /api/v1/auth/login`

1. Find `POST /api/v1/auth/login` and click **"Try it out"**
2. Use this request body:

```json
{
  "username": "demo_user_2024",
  "password": "SecurePassword123!"
}
```

3. Click **Execute**
4. **Expected Response:** `200 OK` with JWT token
5. **⚠️ IMPORTANT:** Copy the `access_token` from the response - you'll need it for all subsequent requests!

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

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

**Endpoint:** `POST /api/v1/personas`

1. Find `POST /api/v1/personas` and click **"Try it out"**
2. Use this request body:

```json
{
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
}
```

3. Click **Execute**
4. **Expected Response:** `201 Created` with persona details
5. **📝 Note:** Copy the `id` from the response - you'll use it later!

### 2.2 List Your Personas

**Endpoint:** `GET /api/v1/personas`

1. Find `GET /api/v1/personas` and click **"Try it out"**
2. Click **Execute**
3. **Expected Response:** Array of your personas

### 2.3 Create a Style Reference

**Endpoint:** `POST /api/v1/style-references`

1. Find `POST /api/v1/style-references` and click **"Try it out"**
2. Use this request body (replace `PERSONA_ID` with your persona's ID):

```json
{
  "persona_id": "PERSONA_ID_FROM_STEP_2.1",
  "title": "Tech Blog Example",
  "content": "Artificial intelligence is revolutionizing how we approach software development. By leveraging machine learning algorithms, developers can now automate complex tasks that previously required extensive manual effort. This breakthrough technology enables teams to focus on innovation rather than repetitive processes.",
  "content_type": "text",
  "source_url": "https://example.com/tech-blog",
  "notes": "Example of professional tech writing style"
}
```

3. Click **Execute**
4. **Expected Response:** `201 Created` with style reference details

### 2.4 List Style References

**Endpoint:** `GET /api/v1/style-references`

1. Find `GET /api/v1/style-references` and click **"Try it out"**
2. Click **Execute**
3. **Expected Response:** Array of your style references

## Step 5: Social Media Integration

### 5.1 Search Twitter Content

**Endpoint:** `POST /api/v1/twitter/search`

1. Find `POST /api/v1/twitter/search` and click **"Try it out"**
2. Use this request body:

```json
{
  "search_type": "keywords",
  "search_query": "artificial intelligence social media",
  "limit": 10,
  "rank_tweets": false
}
```

3. Click **Execute**
4. **Expected Response:** `200 OK` with array of relevant tweets

### 5.2 Search with LLM Ranking

**Endpoint:** `POST /api/v1/twitter/search` (with ranking)

1. Use the same endpoint but with ranking enabled:

```json
{
  "search_type": "keywords", 
  "search_query": "AI automation tools",
  "limit": 20,
  "target_number": 5,
  "rank_tweets": true,
  "llm_provider": "anthropic",
  "anthropic_api_key": "YOUR_ANTHROPIC_API_KEY_HERE"
}
```

2. Click **Execute**
3. **Expected Response:** Top 5 tweets ranked by relevance and engagement potential

---

## Step 3: Twitter Search & Content Discovery

### 3.1 Search Twitter Content

**Endpoint:** `POST /api/v1/twitter/search`

1. Find `POST /api/v1/twitter/search` and click **"Try it out"**
2. Use this request body:

```json
{
  "search_type": "keywords",
  "search_query": "artificial intelligence startup",
  "limit": 10,
  "rank_tweets": false
}
```

3. Click **Execute**
4. **Expected Response:** `201 Created` with search results

**💾 Data Saved:**
- **`input_sources`**: Search configuration
- **`runs`**: Search execution record
- **`documents`**: Individual tweets found

**📝 Note the `run_id` from the response - you'll use this for comment generation.**

---

## Step 4: AI Comment Generation

The Megaforce API provides flexible comment generation with multiple content sources and styling options.

**Endpoint:** `POST /api/v1/style/generate-comment`

### 4.1 Comment Types

**REPLY**: Generate a reply to a specific post
- Uses: `document_id` OR custom content (`post_content` + `post_title`)
- Best for: Responding to individual tweets/posts

**NEW_CONTENT**: Generate new content inspired by multiple sources  
- Uses: `run_id` OR `document_ids` OR custom content
- Best for: Creating original posts based on research

### 4.2 Content Source Options

#### Method 1: From Entire Twitter Search Run
```json
{
  "comment_type": "new_content",
  "run_id": "YOUR_RUN_ID_FROM_TWITTER_SEARCH",
  "comment_style": "Insightful",
  "llm_provider": "openai",
  "openai_api_key": "YOUR_OPENAI_KEY"
}
```
*Generates content from ALL documents in the search run*

#### Method 2: Reply to Single Document
```json
{
  "comment_type": "reply",
  "document_id": "YOUR_DOCUMENT_ID_FROM_SEARCH",
  "comment_style": "Question",
  "llm_provider": "openai",
  "openai_api_key": "YOUR_OPENAI_KEY"
}
```
*Generates a reply to a specific tweet or document*

#### Method 3: Generate from Custom Content
```json
{
  "comment_type": "new_content",
  "post_content": "Just launched our new AI-powered social media management tool! It can generate contextual comments, manage multiple personas, and automate engagement workflows.",
  "post_title": "AI Social Media Tool Launch",
  "comment_style": "Congratulatory",
  "llm_provider": "openai",
  "openai_api_key": "YOUR_OPENAI_KEY"
}
```
*Generates content from your custom text input*

#### Method 4: Generate with Persona Styling
```json
{
  "comment_type": "reply",
  "document_id": "YOUR_DOCUMENT_ID_FROM_SEARCH",
  "persona_ids": ["YOUR_PERSONA_ID_FROM_STEP_2.1"],
  "comment_style": "Supportive",
  "llm_provider": "openai",
  "openai_api_key": "YOUR_OPENAI_KEY"
}
```
*Applies your persona's style to the generated comment*

#### Option 5: From Custom Content
```json
{
  "comment_type": "reply",
  "post_content": "Just launched our new AI-powered social media management tool! It can generate contextual comments and manage multiple personas.",
  "post_title": "AI Social Media Tool Launch",
  "comment_style": "Question",
  "llm_provider": "google",
  "google_api_key": "YOUR_GOOGLE_KEY"
}
```
*Uses your own content as the source*

### 4.3 Persona-Based Styling

Add persona styling to any comment generation:

```json
{
  "comment_type": "reply",
  "document_id": "76dbcf09-5414-444c-a5e4-7222d4199eeb",
  "persona_ids": ["persona-uuid-1", "persona-uuid-2"],
  "comment_style": "Supportive",
  "llm_provider": "anthropic"
}
```

**Persona Integration:**
- Fetches persona descriptions and style preferences
- Includes linked style references as examples
- Blends multiple personas for sophisticated voice
- Maintains brand consistency across comments

### 4.4 Available Comment Styles

- **Insightful**: Thoughtful analysis and observations
- **Question**: Engaging questions to drive discussion  
- **Congratulatory**: Positive praise and recognition
- **Supportive**: Encouraging and helpful responses
- **Professional**: Business-appropriate tone
- **Casual**: Friendly, conversational style

### 4.5 LLM Provider Options

**OpenAI** (recommended for creativity):
```json
{
  "llm_provider": "openai",
  "llm_model": "gpt-4o-mini",
  "openai_api_key": "YOUR_KEY",
  "temperature": 0.7
}
```

**Anthropic** (recommended for analysis):
```json
{
  "llm_provider": "anthropic", 
  "llm_model": "claude-3-haiku-20240307",
  "anthropic_api_key": "YOUR_KEY"
}
```

**Google** (recommended for factual content):
```json
{
  "llm_provider": "google",
  "llm_model": "gemini-1.5-flash",
  "google_api_key": "YOUR_KEY"
}
```

### 4.6 Expected Response

```json
{
  "success": true,
  "comment": "{\n  \"text\": \"This is fascinating! The intersection of AI and social media management is creating incredible opportunities for brands to engage more authentically. How are you measuring the ROI on AI-generated content? 🤔 #AI #SocialMedia\"
}",
  "style": "Question",
  "confidence": 87,
  "output_id": "777402fa-ea9e-472f-843b-a5c45eb0b217",
  "post_context": "Just launched our new AI-powered social media...",
  "llm_provider_used": "openai",
  "processing_time": 2.34,
  "message": "Question reply comment generated successfully from 1 source(s)."
}
```

**📝 Note:** The `comment` field contains JSON-formatted text. To extract the actual comment text for posting, use:
- **JavaScript:** `JSON.parse(response.comment).text`
- **Python:** `json.loads(response['comment'])['text']`
- **Bash/curl:** `jq -r '.comment | fromjson | .text'`

**🐦 Twitter Character Limit:** Comments are automatically generated to stay under 280 characters for Twitter compatibility (v50 update).

**💾 Data Saved to `output_schemas` table:**
- `content`: The generated comment text
- `status`: PENDING (ready for approval)
- `confidence_score`: AI confidence rating (75-95%)
- `metadata`: Complete context including:
  - `comment_type`: "reply" or "new_content"
  - `style`: Comment style used
  - `source_document_ids`: Source documents
  - `persona_ids`: Personas applied
  - `num_sources`: Number of content sources
  - `llm_provider`: AI model used

**📝 Save the `output_id` - you'll need it for approval in Step 5!**

### 4.2 Generate Comment with Persona Styling

**Endpoint:** `POST /api/v1/style/generate-comment`

1. Use this request body with persona:

```json
{
  "comment_type": "reply",
  "document_id": "DOCUMENT_ID_FROM_SEARCH",
  "persona_ids": ["PERSONA_ID_FROM_STEP_2.1"],
  "comment_style": "Supportive",
  "llm_provider": "anthropic"
}
```

2. Click **Execute**
3. **Expected Response:** Comment styled according to your persona

**💾 Data Saved:**
- **`output_schemas`**: Comment with persona styling applied
- Links to `style_references` through persona relationship

---

## Step 5: Style Transfer

### 5.1 Transform Content Style

**Endpoint:** `POST /api/v1/style/transform`

1. Find `POST /api/v1/style/transform` and click **"Try it out"**
2. Use this request body:

```json
{
  "content_to_transform": "Our new product uses advanced algorithms to optimize social media engagement through intelligent content generation.",
  "persona_id": "PERSONA_ID_FROM_STEP_2.1",
  "llm_provider": "anthropic"
}
```

3. Click **Execute**
4. **Expected Response:** `200 OK` with content transformed to match your persona's style

**💾 Data Saved:**
- **Response only**: Style transfer results are returned but not automatically saved
- To save, you would need to create an `output_schema` record manually

---

## Step 6: Approval Workflow

### 6.1 List Generated Outputs

**Endpoint:** `GET /api/v1/outputs`

1. Find `GET /api/v1/outputs` and click **"Try it out"**
2. Click **Execute**
3. **Expected Response:** Array of your generated content (including comments from Step 3.1)

### 6.2 Approve Generated Content

**Endpoint:** `POST /api/v1/outputs/{output_id}/approve`

1. Find `POST /api/v1/outputs/{output_id}/approve` and click **"Try it out"**
2. Use the `output_id` from the comment generation response (Step 4.1)
3. Use this request body:

```json
{
  "score": 9,
  "feedback": "Excellent comment! Very engaging and on-brand.",
  "notes": "Perfect tone for our target audience"
}
```

4. Click **Execute**
5. **Expected Response:** `200 OK` with approval confirmation

**💾 Data Saved:**
- **`approval_history`**: Approval decision record
  - `score`: Quality rating (1-10)
  - `feedback`: Detailed feedback
  - `approved`: true
- **`output_schemas`**: Status updated to APPROVED

### 6.3 Reject Generated Content

**Endpoint:** `POST /api/v1/outputs/{output_id}/reject`

1. Generate another comment first (repeat Step 4.1)
2. Find `POST /api/v1/outputs/{output_id}/reject` and click **"Try it out"**
3. Use the new `output_id`
4. Use this request body:

```json
{
  "score": 4,
  "feedback": "Too generic, needs more personality",
  "notes": "Try adding more specific industry knowledge"
}
```

5. Click **Execute**
6. **Expected Response:** `200 OK` with rejection confirmation

**💾 Data Saved:**
- **`approval_history`**: Rejection decision record
  - `score`: Quality rating (1-10)
  - `feedback`: Improvement suggestions
  - `approved`: false
- **`output_schemas`**: Status updated to REJECTED

### 6.4 View Approval History

**Endpoint:** `GET /api/v1/outputs/{id}/history`

1. Find `GET /api/v1/outputs/{id}/history` and click **"Try it out"**
2. Enter the `output_id` you approved in Step 6.2
3. Click **Execute**
4. **Expected Response:** Complete approval history with scores and feedback

---

## Step 7: Social Media Integration & Posting

### 7.1 Post Approved Content to Twitter

**Endpoint:** `POST /api/v1/twitter/post`

1. Find `POST /api/v1/twitter/post` and click **"Try it out"**
2. Use approved content from Step 6.1:

```json
{
  "content": "APPROVED_COMMENT_CONTENT_FROM_STEP_6.1",
  "reply_to_tweet_id": "OPTIONAL_TWEET_ID_TO_REPLY_TO"
}
```

**OR** post as new tweet:

```json
{
  "content": "Just tested the Megaforce API workflow - amazing AI-powered social media management! 🚀 #AI #SocialMedia"
}
```

3. Click **Execute**
4. **Expected Response:** `201 Created` with tweet details

**💾 Data Saved:**
- **Twitter Platform**: Live tweet posted
- **Response**: Tweet ID and URL for tracking
- **Optional**: Link back to `output_schemas` record and engagement potential

---

## Step 8: Advanced Features & Dashboard

### 8.1 View Dashboard Data

**Endpoint:** `GET /api/v1/documents/dashboard/posts`

1. Find `GET /api/v1/documents/dashboard/posts` and click **"Try it out"**
2. Click **Execute**
3. **Expected Response:** UI-formatted posts ready for dashboard display

**💾 Data Retrieved:**
- **`documents`**: All discovered content
- **`output_schemas`**: Generated comments and content
- **`approval_history`**: Review decisions
- **`runs`**: Search execution history

### 8.2 Create Input Source

**Endpoint:** `POST /api/v1/input-sources`

1. Find `POST /api/v1/input-sources` and click **"Try it out"**
2. Use this request body:

```json
{
  "name": "Tech Industry News",
  "source_type": "twitter",
  "configuration": {
    "search_query": "artificial intelligence news",
    "limit": 50,
    "rank_tweets": true
  },
  "is_active": true
}
```

3. Click **Execute**
4. **Expected Response:** `201 Created` with input source details

### 7.2 Create and Manage Runs

**Endpoint:** `POST /api/v1/runs`

1. Find `POST /api/v1/runs` and click **"Try it out"**
2. Use this request body (replace with your input source ID):

```json
{
  "input_source_id": "INPUT_SOURCE_ID_FROM_STEP_7.1",
  "run_type": "content_generation",
  "configuration": {
    "max_documents": 10,
    "style_transfer": true
  }
}
```

3. Click **Execute**
4. **Expected Response:** `201 Created` with run details

### 7.3 View Documents

**Endpoint:** `GET /api/v1/documents`

1. Find `GET /api/v1/documents` and click **"Try it out"**
2. Click **Execute**
3. **Expected Response:** Array of processed documents

### 7.4 Dashboard View

**Endpoint:** `GET /api/v1/documents/dashboard/posts`

1. Find `GET /api/v1/documents/dashboard/posts` and click **"Try it out"**
2. Click **Execute**
3. **Expected Response:** UI-formatted posts ready for dashboard display

---

## 🎉 Congratulations!

You've successfully tested the complete Megaforce Social Media API workflow:

✅ **Authentication** - Registered, logged in, and managed passwords → `users`  
✅ **Persona Management** - Created personas and style references → `personas`, `style_references`  
✅ **Content Discovery** - Searched Twitter for relevant content → `input_sources`, `runs`, `documents`  
✅ **AI Comment Generation** - Generated single targeted comments → `output_schemas`  
✅ **Style Transfer** - Transformed content with persona styling → Response data  
✅ **Approval Workflow** - Approved and rejected content with feedback → `approval_history`  
✅ **Social Media Publishing** - Posted approved content to Twitter → Live tweets  
✅ **Dashboard Integration** - Viewed formatted data for UI display → Aggregated data

## 📊 Complete Data Flow

```
Twitter Search → documents → Comment Generation → output_schemas
     ↓                              ↓
Personas → style_references → Style Transfer → Approval → approval_history
     ↓                              ↓
Approved Content → Twitter Post → Live Social Media
```  

## 🔧 Environment Variables Reference

For the API calls requiring credentials, ensure you have:

```bash
# LLM Providers (for comment generation and style transfer)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_API_KEY=your_google_key_here

# Arcade/Twitter Integration (for search and posting)
USER_ID=your_arcade_user_id
ARCADE_API_KEY=your_arcade_api_key
ARCADE_PROVIDER_ID=x
```

## 📚 Next Steps

- **Integrate with UI:** Use these endpoints in your frontend application
- **Automate Workflows:** Set up scheduled runs for content generation
- **Scale Content:** Create multiple personas for different brand voices
- **Monitor Performance:** Use approval feedback for ML/RL training
- **Expand Integration:** Add more social media platforms

## 🆘 Troubleshooting

- **401 Unauthorized:** Check your JWT token in the Authorization header
- **403 Forbidden:** Verify API credentials (LLM keys, Arcade credentials)
- **404 Not Found:** Ensure you're using correct IDs from previous responses
- **500 Internal Server Error:** Check the API logs or contact support

---

**🚀 Live API:** https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/docs  
**📊 Health Check:** https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/health
