"""
Tests for StyleReference CRUD API endpoints.
Real integration tests using actual FastAPI application and database.
"""

import pytest
import requests
import json
from typing import Dict, Any

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_USER = {
    "username": "test_style_ref_user",
    "email": "test_style_ref@example.com", 
    "password": "testpassword123"
}

class TestStyleReferencesAPI:
    """Test suite for StyleReference CRUD endpoints."""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Setup authentication and test persona for all tests."""
        # Register test user
        try:
            requests.post(f"{BASE_URL}/api/v1/auth/register", json=TEST_USER)
        except:
            pass  # User might already exist
        
        # Login and get token
        login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", data={
            "username": TEST_USER["username"],
            "password": TEST_USER["password"]
        })
        assert login_response.status_code == 200
        
        token_data = login_response.json()
        self.token = token_data["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Create a test persona for style references
        persona_data = {
            "name": "Test Style Persona",
            "description": "Persona for testing style references",
            "style_preferences": {"tone": "casual"}
        }
        
        persona_response = requests.post(f"{BASE_URL}/api/v1/personas/", 
                                       json=persona_data, headers=self.headers)
        assert persona_response.status_code == 200
        self.test_persona_id = persona_response.json()["id"]
        
        # Store created style reference IDs for cleanup
        self.created_style_references = []
    
    def teardown_method(self):
        """Clean up created style references and persona after each test."""
        # Clean up style references
        for style_ref_id in self.created_style_references:
            try:
                requests.delete(f"{BASE_URL}/api/v1/style-references/{style_ref_id}", headers=self.headers)
            except:
                pass
        
        # Clean up test persona
        try:
            requests.delete(f"{BASE_URL}/api/v1/personas/{self.test_persona_id}", headers=self.headers)
        except:
            pass
    
    def test_create_style_reference_url(self):
        """Test creating a style reference with URL."""
        style_ref_data = {
            "reference_type": "url",
            "content_url": "https://example.com/blog-post",
            "meta_data": {
                "title": "Example Blog Post",
                "author": "Tech Writer",
                "date": "2024-01-15"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/style-references/", 
                               json=style_ref_data, 
                               params={"persona_id": self.test_persona_id},
                               headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["persona_id"] == self.test_persona_id
        assert data["reference_type"] == "url"
        assert data["content_url"] == "https://example.com/blog-post"
        assert data["meta_data"] == style_ref_data["meta_data"]
        assert "created_at" in data
        
        # Store for cleanup
        self.created_style_references.append(data["id"])
        
        return data["id"]
    
    def test_create_style_reference_text(self):
        """Test creating a style reference with direct text content."""
        style_ref_data = {
            "reference_type": "markdown",
            "content_text": "# AI Revolution\n\nArtificial intelligence is transforming how we work and live. The key is to embrace these changes while maintaining human creativity and empathy.",
            "meta_data": {
                "source": "personal_writing",
                "topic": "AI"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/style-references/", 
                               json=style_ref_data, 
                               params={"persona_id": self.test_persona_id},
                               headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["reference_type"] == "markdown"
        assert data["content_text"] == style_ref_data["content_text"]
        assert data["content_url"] is None
        
        self.created_style_references.append(data["id"])
        return data["id"]
    
    def test_create_style_reference_tweet(self):
        """Test creating a style reference for a tweet."""
        style_ref_data = {
            "reference_type": "tweet",
            "content_url": "https://x.com/user/status/1234567890",
            "content_text": "Just shipped a new AI feature! The future is here and it's incredibly exciting. Can't wait to see what developers build with this. 🚀 #AI #Innovation",
            "meta_data": {
                "platform": "twitter",
                "engagement": {"likes": 150, "retweets": 45},
                "hashtags": ["AI", "Innovation"]
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/style-references/", 
                               json=style_ref_data, 
                               params={"persona_id": self.test_persona_id},
                               headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["reference_type"] == "tweet"
        assert data["content_url"] == style_ref_data["content_url"]
        assert data["content_text"] == style_ref_data["content_text"]
        
        self.created_style_references.append(data["id"])
        return data["id"]
    
    def test_list_style_references(self):
        """Test listing all style references."""
        # Create multiple style references
        url_ref_id = self.test_create_style_reference_url()
        text_ref_id = self.test_create_style_reference_text()
        
        response = requests.get(f"{BASE_URL}/api/v1/style-references/", headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Should be a list with at least our created references
        assert isinstance(data, list)
        assert len(data) >= 2
        
        # Find our created references
        ref_ids = [ref["id"] for ref in data]
        assert url_ref_id in ref_ids
        assert text_ref_id in ref_ids
    
    def test_list_style_references_for_persona(self):
        """Test listing style references for a specific persona."""
        # Create style references
        ref_id = self.test_create_style_reference_url()
        
        response = requests.get(f"{BASE_URL}/api/v1/style-references/persona/{self.test_persona_id}", 
                              headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Should be a list
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # All references should belong to our test persona
        for ref in data:
            assert ref["persona_id"] == self.test_persona_id
    
    def test_get_style_reference(self):
        """Test getting a specific style reference."""
        # Create a test style reference first
        ref_id = self.test_create_style_reference_url()
        
        response = requests.get(f"{BASE_URL}/api/v1/style-references/{ref_id}", headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == ref_id
        assert data["persona_id"] == self.test_persona_id
        assert data["reference_type"] == "url"
    
    def test_update_style_reference(self):
        """Test updating a style reference."""
        # Create a test style reference first
        ref_id = self.test_create_style_reference_url()
        
        update_data = {
            "reference_type": "url",
            "content_url": "https://updated-example.com/new-post",
            "meta_data": {
                "title": "Updated Blog Post",
                "author": "Senior Tech Writer",
                "date": "2024-02-15",
                "updated": True
            }
        }
        
        response = requests.put(f"{BASE_URL}/api/v1/style-references/{ref_id}", 
                              json=update_data, headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == ref_id
        assert data["content_url"] == update_data["content_url"]
        assert data["meta_data"] == update_data["meta_data"]
    
    def test_delete_style_reference(self):
        """Test deleting a style reference."""
        # Create a test style reference first
        ref_id = self.test_create_style_reference_url()
        
        # Delete the style reference
        response = requests.delete(f"{BASE_URL}/api/v1/style-references/{ref_id}", headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Style reference deleted successfully"
        
        # Verify it's deleted
        get_response = requests.get(f"{BASE_URL}/api/v1/style-references/{ref_id}", headers=self.headers)
        assert get_response.status_code == 404
        
        # Remove from cleanup list since it's already deleted
        if ref_id in self.created_style_references:
            self.created_style_references.remove(ref_id)
    
    def test_style_reference_not_found(self):
        """Test getting a non-existent style reference."""
        fake_id = "non-existent-style-ref-id"
        
        response = requests.get(f"{BASE_URL}/api/v1/style-references/{fake_id}", headers=self.headers)
        
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Style reference not found"
    
    def test_create_style_reference_invalid_persona(self):
        """Test creating a style reference with invalid persona ID."""
        style_ref_data = {
            "reference_type": "url",
            "content_url": "https://example.com/blog-post"
        }
        
        fake_persona_id = "non-existent-persona-id"
        
        response = requests.post(f"{BASE_URL}/api/v1/style-references/", 
                               json=style_ref_data, 
                               params={"persona_id": fake_persona_id},
                               headers=self.headers)
        
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Persona not found"
    
    def test_unauthorized_access(self):
        """Test accessing style references without authentication."""
        response = requests.get(f"{BASE_URL}/api/v1/style-references/")
        
        assert response.status_code == 401

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
