#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e
# Print commands and their arguments as they are executed.
set -x

# --- Configuration ---
BASE_URL="https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com"

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  set -o allexport
  source .env
  set +o allexport
fi

# Check for required environment variables
if [ -z "$OPENAI_API_KEY" ] || [ -z "$ARCADE_API_KEY" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "Error: Please set OPENAI_API_KEY, ARCADE_API_KEY, and ANTHROPIC_API_KEY environment variables."
  exit 1
fi

# --- Test Variables ---
USERNAME="testuser_$(date +%s)"
EMAIL="${USERNAME}@example.com"
PASSWORD="secure_password_123"

echo "[INFO] Starting Heroku API E2E Test for user: $USERNAME"
echo "[INFO] Testing against: $BASE_URL"

# --- Step 1: User Registration & Login ---
echo "[INFO] Step 1.1: Registering new user..."
REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/auth/register" \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d "{\"username\": \"${USERNAME}\", \"email\": \"${EMAIL}\", \"password\": \"${PASSWORD}\"}")
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.id')
echo "[SUCCESS] User registered with ID: $USER_ID"

echo "[INFO] Step 1.2: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/auth/login" \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d "{\"username\": \"${USERNAME}\", \"password\": \"${PASSWORD}\"}")
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
echo "[SUCCESS] Logged in successfully."

# --- Step 2: Persona and Style ---
echo "[INFO] Step 2.1: Creating Persona..."
PERSONA_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/personas/" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
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
  }')
PERSONA_ID=$(echo "$PERSONA_RESPONSE" | jq -r '.id')
echo "[SUCCESS] Persona created with ID: $PERSONA_ID"

echo "[INFO] Step 2.2: Creating Style Reference..."
STYLE_REF_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/documents/" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{
    \"title\": \"Tech Blog Example\",
    \"content\": \"Artificial intelligence is revolutionizing how we approach software development. By leveraging machine learning algorithms, developers can now automate complex tasks that previously required extensive manual effort. This breakthrough technology enables teams to focus on innovation rather than repetitive processes.\",
    \"url\": \"https://example.com/tech-blog\",
    \"document_type\": \"style_reference\",
    \"reference_type\": \"text\",
    \"is_style_reference\": true,
    \"persona_ids\": [\"${PERSONA_ID}\"]
  }")
STYLE_REF_ID=$(echo "$STYLE_REF_RESPONSE" | jq -r '.id')
echo "[SUCCESS] Style reference created with ID: $STYLE_REF_ID"

# --- Step 3: Twitter Search ---
echo "[INFO] Step 3.1: Searching Twitter..."
TWITTER_SEARCH_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/twitter/search" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{
    \"search_type\": \"keywords\",
    \"search_query\": \"artificial intelligence startup\",
    \"limit\": 10,
    \"target_number\": 5,
    \"audience_specification\": \"All audiences\",
    \"rank_tweets\": false,
    \"llm_provider\": \"openai\",
    \"llm_model\": \"gpt-4o-2024-08-06\",
    \"arcade_api_key\": \"${ARCADE_API_KEY}\"
  }")
RUN_ID=$(echo "$TWITTER_SEARCH_RESPONSE" | jq -r '.run_id')
DOCUMENT_ID=$(echo "$TWITTER_SEARCH_RESPONSE" | jq -r '.documents[0].id')
TOTAL_FOUND=$(echo "$TWITTER_SEARCH_RESPONSE" | jq -r '.total_found')
echo "[SUCCESS] Twitter search completed. Run ID: $RUN_ID, Found: $TOTAL_FOUND tweets"

# --- Step 4: Comment Generation (All 4 Methods) ---
echo "[INFO] Step 4.1: Method 1 - Generate from run..."
COMMENT_RESPONSE_1=$(curl -s -X POST "${BASE_URL}/api/v1/style/generate-comments" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{
    \"comment_type\": \"new_content\",
    \"run_id\": \"${RUN_ID}\",
    \"comment_style\": \"Insightful\",
    \"llm_provider\": \"openai\",
    \"openai_api_key\": \"${OPENAI_API_KEY}\"
  }")
COMMENT_ID_1=$(echo "$COMMENT_RESPONSE_1" | jq -r '.[0].output_id')
echo "[SUCCESS] Method 1 - Run-based comment generated with ID: $COMMENT_ID_1"

echo "[INFO] Step 4.2: Method 2 - Generate from document..."
COMMENT_RESPONSE_2=$(curl -s -X POST "${BASE_URL}/api/v1/style/generate-comments" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{
    \"comment_type\": \"reply\",
    \"document_id\": \"${DOCUMENT_ID}\",
    \"comment_style\": \"Question\",
    \"llm_provider\": \"openai\",
    \"openai_api_key\": \"${OPENAI_API_KEY}\"
  }")
COMMENT_ID_2=$(echo "$COMMENT_RESPONSE_2" | jq -r '.[0].output_id')
echo "[SUCCESS] Method 2 - Document-based comment generated with ID: $COMMENT_ID_2"

echo "[INFO] Step 4.3: Method 3 - Generate from custom content..."
COMMENT_RESPONSE_3=$(curl -s -X POST "${BASE_URL}/api/v1/style/generate-comments" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{
    \"comment_type\": \"new_content\",
    \"post_content\": \"Just launched our new AI-powered social media management tool! It can generate contextual comments, manage multiple personas, and automate engagement workflows.\",
    \"post_title\": \"AI Social Media Tool Launch\",
    \"comment_style\": \"Congratulatory\",
    \"llm_provider\": \"openai\",
    \"openai_api_key\": \"${OPENAI_API_KEY}\"
  }")
COMMENT_ID_3=$(echo "$COMMENT_RESPONSE_3" | jq -r '.[0].output_id')
echo "[SUCCESS] Method 3 - Custom content comment generated with ID: $COMMENT_ID_3"

echo "[INFO] Step 4.4: Method 4 - Generate with persona styling..."
COMMENT_RESPONSE_4=$(curl -s -X POST "${BASE_URL}/api/v1/style/generate-comments" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{
    \"comment_type\": \"reply\",
    \"document_id\": \"${DOCUMENT_ID}\",
    \"persona_id\": \"${PERSONA_ID}\",
    \"comment_style\": \"Supportive\",
    \"llm_provider\": \"anthropic\",
    \"anthropic_api_key\": \"${ANTHROPIC_API_KEY}\"
  }")
COMMENT_ID=$(echo "$COMMENT_RESPONSE_4" | jq -r '.[0].output_id')
echo "[SUCCESS] Method 4 - Persona-styled comment generated with ID: $COMMENT_ID"

echo "[INFO] Comment Generation Summary:"
echo "  - Method 1 (Run): $COMMENT_ID_1"
echo "  - Method 2 (Document): $COMMENT_ID_2"
echo "  - Method 3 (Custom): $COMMENT_ID_3"
echo "  - Method 4 (Persona): $COMMENT_ID"

echo "[INFO] Using Method 4 (Persona) comment for approval and posting..."

# --- Step 5: Comment Approval ---
echo "[INFO] Step 6.1: Approving comment..."
curl -s -X POST "${BASE_URL}/api/v1/outputs/${COMMENT_ID}/approve" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{
    "score": 9,
    "feedback": "Excellent comment! Very engaging and on-brand.",
    "notes": "Perfect tone for our target audience"
  }'
echo "[SUCCESS] Comment approved."

# --- Step 6: Twitter Posting ---
echo "[INFO] Step 7.1: Posting approved content to Twitter..."
APPROVED_CONTENT=$(echo "$COMMENT_RESPONSE_4" | jq -r '.[0].comment.text')
echo "[INFO] Comment to post: $APPROVED_CONTENT"

# Truncate if longer than 280 characters
if [ ${#APPROVED_CONTENT} -gt 280 ]; then
  APPROVED_CONTENT="${APPROVED_CONTENT:0:277}..."
  echo "[INFO] Comment truncated to 280 characters: $APPROVED_CONTENT"
fi

TWITTER_POST_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/twitter/post" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{
    \"tweet_text\": \"${APPROVED_CONTENT}\",
    \"arcade_api_key\": \"${ARCADE_API_KEY}\"
  }")
TWEET_ID=$(echo "$TWITTER_POST_RESPONSE" | jq -r '.tweet_id')
TWEET_URL=$(echo "$TWITTER_POST_RESPONSE" | jq -r '.tweet_url')
echo "[SUCCESS] Tweet posted with ID: $TWEET_ID"
echo "[SUCCESS] Tweet URL: $TWEET_URL"

# --- Step 7: Dashboard Check ---
echo "[INFO] Step 8.1: Viewing dashboard data..."
DASHBOARD_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/v1/documents/dashboard/posts" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")
DASHBOARD_COUNT=$(echo "$DASHBOARD_RESPONSE" | jq '. | length')
echo "[SUCCESS] Dashboard returned $DASHBOARD_COUNT items."

# --- Step 8: Cleanup ---
echo "[INFO] Step 7.1: Deleting user..."
curl -s -X DELETE "${BASE_URL}/api/v1/users/${USER_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
echo "[SUCCESS] User and all associated data deleted."

echo "[INFO] Heroku E2E Test Completed Successfully!"
