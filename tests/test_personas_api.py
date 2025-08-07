"""
Tests for Persona CRUD API endpoints.
Real integration tests using actual FastAPI application and database.
"""

import pytest
import requests
import json
from typing import Dict, Any

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_USER = {
    "username": "test_persona_user",
    "email": "test_persona@example.com", 
    "password": "testpassword123"
}

class TestPersonasAPI:
    """Test suite for Persona CRUD endpoints."""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Setup authentication for all tests."""
        # Initialize created_personas list
        self.created_personas = []
        
        # Register test user
        try:
            requests.post(f"{BASE_URL}/api/v1/auth/register", json=TEST_USER)
        except:
            pass  # User might already exist
        
        # Login and get token
        login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
            "username": TEST_USER["username"],
            "password": TEST_USER["password"]
        })
        assert login_response.status_code == 200
        
        token_data = login_response.json()
        self.token = token_data["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def teardown_method(self):
        """Clean up created personas after each test."""
        for persona_id in self.created_personas:
            try:
                requests.delete(f"{BASE_URL}/api/v1/personas/{persona_id}", headers=self.headers)
            except:
                pass
    
    def test_create_persona(self):
        """Test creating a new persona."""
        persona_data = {
            "name": "Tech Expert",
            "description": "Professional technology commentator and analyst",
            "style_preferences": {
                "tone": "professional",
                "voice": "authoritative",
                "topics": ["AI", "technology", "innovation"],
                "personality_traits": ["analytical", "informative"]
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/personas/", 
                               json=persona_data, headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["name"] == persona_data["name"]
        assert data["description"] == persona_data["description"]
        assert data["style_preferences"] == persona_data["style_preferences"]
        assert data["is_active"] == True
        assert "created_at" in data
        assert "updated_at" in data
        
        # Store for cleanup
        self.created_personas.append(data["id"])
        
        return data["id"]
    
    def test_list_personas(self):
        """Test listing all personas for the user."""
        # Create a test persona first
        persona_id = self.test_create_persona()
        
        response = requests.get(f"{BASE_URL}/api/v1/personas/", headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Should be a list
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Find our created persona
        created_persona = next((p for p in data if p["id"] == persona_id), None)
        assert created_persona is not None
        assert created_persona["name"] == "Tech Expert"
    
    def test_get_persona(self):
        """Test getting a specific persona."""
        # Create a test persona first
        persona_id = self.test_create_persona()
        
        response = requests.get(f"{BASE_URL}/api/v1/personas/{persona_id}", headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == persona_id
        assert data["name"] == "Tech Expert"
        assert data["description"] == "Professional technology commentator and analyst"
    
    def test_update_persona(self):
        """Test updating a persona."""
        # Create a test persona first
        persona_id = self.test_create_persona()
        
        update_data = {
            "name": "Senior Tech Expert",
            "description": "Senior technology analyst with 10+ years experience",
            "style_preferences": {
                "tone": "expert",
                "voice": "confident",
                "topics": ["AI", "machine learning", "enterprise tech"],
                "personality_traits": ["experienced", "insightful"]
            }
        }
        
        response = requests.put(f"{BASE_URL}/api/v1/personas/{persona_id}", 
                              json=update_data, headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == persona_id
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]
        assert data["style_preferences"] == update_data["style_preferences"]
    
    def test_delete_persona(self):
        """Test deleting a persona."""
        # Create a test persona first
        persona_id = self.test_create_persona()
        
        # Delete the persona
        response = requests.delete(f"{BASE_URL}/api/v1/personas/{persona_id}", headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Persona deleted successfully"
        
        # Verify it's deleted
        get_response = requests.get(f"{BASE_URL}/api/v1/personas/{persona_id}", headers=self.headers)
        assert get_response.status_code == 404
        
        # Remove from cleanup list since it's already deleted
        if persona_id in self.created_personas:
            self.created_personas.remove(persona_id)
    
    def test_persona_not_found(self):
        """Test getting a non-existent persona."""
        fake_id = "non-existent-persona-id"
        
        response = requests.get(f"{BASE_URL}/api/v1/personas/{fake_id}", headers=self.headers)
        
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Persona not found"
    
    def test_unauthorized_access(self):
        """Test accessing personas without authentication."""
        response = requests.get(f"{BASE_URL}/api/v1/personas/")
        
        assert response.status_code == 403

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
