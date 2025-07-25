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
            print(f"🔍 Full output_value: {output_value}")
            print(f"🔍 Output type: {type(output_value)}")
            
            tweet_id = None
            tweet_url = None
            
            if isinstance(output_value, dict):
                tweet_id = output_value.get('id')
                tweet_url = output_value.get('url')
                print(f"🆔 Tweet ID from dict: {tweet_id}")
                print(f"🔗 Tweet URL from dict: {tweet_url}")
            elif isinstance(output_value, str):
                # Parse string response: "Tweet with id 1948801436713701645 posted successfully. URL: https://x.com/x/status/1948801436713701645"
                import re
                
                # Extract tweet ID using regex
                id_match = re.search(r'id (\d+)', output_value)
                if id_match:
                    tweet_id = id_match.group(1)
                    print(f"🆔 Tweet ID from string: {tweet_id}")
                
                # Extract URL using regex
                url_match = re.search(r'URL: (https://[^\s]+)', output_value)
                if url_match:
                    tweet_url = url_match.group(1)
                    print(f"🔗 Tweet URL from string: {tweet_url}")
            else:
                print(f"⚠️ Output is not a dict or string, it's: {type(output_value)}")
            
            # Create a structured output with extracted data
            structured_output = {
                "id": tweet_id,
                "url": tweet_url,
                "raw_response": output_value
            }
                
            return {
                "success": True,
                "status": result.status,
                "output": structured_output
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
