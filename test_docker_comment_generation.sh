#!/bin/bash

# Test script for Docker-based comment generation
set -e

echo "🐳 Testing Comment Generation in Docker..."

# Load environment variables
source .env

# API base URL for Docker
API_URL="http://localhost:8000"

# Create test user
USERNAME="testuser_$(date +%s)"
EMAIL="${USERNAME}@example.com"
PASSWORD="secure_password_123"

echo "📝 Registering test user: $USERNAME"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

echo "🔐 Logging in..."
ACCESS_TOKEN=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}" | jq -r ".access_token")

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Failed to get access token"
    exit 1
fi

echo "✅ Got access token: ${ACCESS_TOKEN:0:20}..."

echo ""
echo "🎯 Testing Method 3: Custom Content Comment Generation..."
RESULT=$(curl -s -X POST "$API_URL/api/v1/style/generate-comment" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"comment_type\": \"new_content\",
    \"post_content\": \"Just launched our new AI-powered social media management tool! It can generate contextual comments, manage multiple personas, and automate engagement workflows.\",
    \"post_title\": \"AI Tool Launch\",
    \"comment_style\": \"Congratulatory\",
    \"llm_provider\": \"openai\",
    \"openai_api_key\": \"$OPENAI_API_KEY\"
  }")

echo "📊 Response:"
echo "$RESULT" | jq .

# Check if successful
if echo "$RESULT" | jq -e ".success" > /dev/null 2>&1; then
    echo ""
    echo "🎉 SUCCESS! Comment generation is working in Docker!"
    echo "Generated comment: $(echo "$RESULT" | jq -r ".comment")"
    echo "Output ID: $(echo "$RESULT" | jq -r ".output_id")"
    echo "Confidence: $(echo "$RESULT" | jq -r ".confidence")"
else
    echo ""
    echo "❌ Comment generation failed in Docker"
    echo "Error details:"
    echo "$RESULT" | jq -r ".detail // .message // \"Unknown error\""
    exit 1
fi

echo ""
echo "✅ Docker test completed successfully!"
