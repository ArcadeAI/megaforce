#!/usr/bin/env python3
"""
Simple test of Twitter agent functionality
"""

import asyncio
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from api/.env
load_dotenv(Path(__file__).parent / "api" / ".env")

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from parser_agents.x.agent import get_content
from parser_agents.x.schemas import InputSchema, SearchType

async def test_twitter_agent():
    """Test the Twitter agent with minimal parameters"""
    print("🐦 Testing Twitter agent directly...")
    
    try:
        # Create minimal test configuration
        config = InputSchema(
            search_type=SearchType.KEYWORDS,
            search_query="AI",
            limit=5,  # Small limit
            target_number=2,  # Small target
            rank_tweets=False,  # Disable ranking for speed
            audience_specification="Simple test"
        )
        
        print(f"📝 Config: {config.search_query} (limit={config.limit}, target={config.target_number}, rank={config.rank_tweets})")
        
        # Test with timeout
        print("⏱️  Running Twitter agent with 60s timeout...")
        documents = await asyncio.wait_for(
            get_content(config),
            timeout=60.0
        )
        
        print(f"✅ Success! Got {len(documents)} documents")
        
        # Print sample results
        for i, doc in enumerate(documents[:2]):
            print(f"\n📄 Document {i+1}:")
            print(f"   Title: {doc.title}")
            print(f"   Author: {doc.author}")
            print(f"   Content: {doc.content[:100]}...")
            print(f"   Score: {doc.score}")
        
        return True
        
    except asyncio.TimeoutError:
        print("❌ Twitter agent timed out after 60 seconds")
        return False
    except Exception as e:
        print(f"❌ Twitter agent failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_twitter_agent())
    print(f"\n{'🎉 Twitter agent working!' if success else '💥 Twitter agent needs fixing'}")
    sys.exit(0 if success else 1)
