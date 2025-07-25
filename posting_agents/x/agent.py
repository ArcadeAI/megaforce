#!/usr/bin/env python3

import asyncio
import os
import sys
from typing import Optional
from dotenv import load_dotenv
from arcadepy import AsyncArcade

# Add the project root to Python path for imports
sys.path.append('/Users/scarlettattensil/megaforce')
from common.utils import auth_tools

# Load environment variables
load_dotenv()

async def post_tweet(
    tweet_text: str,
    userid: str = None,
    key: str = None,
    provider: str = None
) -> dict:
    """
    Post a tweet to X (Twitter) using Arcade tools
    
    Args:
        tweet_text: The text content of the tweet to post
        userid: User ID for authorization (defaults to env vars)
        key: API key for authorization (defaults to env vars)
        provider: Provider name (defaults to 'x')
    
    Returns:
        dict: Result of the tweet posting operation
    """
    
    # Initialize Arcade client
    client = AsyncArcade(
        api_key=key or os.getenv("ARCADE_API_KEY")
    )
    
    try:
        # Authorize the posting tool
        await auth_tools(
            client=client,
            user_id=userid,
            tool_names=["X.PostTweet"],
            provider=provider,
            key=key
        )
        
        print(f"📝 Posting tweet: '{tweet_text[:50]}{'...' if len(tweet_text) > 50 else ''}'")
        
        # Execute the PostTweet tool
        result = await client.tools.execute(
            tool_name="X.PostTweet",
            input={
                "tweet_text": tweet_text
            },
            user_id=userid or os.getenv("ARCADE_USER_ID") or os.getenv("USER_ID")
        )
        
        print(f"✅ Tweet posting result:")
        print(f"Status: {result.status}")
        print(f"Success: {result.success}")
        
        if result.success and result.output:
            # Handle the Output object properly
            output_value = result.output.value if hasattr(result.output, 'value') else result.output
            print(f"📋 Tweet posted successfully!")
            if isinstance(output_value, dict):
                tweet_id = output_value.get('id', 'Unknown')
                tweet_url = output_value.get('url', 'Unknown')
                print(f"🆔 Tweet ID: {tweet_id}")
                print(f"🔗 Tweet URL: {tweet_url}")
            return {
                "success": True,
                "status": result.status,
                "output": output_value
            }
        else:
            print(f"❌ Tweet posting failed: {result}")
            return {
                "success": False,
                "status": result.status,
                "error": str(result)
            }
            
    except Exception as e:
        print(f"❌ Error posting tweet: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        await client.close()

async def delete_tweet(
    tweet_id: str,
    userid: str = None,
    key: str = None,
    provider: str = None
) -> dict:
    """
    Delete a tweet from X (Twitter) using Arcade tools
    
    Args:
        tweet_id: The ID of the tweet to delete
        userid: User ID for authorization (defaults to env vars)
        key: API key for authorization (defaults to env vars)
        provider: Provider name (defaults to 'x')
    
    Returns:
        dict: Result of the tweet deletion operation
    """
    
    # Initialize Arcade client
    client = AsyncArcade(
        api_key=key or os.getenv("ARCADE_API_KEY")
    )
    
    try:
        # Authorize the deletion tool
        await auth_tools(
            client=client,
            user_id=userid,
            tool_names=["X.DeleteTweetById"],
            provider=provider,
            key=key
        )
        
        print(f"🗑️ Deleting tweet ID: {tweet_id}")
        
        # Execute the DeleteTweetById tool
        result = await client.tools.execute(
            tool_name="X.DeleteTweetById",
            input={
                "tweet_id": tweet_id
            },
            user_id=userid or os.getenv("ARCADE_USER_ID") or os.getenv("USER_ID")
        )
        
        print(f"✅ Tweet deletion result:")
        print(f"Status: {result.status}")
        print(f"Success: {result.success}")
        
        if result.success:
            print(f"🗑️ Tweet deleted successfully!")
            return {
                "success": True,
                "status": result.status,
                "tweet_id": tweet_id
            }
        else:
            print(f"❌ Tweet deletion failed: {result}")
            return {
                "success": False,
                "status": result.status,
                "error": str(result)
            }
            
    except Exception as e:
        print(f"❌ Error deleting tweet: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        await client.close()
