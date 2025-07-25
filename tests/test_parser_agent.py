#!/usr/bin/env python3

import pytest
import os
import sys
sys.path.insert(0, '/Users/scarlettattensil/megaforce')

from parser_agents.x.schemas import InputSchema, SearchType
from dotenv import load_dotenv

# Load environment variables for real testing
load_dotenv()

class TestSchemaValidation:
    """Test suite for schema validation - lightweight validation tests."""

    def test_input_schema_validation(self):
        """Test InputSchema validation."""
        # Valid schema
        schema = InputSchema(
            search_type=SearchType.KEYWORDS,
            search_query="test query",
            limit=10,
            target_number=5
        )
        assert schema.search_type == SearchType.KEYWORDS
        assert schema.search_query == "test query"
        assert schema.limit == 10
        assert schema.target_number == 5
        
        # Test default values
        assert schema.audience_specification == "All audiences"
        assert schema.rank_tweets == True

    def test_search_type_enum(self):
        """Test SearchType enum values."""
        assert SearchType.KEYWORDS.value == "keywords"
        assert SearchType.PHRASES.value == "phrases"
        assert SearchType.HASHTAG.value == "hashtag"
        assert SearchType.USER.value == "user"

    def test_schema_validation_errors(self):
        """Test schema validation with invalid data."""
        # Test invalid limit
        with pytest.raises(ValueError):
            InputSchema(
                search_type=SearchType.KEYWORDS,
                search_query="test",
                limit=-1,  # Invalid negative limit
                target_number=5
            )
        
        # Test empty search query
        with pytest.raises(ValueError):
            InputSchema(
                search_type=SearchType.KEYWORDS,
                search_query="",  # Empty query
                limit=10,
                target_number=5
            )
