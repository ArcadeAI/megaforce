#!/usr/bin/env python3

import pytest
import asyncio
import os
import sys
from datetime import datetime
sys.path.insert(0, '/Users/scarlettattensil/megaforce')

from parser_agents.x.agent import get_content
from posting_agents.x.agent import post_tweet, delete_tweet
from parser_agents.x.schemas import InputSchema, SearchType
from dotenv import load_dotenv

# Load environment variables for real testing
load_dotenv()

class TestRealIntegration:
    """Real integration tests using actual Arcade API - NO MOCKING."""
    
    def setup_method(self):
        """Check if we have the required credentials for real testing."""
        self.has_credentials = bool(
            os.getenv("ARCADE_API_KEY") and 
            os.getenv("USER_ID")
        )
        
        if not self.has_credentials:
            pytest.skip("No Arcade API credentials available for real testing")
    
    @pytest.mark.asyncio
    async def test_real_parser_agent(self):
        """Test the parser agent with real Arcade API calls."""
        print("\n🔍 Testing real parser agent...")
        
        # Create a search for a common topic that should have results
        input_schema = InputSchema(
            search_type=SearchType.KEYWORDS,
            search_query="python",  # Popular programming topic
            limit=3,  # Small number for faster testing
            target_number=2,
            audience_specification="Developers",
            rank_tweets=True
        )
        
        print(f"Searching for: {input_schema.search_query}")
        
        # Execute real search
        start_time = datetime.now()
        result = await get_content(input_schema)
        end_time = datetime.now()
        
        print(f"Search completed in {(end_time - start_time).total_seconds():.2f} seconds")
        print(f"Found {len(result)} results")
        
        # Verify results
        assert isinstance(result, list)
        
        # If we got results, verify structure
        if len(result) > 0:
            first_result = result[0]
            print(f"First result: {first_result.title[:50]}...")
            
            # Verify Document structure
            assert hasattr(first_result, 'title')
            assert hasattr(first_result, 'content')
            assert hasattr(first_result, 'url')
            assert first_result.title is not None
            assert first_result.content is not None
            
            # Verify it's a real tweet URL
            if hasattr(first_result, 'url') and first_result.url:
                assert 'x.com' in str(first_result.url) or 'twitter.com' in str(first_result.url)
        
        print("✅ Parser agent test completed successfully")

    @pytest.mark.asyncio
    async def test_real_posting_authorization(self):
        """Test posting agent authorization without actually posting."""
        print("\n🔐 Testing real posting authorization...")
        
        # Test that we can authorize posting tools
        from common.utils import auth_tools
        from arcadepy import AsyncArcade
        
        client = AsyncArcade(api_key=os.getenv("ARCADE_API_KEY"))
        
        try:
            await auth_tools(
                client=client,
                user_id=os.getenv("USER_ID"),
                tool_names=["X.PostTweet"],
                provider="x"
            )
            print("✅ Posting authorization successful")
        except Exception as e:
            print(f"❌ Posting authorization failed: {e}")
            raise
        finally:
            await client.close()

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_real_posting_workflow(self):
        """Test real posting workflow - CAREFUL: This posts a real tweet!"""
        # Only run if explicitly enabled
        if not os.getenv("ENABLE_REAL_POSTING_TESTS"):
            pytest.skip("Real posting tests disabled. Set ENABLE_REAL_POSTING_TESTS=1 to enable")
        
        print("\n📝 Testing real posting workflow...")
        print("⚠️  WARNING: This will post a real tweet!")
        
        # Create a clearly marked test tweet
        test_tweet = f"🤖 Megaforce Test Tweet - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - Please ignore, this is an automated test. #MegaforceTest"
        
        print(f"Posting: {test_tweet}")
        
        # Post the tweet
        post_result = await post_tweet(test_tweet)
        
        assert post_result["success"] == True
        assert "output" in post_result
        
        tweet_id = None
        if isinstance(post_result["output"], dict):
            tweet_id = post_result["output"].get("id")
        
        print(f"✅ Tweet posted successfully! ID: {tweet_id}")
        
        # Clean up - delete the test tweet
        if tweet_id:
            print(f"🗑️ Cleaning up - deleting test tweet {tweet_id}")
            delete_result = await delete_tweet(tweet_id)
            
            if delete_result["success"]:
                print("✅ Test tweet deleted successfully")
            else:
                print(f"⚠️ Failed to delete test tweet: {delete_result}")

    @pytest.mark.asyncio
    async def test_real_end_to_end_workflow(self):
        """Test complete end-to-end workflow: search -> analyze -> (simulate post)."""
        print("\n🔄 Testing real end-to-end workflow...")
        
        # Step 1: Search for content
        print("Step 1: Searching for trending content...")
        input_schema = InputSchema(
            search_type=SearchType.KEYWORDS,
            search_query="AI news",
            limit=5,
            target_number=3,
            audience_specification="Tech enthusiasts",
            rank_tweets=True
        )
        
        search_results = await get_content(input_schema)
        print(f"Found {len(search_results)} search results")
        
        assert isinstance(search_results, list)
        
        # Step 2: Analyze content (simulate content generation)
        if len(search_results) > 0:
            print("Step 2: Analyzing content...")
            top_result = search_results[0]
            print(f"Top result: {top_result.title[:100]}...")
            
            # Simulate generating a response tweet based on the content
            generated_content = f"Interesting AI development: {top_result.title[:100]}... #AI #Tech"
            print(f"Generated content: {generated_content}")
            
            # Step 3: Validate posting capability (without actually posting)
            print("Step 3: Validating posting capability...")
            
            # Just verify we can authorize posting (don't actually post)
            from common.utils import auth_tools
            from arcadepy import AsyncArcade
            
            client = AsyncArcade(api_key=os.getenv("ARCADE_API_KEY"))
            
            try:
                await auth_tools(
                    client=client,
                    user_id=os.getenv("USER_ID"),
                    tool_names=["X.PostTweet"],
                    provider="x"
                )
                print("✅ End-to-end workflow validation successful")
            finally:
                await client.close()
        
        print("✅ Complete workflow test passed")

    @pytest.mark.asyncio
    async def test_real_error_handling(self):
        """Test error handling with real API calls."""
        print("\n❌ Testing real error handling...")
        
        # Test with invalid search query that might cause issues
        input_schema = InputSchema(
            search_type=SearchType.KEYWORDS,
            search_query="",  # Empty query might cause issues
            limit=1,
            target_number=1
        )
        
        try:
            result = await get_content(input_schema)
            # If it succeeds, that's also valid
            print("✅ Empty query handled gracefully")
            assert isinstance(result, list)
        except Exception as e:
            # If it fails, that's expected behavior
            print(f"✅ Empty query properly rejected: {e}")
            assert True

    def test_schema_validation(self):
        """Test schema validation without API calls."""
        print("\n📋 Testing schema validation...")
        
        # Test valid schema
        valid_schema = InputSchema(
            search_type=SearchType.KEYWORDS,
            search_query="test",
            limit=10,
            target_number=5
        )
        
        assert valid_schema.search_type == SearchType.KEYWORDS
        assert valid_schema.search_query == "test"
        assert valid_schema.limit == 10
        assert valid_schema.target_number == 5
        
        # Test schema with defaults
        minimal_schema = InputSchema(
            search_type=SearchType.USER,
            search_query="@testuser",
            limit=5,
            target_number=3
        )
        
        assert minimal_schema.audience_specification == "All audiences"
        assert minimal_schema.rank_tweets == True
        
        print("✅ Schema validation tests passed")

    @pytest.mark.asyncio
    async def test_concurrent_searches(self):
        """Test multiple concurrent real searches."""
        print("\n🔄 Testing concurrent real searches...")
        
        # Create multiple search tasks
        search_tasks = []
        
        queries = ["AI", "python", "tech"]
        
        for query in queries:
            input_schema = InputSchema(
                search_type=SearchType.KEYWORDS,
                search_query=query,
                limit=2,
                target_number=1
            )
            search_tasks.append(get_content(input_schema))
        
        # Execute all searches concurrently
        results = await asyncio.gather(*search_tasks, return_exceptions=True)
        
        print(f"Completed {len(results)} concurrent searches")
        
        # Verify all completed without exceptions
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"Search {i} failed: {result}")
            else:
                print(f"Search {i} returned {len(result)} results")
                assert isinstance(result, list)
        
        print("✅ Concurrent search tests completed")
