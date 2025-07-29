#!/usr/bin/env python3

import sys
sys.path.append('/Users/scarlettattensil/megaforce')

from parser_agents.x.schemas import InputSchema, SearchType

# Test 1: Create InputSchema without rank_tweets (should default to False)
print("=== Test 1: InputSchema without rank_tweets ===")
input1 = InputSchema(
    search_type=SearchType.KEYWORDS,
    search_query="chocolate",
    limit=3,
    target_number=5,
    audience_specification="All audiences"
)
print(f"rank_tweets value: {input1.rank_tweets}")
print(f"rank_tweets type: {type(input1.rank_tweets)}")

# Test 2: Create InputSchema with explicit rank_tweets=False
print("\n=== Test 2: InputSchema with explicit rank_tweets=False ===")
input2 = InputSchema(
    search_type=SearchType.KEYWORDS,
    search_query="chocolate",
    limit=3,
    target_number=5,
    audience_specification="All audiences",
    rank_tweets=False
)
print(f"rank_tweets value: {input2.rank_tweets}")
print(f"rank_tweets type: {type(input2.rank_tweets)}")

# Test 3: Create InputSchema with explicit rank_tweets=True
print("\n=== Test 3: InputSchema with explicit rank_tweets=True ===")
input3 = InputSchema(
    search_type=SearchType.KEYWORDS,
    search_query="chocolate",
    limit=3,
    target_number=5,
    audience_specification="All audiences",
    rank_tweets=True
)
print(f"rank_tweets value: {input3.rank_tweets}")
print(f"rank_tweets type: {type(input3.rank_tweets)}")
