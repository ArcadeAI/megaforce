#!/usr/bin/env python3

import asyncio
import sys
from datetime import datetime
sys.path.insert(0, '/Users/scarlettattensil/megaforce')

from posting_agents.x.agent import post_tweet

async def main():
    """Post a test tweet using the Megaforce posting agent."""
    
    # Create a tweet with timestamp
    tweet_text = f"🚀 Testing Megaforce posting agent - {datetime.now().strftime('%Y-%m-%d %H:%M')} - Successfully integrated Arcade tools with FastAPI! #MegaforceTest #AI"
    
    print(f"📝 Posting tweet: {tweet_text}")
    print(f"📏 Tweet length: {len(tweet_text)} characters")
    
    try:
        result = await post_tweet(tweet_text)
        
        if result["success"]:
            print("✅ Tweet posted successfully!")
            if "output" in result and isinstance(result["output"], dict):
                tweet_id = result["output"].get("id")
                if tweet_id:
                    print(f"🆔 Tweet ID: {tweet_id}")
                    print(f"🔗 Tweet URL: https://x.com/user/status/{tweet_id}")
        else:
            print("❌ Tweet posting failed!")
            print(f"Error: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")

if __name__ == "__main__":
    asyncio.run(main())
