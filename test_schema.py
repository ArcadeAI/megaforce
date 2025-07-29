#!/usr/bin/env python3

# Quick test to check TwitterSearchRequest default behavior
import sys
sys.path.append('/Users/scarlettattensil/megaforce')

from api.schemas import TwitterSearchRequest

# Test 1: Empty request (should use defaults)
print("=== Test 1: Minimal request ===")
try:
    request1 = TwitterSearchRequest(
        search_type="keywords",
        search_query="test"
    )
    print(f"request1.rank_tweets = {request1.rank_tweets}")
    print(f"type = {type(request1.rank_tweets)}")
except Exception as e:
    print(f"Error: {e}")

# Test 2: Explicit False
print("\n=== Test 2: Explicit False ===")
try:
    request2 = TwitterSearchRequest(
        search_type="keywords", 
        search_query="test",
        rank_tweets=False
    )
    print(f"request2.rank_tweets = {request2.rank_tweets}")
    print(f"type = {type(request2.rank_tweets)}")
except Exception as e:
    print(f"Error: {e}")

# Test 3: Explicit True
print("\n=== Test 3: Explicit True ===")
try:
    request3 = TwitterSearchRequest(
        search_type="keywords",
        search_query="test", 
        rank_tweets=True
    )
    print(f"request3.rank_tweets = {request3.rank_tweets}")
    print(f"type = {type(request3.rank_tweets)}")
except Exception as e:
    print(f"Error: {e}")
