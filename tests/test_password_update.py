"""
Tests for password update functionality.
Real integration tests using actual FastAPI application and database.
"""

import pytest
import requests
import json

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_USER = {
    "username": "test_password_user",
    "email": "test_password@example.com", 
    "password": "originalpassword123"
}

class TestPasswordUpdate:
    """Test suite for password update functionality."""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Setup authentication for all tests."""
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
    
    def teardown_method(self):
        """Clean up test user after each test."""
        try:
            requests.delete(f"{BASE_URL}/api/v1/auth/delete-user/{TEST_USER['username']}")
        except:
            pass
    
    def test_update_password_success(self):
        """Test successful password update."""
        new_password = "newpassword456"
        
        password_data = {
            "current_password": TEST_USER["password"],
            "new_password": new_password
        }
        
        response = requests.put(f"{BASE_URL}/api/v1/auth/update-password", 
                              json=password_data, headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Password updated successfully"
        
        # Verify we can login with new password
        login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", data={
            "username": TEST_USER["username"],
            "password": new_password
        })
        assert login_response.status_code == 200
        
        # Verify we cannot login with old password
        old_login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", data={
            "username": TEST_USER["username"],
            "password": TEST_USER["password"]
        })
        assert old_login_response.status_code == 401
    
    def test_update_password_wrong_current_password(self):
        """Test password update with incorrect current password."""
        password_data = {
            "current_password": "wrongpassword",
            "new_password": "newpassword456"
        }
        
        response = requests.put(f"{BASE_URL}/api/v1/auth/update-password", 
                              json=password_data, headers=self.headers)
        
        assert response.status_code == 400
        data = response.json()
        assert data["detail"] == "Current password is incorrect"
        
        # Verify original password still works
        login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", data={
            "username": TEST_USER["username"],
            "password": TEST_USER["password"]
        })
        assert login_response.status_code == 200
    
    def test_update_password_too_short(self):
        """Test password update with password that's too short."""
        password_data = {
            "current_password": TEST_USER["password"],
            "new_password": "short"  # Less than 8 characters
        }
        
        response = requests.put(f"{BASE_URL}/api/v1/auth/update-password", 
                              json=password_data, headers=self.headers)
        
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data
        # Should contain validation error about minimum length
    
    def test_update_password_unauthorized(self):
        """Test password update without authentication."""
        password_data = {
            "current_password": "somepassword",
            "new_password": "newpassword456"
        }
        
        response = requests.put(f"{BASE_URL}/api/v1/auth/update-password", 
                              json=password_data)
        
        assert response.status_code == 401
    
    def test_update_password_same_as_current(self):
        """Test updating password to the same password."""
        password_data = {
            "current_password": TEST_USER["password"],
            "new_password": TEST_USER["password"]  # Same as current
        }
        
        response = requests.put(f"{BASE_URL}/api/v1/auth/update-password", 
                              json=password_data, headers=self.headers)
        
        # Should still work (no restriction against same password)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Password updated successfully"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
