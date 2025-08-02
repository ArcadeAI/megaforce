# Stream Agent API

This FastAPI application provides endpoints for managing subreddits, documents, and AI-generated comments.

## Features

- **Subreddit Management**: Add, update, delete, and process subreddits
- **Document Storage**: Save and retrieve documents from processed subreddits
- **AI-Generated Comments**: Store and manage AI-generated comments for documents
- **Health Check**: Monitor API status and storage counts

## Installation

1. Install dependencies:
   ```bash
   pip install -e .
   ```

2. Set up environment variables:
   ```bash
   # Create .env file with required variables
   USER_ID=your_user_id
   LLM_PROVIDER=openai
   LLM_MODEL=gpt-4o-2024-08-06
   ```

## Running the API

### Development
```bash
python api/run.py
```

### Production
```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- **Interactive API docs**: `http://localhost:8000/docs`
- **ReDoc documentation**: `http://localhost:8000/redoc`

## API Endpoints

### Subreddits

- `POST /subreddits/` - Add a new subreddit configuration
- `GET /subreddits/` - Get all subreddit configurations
- `GET /subreddits/{subreddit_id}` - Get a specific subreddit configuration
- `PUT /subreddits/{subreddit_id}` - Update a subreddit configuration
- `DELETE /subreddits/{subreddit_id}` - Delete a subreddit configuration
- `POST /subreddits/{subreddit_id}/process` - Process a subreddit and save documents

### Documents

- `GET /documents/` - Get all saved documents
- `GET /documents/{document_id}` - Get a specific document
- `DELETE /documents/{document_id}` - Delete a document
- `GET /documents/{document_id}/comments` - Get all comments for a document

### AI-Generated Comments

- `POST /comments/` - Add a new AI-generated comment
- `GET /comments/` - Get all AI-generated comments
- `GET /comments/{comment_id}` - Get a specific AI-generated comment
- `DELETE /comments/{comment_id}` - Delete an AI-generated comment

### Health Check

- `GET /health` - Get API health status and storage counts

## Example Usage

### Adding a Subreddit

```bash
curl -X POST "http://localhost:8000/subreddits/" \
  -H "Content-Type: application/json" \
  -d '{
    "subreddit": "python",
    "time_range": "TODAY",
    "limit": 100,
    "target_number": 10,
    "audience_specification": "Developer-focused content",
    "subreddit_description": "A subreddit for Python programming"
  }'
```

### Processing a Subreddit

```bash
curl -X POST "http://localhost:8000/subreddits/{subreddit_id}/process"
```

### Adding an AI-Generated Comment

```bash
curl -X POST "http://localhost:8000/comments/" \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "document_id_here",
    "content": "This is an AI-generated comment",
    "tone": "PROFESSIONAL"
  }'
```

## Data Models

### SubredditConfig
- `subreddit`: The subreddit name
- `time_range`: Time range for fetching posts
- `limit`: Maximum number of posts to fetch
- `target_number`: Target number of posts to return
- `audience_specification`: Audience specification for content filtering
- `subreddit_description`: Description of the subreddit
- `active`: Whether this subreddit is active for processing
- `created_at`: When the subreddit was added

### AIGeneratedComment
- `id`: Unique identifier for the comment
- `document_id`: ID of the document this comment relates to
- `content`: The AI-generated comment content
- `tone`: The tone/category of the comment
- `created_at`: When the comment was created
- `metadata`: Additional metadata about the comment generation

## Storage

Currently uses in-memory storage for demonstration purposes. In production, you should replace this with a proper database like PostgreSQL, MongoDB, or similar.

## Environment Variables

- `USER_ID`: Your user ID for authentication
- `LLM_PROVIDER`: LLM provider (default: "openai")
- `LLM_MODEL`: LLM model to use (default: "gpt-4o-2024-08-06")