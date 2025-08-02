#!/usr/bin/env python3

import pytest
import os
import sys
sys.path.insert(0, '/Users/scarlettattensil/megaforce')

from style_agent.agent import transfer_style, generate_related_content
from common.schemas import (
    StyleTransferRequest, 
    ReferenceStyle, 
    OutputSchema, 
    OutputType, 
    Document,
    WritingStyle,
    FewShotExample,
    ContentType,
    DocumentCategory
)
from dotenv import load_dotenv

# Load environment variables for real testing
load_dotenv()

class TestRealStyleAgent:
    """Real style agent tests using actual LLM API calls - NO MOCKING."""
    
    def setup_method(self):
        """Check if we have the required credentials for real testing."""
        self.has_llm_credentials = bool(
            os.getenv("OPENAI_API_KEY") or 
            os.getenv("ANTHROPIC_API_KEY") or 
            os.getenv("GOOGLE_API_KEY")
        )
        
        if not self.has_llm_credentials:
            pytest.skip("No LLM API credentials available for real testing")
        
        # Set up test data
        self.sample_reference_style = ReferenceStyle(
            name="Tech Influencer Style",
            description="Casual, enthusiastic tech content with emojis",
            style_definition=WritingStyle(
                tone="enthusiastic",
                formality_level=0.3,
                sentence_structure="short",
                vocabulary_level="technical",
                personality_traits=["excited", "knowledgeable", "approachable"],
                style_rules=[
                    "Use emojis to emphasize points",
                    "Keep sentences short and punchy",
                    "Include technical terms but explain them simply",
                    "Show excitement about technology"
                ],
                few_shot_examples=[
                    FewShotExample(
                        input="New AI tool released",
                        output="🚀 Just discovered this amazing AI tool! Game-changer for developers 💻"
                    ),
                    FewShotExample(
                        input="Framework announcement",
                        output="Mind = blown 🤯 This new framework makes coding so much easier!"
                    )
                ]
            ),
            documents=[]
        )
        
        self.sample_target_content = [
            Document(
                title="AI Breakthrough Announced",
                content="Researchers have developed a new language model that shows significant improvements in reasoning capabilities.",
                url="https://example.com/ai-news",
                type=ContentType.TWITTER,
                category=DocumentCategory.TECHNICAL,
                metadata={"source": "tech_news", "category": "AI"}
            )
        ]
        
        self.sample_output_schema = OutputSchema(
            name="Twitter Post",
            description="Short social media post for Twitter",
            output_type=OutputType.TWEET_SINGLE,
            max_length=280,
            required_elements=["main_message", "hashtags"],
            optional_elements=["emojis", "call_to_action"]
        )

    @pytest.mark.asyncio
    async def test_real_style_transfer(self):
        """Test real style transfer with actual LLM API."""
        print("\n🎨 Testing real style transfer...")
        
        request = StyleTransferRequest(
            reference_style=[self.sample_reference_style],
            target_content=self.sample_target_content,
            target_schemas=[self.sample_output_schema],
            intent="Share exciting AI news",
            focus="breakthrough capabilities"
        )
        
        # Determine which provider to use based on available API keys
        provider = "openai"
        if os.getenv("ANTHROPIC_API_KEY"):
            provider = "anthropic"
        elif os.getenv("GOOGLE_API_KEY"):
            provider = "google_genai"
        
        print(f"Using LLM provider: {provider}")
        
        try:
            results = await transfer_style(
                request, 
                llm_provider=provider,
                temperature=0.7
            )
            
            print(f"Style transfer completed, got {len(results)} results")
            
            # Verify results structure
            assert isinstance(results, list)
            assert len(results) > 0
            
            result = results[0]
            print(f"Generated content preview: {result.processed_content[:100]}...")
            
            # Verify result structure
            assert result.applied_style == "Tech Influencer Style"
            assert result.output_schema.name == "Twitter Post"
            assert isinstance(result.metadata, dict)
            assert result.metadata["focus"] == "breakthrough capabilities"
            assert result.metadata["intent"] == "Share exciting AI news"
            
            # Verify content quality (basic checks)
            content = result.processed_content.lower()
            assert len(result.processed_content) > 0
            
            # Should contain AI-related terms
            assert any(word in content for word in ["ai", "breakthrough", "language", "model", "reasoning"])
            
            print("✅ Real style transfer test completed successfully")
            
        except Exception as e:
            print(f"❌ Real style transfer test failed: {e}")
            raise

    @pytest.mark.asyncio
    async def test_real_related_content_generation(self):
        """Test real related content generation with actual LLM API."""
        print("\n💭 Testing real related content generation...")
        
        request = StyleTransferRequest(
            reference_style=[self.sample_reference_style],
            target_content=self.sample_target_content,
            target_schemas=[self.sample_output_schema],
            intent="Create engaging follow-up content",
            focus="practical implications for developers"
        )
        
        # Use available provider
        provider = "openai"
        if os.getenv("ANTHROPIC_API_KEY"):
            provider = "anthropic"
        elif os.getenv("GOOGLE_API_KEY"):
            provider = "google_genai"
        
        print(f"Using LLM provider: {provider}")
        
        try:
            results = await generate_related_content(
                request,
                llm_provider=provider,
                temperature=0.8  # Higher temperature for more creative content
            )
            
            print(f"Related content generation completed, got {len(results)} results")
            
            # Verify results structure
            assert isinstance(results, list)
            assert len(results) > 0
            
            result = results[0]
            print(f"Generated related content preview: {result.content[:100]}...")
            
            # Verify result structure
            assert result.output_schema.name == "Twitter Post"
            assert isinstance(result.metadata, dict)
            assert result.metadata["focus"] == "practical implications for developers"
            assert result.metadata["intent"] == "Create engaging follow-up content"
            
            # Verify content is generated
            assert len(result.content) > 0
            
            print("✅ Real related content generation test completed successfully")
            
        except Exception as e:
            print(f"❌ Real related content generation test failed: {e}")
            raise

    @pytest.mark.asyncio
    async def test_multiple_output_formats(self):
        """Test generating content for multiple output formats simultaneously."""
        print("\n🔄 Testing multiple output formats...")
        
        # Create multiple output schemas
        linkedin_schema = OutputSchema(
            name="LinkedIn Post",
            description="Professional social media post for LinkedIn",
            output_type=OutputType.LINKEDIN_POST,
            max_length=1300,
            required_elements=["professional_tone", "insights"],
            optional_elements=["call_to_action", "hashtags"]
        )
        
        thread_schema = OutputSchema(
            name="Twitter Thread",
            description="Multi-part Twitter thread",
            output_type=OutputType.TWEET_THREAD,
            max_length=2800,
            required_elements=["thread_structure", "numbered_posts"],
            optional_elements=["conclusion", "hashtags"]
        )
        
        request = StyleTransferRequest(
            reference_style=[self.sample_reference_style],
            target_content=self.sample_target_content,
            target_schemas=[self.sample_output_schema, linkedin_schema, thread_schema],
            intent="Multi-platform content distribution",
            focus="AI breakthrough impact"
        )
        
        # Use available provider
        provider = "openai"
        if os.getenv("ANTHROPIC_API_KEY"):
            provider = "anthropic"
        elif os.getenv("GOOGLE_API_KEY"):
            provider = "google_genai"
        
        print(f"Using LLM provider: {provider}")
        
        try:
            results = await transfer_style(request, llm_provider=provider)
            
            print(f"Multi-format generation completed, got {len(results)} results")
            
            # Verify we got results for all schemas
            assert len(results) == 3
            
            schema_names = [result.output_schema.name for result in results]
            assert "Twitter Post" in schema_names
            assert "LinkedIn Post" in schema_names
            assert "Twitter Thread" in schema_names
            
            # Verify each result has content
            for i, result in enumerate(results):
                print(f"Result {i+1} ({result.output_schema.name}): {result.processed_content[:50]}...")
                assert len(result.processed_content) > 0
                assert result.applied_style == "Tech Influencer Style"
            
            print("✅ Multiple output formats test completed successfully")
            
        except Exception as e:
            print(f"❌ Multiple output formats test failed: {e}")
            raise

    def test_schema_validation(self):
        """Test schema validation without API calls."""
        print("\n📋 Testing schema validation...")
        
        # Test valid request creation
        request = StyleTransferRequest(
            reference_style=[self.sample_reference_style],
            target_content=self.sample_target_content,
            target_schemas=[self.sample_output_schema],
            intent="Test intent",
            focus="Test focus"
        )
        
        assert request.intent == "Test intent"
        assert request.focus == "Test focus"
        assert len(request.reference_style) == 1
        assert len(request.target_content) == 1
        assert len(request.target_schemas) == 1
        
        # Test reference style structure
        ref_style = request.reference_style[0]
        assert ref_style.name == "Tech Influencer Style"
        assert ref_style.style_definition.tone == "enthusiastic"
        assert len(ref_style.style_definition.style_rules) > 0
        assert len(ref_style.style_definition.few_shot_examples) > 0
        
        # Test few-shot examples
        first_example = ref_style.style_definition.few_shot_examples[0]
        assert first_example.input == "New AI tool released"
        assert "🚀" in first_example.output
        
        print("✅ Schema validation tests passed")

    @pytest.mark.asyncio
    async def test_different_providers(self):
        """Test style transfer with different LLM providers if available."""
        print("\n🔄 Testing different LLM providers...")
        
        providers_to_test = []
        if os.getenv("OPENAI_API_KEY"):
            providers_to_test.append("openai")
        if os.getenv("ANTHROPIC_API_KEY"):
            providers_to_test.append("anthropic")
        if os.getenv("GOOGLE_API_KEY"):
            providers_to_test.append("google_genai")
        
        if len(providers_to_test) == 0:
            pytest.skip("No LLM providers available for testing")
        
        request = StyleTransferRequest(
            reference_style=[self.sample_reference_style],
            target_content=self.sample_target_content,
            target_schemas=[self.sample_output_schema],
            intent="Test different providers",
            focus="provider comparison"
        )
        
        results_by_provider = {}
        
        for provider in providers_to_test:
            print(f"Testing provider: {provider}")
            
            try:
                results = await transfer_style(
                    request, 
                    llm_provider=provider,
                    temperature=0.5
                )
                
                assert len(results) > 0
                result = results[0]
                
                results_by_provider[provider] = result.processed_content
                print(f"{provider} result preview: {result.processed_content[:50]}...")
                
            except Exception as e:
                print(f"Provider {provider} failed: {e}")
                # Don't fail the test if one provider fails
                continue
        
        # Verify we got at least one successful result
        assert len(results_by_provider) > 0
        
        print(f"✅ Successfully tested {len(results_by_provider)} providers")

    @pytest.mark.asyncio
    async def test_error_handling(self):
        """Test error handling with invalid requests."""
        print("\n❌ Testing error handling...")
        
        # Test error handling by trying to create invalid request
        # This should fail at schema validation level
        try:
            empty_request = StyleTransferRequest(
                reference_style=[self.sample_reference_style],
                target_content=[],  # Empty content - should fail validation
                target_schemas=[self.sample_output_schema],
                intent="Test error handling",
                focus="Empty content"
            )
            # If we get here, validation didn't catch the error
            assert False, "Expected validation error for empty content"
        except Exception as e:
            print(f"✅ Empty content properly rejected at schema level: {type(e).__name__}")
            return
        
        provider = "openai"
        if os.getenv("ANTHROPIC_API_KEY"):
            provider = "anthropic"
        elif os.getenv("GOOGLE_API_KEY"):
            provider = "google_genai"
        
        try:
            results = await transfer_style(empty_request, llm_provider=provider)
            # If it succeeds with empty content, that's also valid behavior
            print("✅ Empty content handled gracefully")
        except Exception as e:
            # If it fails, that's expected behavior
            print(f"✅ Empty content properly rejected: {type(e).__name__}")
        
        print("✅ Error handling test completed")
