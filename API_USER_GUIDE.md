# Megaforce API Complete User Guide

🚀 **Interactive API Documentation**: https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/docs

This guide walks you through testing **every endpoint** in the Megaforce Social Media API using the interactive Swagger documentation. Follow these steps in order to experience the complete workflow from authentication to AI-powered social media posting.

## 📋 Prerequisites

Before starting, ensure you have:
- Access to the API documentation URL above
- Valid API credentials (see Environment Setup section)
- A Twitter/X account for posting tests (optional)

## 🎯 Complete Workflow Overview

```
1. Authentication & User Management
   ↓
2. Persona & Style Management  
   ↓
3. Content Generation & Style Transfer
   ↓
4. Approval Workflow
   ↓
5. Social Media Integration
   ↓
6. Content Publishing
```

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

---

## Step 3: Content Generation & Style Transfer

### 3.1 Generate AI Comments

**Endpoint:** `POST /api/v1/style/generate-comments`

1. Find `POST /api/v1/style/generate-comments` and click **"Try it out"**
2. Use this request body (add your LLM API key):

```json
{
  "post_content": "Just launched our new AI-powered social media management platform! It automatically generates engaging comments and manages approval workflows. Excited to see how this helps content creators scale their social presence.",
  "post_title": "AI Social Media Platform Launch",
  "num_suggestions": 3,
  "comment_styles": ["Congratulatory", "Question", "Insightful"],
  "llm_provider": "anthropic",
  "anthropic_api_key": "YOUR_ANTHROPIC_API_KEY_HERE"
}
```

3. Click **Execute**
4. **Expected Response:** `200 OK` with 3 generated comments, each with:
   - Generated comment text
   - Style metadata
   - Confidence score
   - `output_id` for approval workflow

5. **📝 Note:** Copy the `output_id` values - you'll use them in the approval workflow!

### 3.2 Persona-Based Style Transfer

**Endpoint:** `POST /api/v1/style/transfer`

1. Find `POST /api/v1/style/transfer` and click **"Try it out"**
2. Use this request body (replace with your persona ID and API key):

```json
{
  "content": "This new tool is really good. It helps with social media stuff and makes things easier.",
  "persona_id": "PERSONA_ID_FROM_STEP_2.1",
  "llm_provider": "openai",
  "openai_api_key": "YOUR_OPENAI_API_KEY_HERE"
}
```

3. Click **Execute**
4. **Expected Response:** `200 OK` with professionally transformed content

---

## Step 4: Approval Workflow

### 4.1 List Generated Outputs

**Endpoint:** `GET /api/v1/outputs`

1. Find `GET /api/v1/outputs` and click **"Try it out"**
2. Click **Execute**
3. **Expected Response:** Array of your generated content (including comments from Step 3.1)

### 4.2 Approve a Comment

**Endpoint:** `POST /api/v1/outputs/{id}/approve`

1. Find `POST /api/v1/outputs/{id}/approve` and click **"Try it out"**
2. Enter one of the `output_id` values from Step 3.1 in the `id` field
3. Use this request body:

```json
{
  "score": 9,
  "feedback_notes": "Excellent comment! Professional tone, engaging content, and perfect for our brand voice. Ready for posting."
}
```

4. Click **Execute**
5. **Expected Response:** `200 OK` with approval confirmation

### 4.3 Reject a Comment

**Endpoint:** `POST /api/v1/outputs/{id}/reject`

1. Find `POST /api/v1/outputs/{id}/reject` and click **"Try it out"**
2. Enter another `output_id` from Step 3.1 in the `id` field
3. Use this request body:

```json
{
  "score": 4,
  "feedback_notes": "Comment is too generic and doesn't align with our brand voice. Needs more specific technical insights."
}
```

4. Click **Execute**
5. **Expected Response:** `200 OK` with rejection confirmation

### 4.4 View Approval History

**Endpoint:** `GET /api/v1/outputs/{id}/history`

1. Find `GET /api/v1/outputs/{id}/history` and click **"Try it out"**
2. Enter the `output_id` you approved in Step 4.2
3. Click **Execute**
4. **Expected Response:** Complete approval history with scores and feedback

---

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

## Step 6: Content Publishing

### 6.1 Post to Twitter/X

**Endpoint:** `POST /api/v1/twitter/post`

⚠️ **WARNING:** This creates a real tweet on your Twitter account!

1. Find `POST /api/v1/twitter/post` and click **"Try it out"**
2. Use this request body:

```json
{
  "tweet_text": "🚀 Testing the Megaforce API! This tweet was posted automatically using our AI-powered social media management system. #AI #SocialMedia #Automation"
}
```

3. Click **Execute**
4. **Expected Response:** `200 OK` with:
   - `success: true`
   - `tweet_id`: Unique Twitter ID
   - `tweet_url`: Direct link to your tweet

### 6.2 Delete Tweet (Cleanup)

**Endpoint:** `DELETE /api/v1/twitter/delete`

1. Find `DELETE /api/v1/twitter/delete` and click **"Try it out"**
2. Use the tweet ID from Step 6.1:

```json
{
  "tweet_id": "TWEET_ID_FROM_STEP_6.1"
}
```

3. Click **Execute**
4. **Expected Response:** `200 OK` with deletion confirmation

---

## Step 7: Advanced Features

### 7.1 Create Input Sources

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

✅ **Authentication** - Registered, logged in, and managed passwords  
✅ **Persona Management** - Created personas and style references  
✅ **AI Content Generation** - Generated comments with confidence scoring  
✅ **Approval Workflow** - Approved and rejected content with feedback  
✅ **Social Media Integration** - Searched and ranked Twitter content  
✅ **Content Publishing** - Posted and deleted tweets  
✅ **Advanced Features** - Created input sources and runs  

## 🔧 Environment Variables Reference

For the API calls requiring credentials, ensure you have:

```bash
# LLM Providers
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_API_KEY=your_google_key_here

# Arcade/Twitter Integration  
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
