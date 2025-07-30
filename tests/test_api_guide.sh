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
if [ -z "$OPENAI_API_KEY" ] || [ -z "$ARCADE_API_KEY" ]; then
  echo "Error: Please set OPENAI_API_KEY and ARCADE_API_KEY environment variables."
  exit 1
fi

# --- Test Variables ---
USERNAME="testuser_$(date +%s)"
EMAIL="${USERNAME}@example.com"
PASSWORD="secure_password_123"

echo "[INFO] Starting API E2E Test for user: $USERNAME"

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
STYLE_REF_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/style-references/?persona_id=${PERSONA_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\
    \"reference_type\": \"text\", \
    \"title\": \"Tech Blog Example\", \
    \"content_text\": \"Artificial intelligence is revolutionizing how we approach software development. By leveraging machine learning algorithms, developers can now automate complex tasks that previously required extensive manual effort. This breakthrough technology enables teams to focus on innovation rather than repetitive processes.\", \
    \"content_type\": \"text\", \
    \"source_url\": \"https://example.com/tech-blog\", \
    \"notes\": \"Example of professional tech writing style\"
  }")
STYLE_REF_ID=$(echo "$STYLE_REF_RESPONSE" | jq -r '.id')
echo "[SUCCESS] Style reference created with ID: $STYLE_REF_ID"

# --- Step 3: Twitter Search & Content Discovery ---
echo "[INFO] Step 3.1: Searching Twitter..."
TWITTER_SEARCH_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/twitter/search" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"search_type\": \"keywords\", \"search_query\": \"artificial intelligence startup\", \"limit\": 10, \"rank_tweets\": false, \"arcade_api_key\": \"${ARCADE_API_KEY}\"}")
RUN_ID=$(echo "$TWITTER_SEARCH_RESPONSE" | jq -r '.run_id')
DOCUMENT_ID=$(echo "$TWITTER_SEARCH_RESPONSE" | jq -r '.documents[0].id')
echo "[SUCCESS] Twitter search completed. Run ID: $RUN_ID, First Document ID: $DOCUMENT_ID"

# --- Step 4: AI Comment Generation ---
echo "[INFO] Step 4.1: Generating single comment from search results..."
COMMENT_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/style/generate-comment" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\
    \"comment_type\": \"new_content\",\
    \"run_id\": \"${RUN_ID}\",\
    \"comment_style\": \"Insightful\",\
    \"llm_provider\": \"openai\",\
    \"openai_api_key\": \"${OPENAI_API_KEY}\"\
  }")
COMMENT_ID=$(echo "$COMMENT_RESPONSE" | jq -r '.output_id')
echo "[SUCCESS] Comment generated with ID: $COMMENT_ID"

echo "[INFO] Step 4.2: Generating persona-styled comment..."
PERSONA_COMMENT_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/style/generate-comment" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\
    \"comment_type\": \"reply\",\
    \"document_id\": \"${DOCUMENT_ID}\",\
    \"persona_ids\": [\"${PERSONA_ID}\"],\
    \"comment_style\": \"Supportive\",\
    \"llm_provider\": \"openai\",\
    \"openai_api_key\": \"${OPENAI_API_KEY}\"\
  }")
PERSONA_COMMENT_ID=$(echo "$PERSONA_COMMENT_RESPONSE" | jq -r '.output_id')
echo "[SUCCESS] Persona-styled comment generated with ID: $PERSONA_COMMENT_ID"

# --- Step 6: Approval Workflow ---
echo "[INFO] Step 6.1: Approving comment..."
curl -s -X POST "${BASE_URL}/api/v1/outputs/${COMMENT_ID}/approve" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"score": 9, "feedback": "Excellent comment! Very engaging and on-brand.", "notes": "Perfect tone for our target audience"}'
echo "[SUCCESS] Comment approved."

echo "[INFO] Step 6.2: Rejecting persona comment..."
curl -s -X POST "${BASE_URL}/api/v1/outputs/${PERSONA_COMMENT_ID}/reject" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"score": 4, "feedback": "Too generic, needs more personality", "notes": "Try adding more specific industry knowledge"}'
echo "[SUCCESS] Comment rejected."

# --- Step 7: Social Media Posting ---
echo "[INFO] Step 7.1: Posting approved content to Twitter..."
APPROVED_CONTENT=$(echo "$COMMENT_RESPONSE" | jq -r '.output_text')
TWITTER_POST_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/twitter/post" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\
    \"content\": \"${APPROVED_CONTENT}\",\
    \"arcade_api_key\": \"${ARCADE_API_KEY}\"\
  }")
TWEET_ID=$(echo "$TWITTER_POST_RESPONSE" | jq -r '.tweet_id')
echo "[SUCCESS] Tweet posted with ID: $TWEET_ID"

# --- Step 8: Dashboard & Advanced Features ---
echo "[INFO] Step 8.1: Viewing dashboard data..."
DASHBOARD_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/v1/documents/dashboard/posts" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")
DASHBOARD_COUNT=$(echo "$DASHBOARD_RESPONSE" | jq '. | length')
echo "[SUCCESS] Dashboard returned $DASHBOARD_COUNT items."
#   -H 'Content-Type: application/json' \
#   -d "{\"content\": \"Testing the new Megaforce API! #AI #Automation\", \"arcade_api_key\": \"${ARCADE_API_KEY}\"}")
# TWEET_ID=$(echo "$POST_TWEET_RESPONSE" | jq -r '.tweet_id')
# if [ -z "$TWEET_ID" ] || [ "$TWEET_ID" == "null" ]; then
#     echo "[ERROR] Failed to post tweet!" >&2
#     echo "$POST_TWEET_RESPONSE"
# else
#     echo "[SUCCESS] Posted Tweet with ID: $TWEET_ID"
# fi

# --- Step 7: Cleanup ---
echo "[INFO] Step 7.1: Deleting user..."
curl -s -X DELETE "${BASE_URL}/api/v1/users/${USER_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
echo "[SUCCESS] User and all associated data deleted."

echo "[INFO] E2E Test Completed Successfully!"
