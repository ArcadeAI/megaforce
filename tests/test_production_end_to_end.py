#!/usr/bin/env python3
"""
Megaforce Production End-to-End Test
Tests the complete social media automation pipeline on the live Heroku deployment
URL: https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Production API URL
BASE_URL = "https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com"

class MegaforceProductionTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.headers = {}
        self.test_user = {
            "username": "e2e_test_user",
            "email": "e2e_test@megaforce.com",
            "password": "TestPassword123!"
        }
        self.created_resources = {
            "personas": [],
            "style_references": [],
            "outputs": []
        }
    
    def log(self, message: str, level: str = "INFO"):
        """Log test progress with timestamp"""
        timestamp = datetime.now().strftime('%H:%M:%S')
        print(f"[{timestamp}] {level}: {message}")
    
    def setup_authentication(self) -> bool:
        """Register user and get authentication token"""
        self.log("🔐 Setting up authentication...")
        
        # Try to register user (might already exist)
        try:
            response = requests.post(f"{self.base_url}/api/v1/auth/register", json=self.test_user)
            if response.status_code == 200:
                self.log("✅ User registered successfully")
            elif response.status_code == 400:
                self.log("ℹ️  User already exists, proceeding with login")
            else:
                self.log(f"❌ Registration failed: {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Registration error: {str(e)}", "ERROR")
            return False
        
        # Login to get token
        try:
            login_response = requests.post(f"{self.base_url}/api/v1/auth/login", json={
                "username": self.test_user["username"],
                "password": self.test_user["password"]
            })
            
            if login_response.status_code == 200:
                token_data = login_response.json()
                self.token = token_data["access_token"]
                self.headers = {"Authorization": f"Bearer {self.token}"}
                self.log("✅ Authentication successful")
                return True
            else:
                self.log(f"❌ Login failed: {login_response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Login error: {str(e)}", "ERROR")
            return False
    
    def test_health_check(self) -> bool:
        """Test API health endpoint"""
        self.log("🏥 Testing health check...")
        
        try:
            response = requests.get(f"{self.base_url}/health")
            if response.status_code == 200:
                health_data = response.json()
                self.log(f"✅ API is healthy: {health_data['status']}")
                self.log(f"📊 Database: {health_data.get('database', 'unknown')}")
                return True
            else:
                self.log(f"❌ Health check failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Health check error: {str(e)}", "ERROR")
            return False
    
    def create_test_persona(self) -> Optional[Dict[str, Any]]:
        """Create a test persona for style transformation"""
        self.log("👤 Creating test persona...")
        
        persona_data = {
            "name": "Tech Influencer Bot",
            "description": "Enthusiastic tech content creator with casual, engaging style",
            "style_preferences": {
                "tone": "enthusiastic",
                "formality_level": 0.3,
                "use_emojis": True,
                "hashtag_frequency": "moderate"
            }
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/v1/personas/",
                json=persona_data,
                headers=self.headers
            )
            
            if response.status_code == 200:
                persona = response.json()
                self.created_resources["personas"].append(persona["id"])
                self.log(f"✅ Persona created: {persona['name']}")
                return persona
            else:
                self.log(f"❌ Persona creation failed: {response.text}", "ERROR")
                return None
        except Exception as e:
            self.log(f"❌ Persona creation error: {str(e)}", "ERROR")
            return None
    
    def test_style_transformation(self) -> Optional[Dict[str, Any]]:
        """Test content style transformation"""
        self.log("🎨 Testing style transformation...")
        
        transform_request = {
            "content": "New AI research shows 90% accuracy improvement with 50% less compute. This could revolutionize edge AI deployment.",
            "style_description": "Enthusiastic tech influencer style with emojis and engaging tone",
            "output_format": "tweet",
            "llm_provider": "openai",
            "temperature": 0.7
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/v1/style/transform",
                json=transform_request,
                headers=self.headers
            )
            
            if response.status_code == 200:
                result = response.json()
                self.log("✅ Style transformation successful")
                if result and result.get('transformed_content'):
                    self.log(f"📝 Transformed content: {result['transformed_content'][:100]}...")
                else:
                    self.log("⚠️ Style transformation returned empty content")
                return result
            else:
                self.log(f"❌ Style transformation failed: {response.text}", "ERROR")
                return None
        except Exception as e:
            self.log(f"❌ Style transformation error: {str(e)}", "ERROR")
            return None
    
    def test_twitter_search(self) -> Optional[Dict[str, Any]]:
        """Test Twitter search functionality"""
        self.log("🐦 Testing Twitter search...")
        
        # Note: This requires Arcade credentials to be set in Heroku
        search_request = {
            "search_query": "AI breakthrough",
            "limit": 3,
            "search_type": "keywords"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/v1/twitter/search",
                json=search_request,
                headers=self.headers
            )
            
            if response.status_code == 200:
                result = response.json()
                self.log(f"✅ Twitter search successful: {len(result.get('tweets', []))} tweets found")
                return result
            else:
                self.log(f"⚠️  Twitter search failed (may need Arcade credentials): {response.status_code}", "WARN")
                return None
        except Exception as e:
            self.log(f"⚠️  Twitter search error: {str(e)}", "WARN")
            return None
    
    def test_output_creation_and_approval(self, persona_id: str) -> bool:
        """Test output creation and approval workflow"""
        self.log("📤 Testing output creation and approval workflow...")
        
        # Create an output with correct schema fields
        output_data = {
            "content_type": "twitter_thread",
            "generated_content": "🚀 BREAKING: New AI breakthrough achieves 90% accuracy with 50% less compute! This could revolutionize edge AI deployment. The future is here! #AI #TechBreakthrough #Innovation",
            "persona_id": persona_id,
            "source_document_id": None,
            "publish_config": {"platform": "twitter", "scheduled_time": None}
        }
        
        try:
            # Create output
            response = requests.post(
                f"{self.base_url}/api/v1/outputs/",
                json=output_data,
                headers=self.headers
            )
            
            if response.status_code == 200:
                output = response.json()
                output_id = output["id"]
                self.created_resources["outputs"].append(output_id)
                self.log(f"✅ Output created: ID {output_id}")
                
                # Test approval
                approval_response = requests.post(
                    f"{self.base_url}/api/v1/outputs/{output_id}/approve",
                    json={"score": 8, "feedback": "Great content, engaging and informative!"},
                    headers=self.headers
                )
                
                if approval_response.status_code == 200:
                    self.log("✅ Output approved successfully")
                    return True
                else:
                    self.log(f"❌ Output approval failed: {approval_response.text}", "ERROR")
                    return False
            else:
                self.log(f"❌ Output creation failed: {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Output workflow error: {str(e)}", "ERROR")
            return False
    
    def cleanup_resources(self):
        """Clean up created test resources"""
        self.log("🧹 Cleaning up test resources...")
        
        # Clean up outputs
        for output_id in self.created_resources["outputs"]:
            try:
                requests.delete(f"{self.base_url}/api/v1/outputs/{output_id}", headers=self.headers)
            except:
                pass
        
        # Clean up personas
        for persona_id in self.created_resources["personas"]:
            try:
                requests.delete(f"{self.base_url}/api/v1/personas/{persona_id}", headers=self.headers)
            except:
                pass
        
        self.log("✅ Cleanup completed")
    
    def run_full_test_suite(self) -> Dict[str, bool]:
        """Run the complete end-to-end test suite"""
        self.log("🚀 STARTING MEGAFORCE PRODUCTION END-TO-END TESTS")
        self.log("=" * 60)
        self.log(f"🌐 Testing API at: {self.base_url}")
        self.log(f"📚 API docs: {self.base_url}/docs")
        self.log("")
        
        results = {}
        
        try:
            # Test 1: Health Check
            results["health_check"] = self.test_health_check()
            
            # Test 2: Authentication
            results["authentication"] = self.setup_authentication()
            if not results["authentication"]:
                self.log("❌ Authentication failed, skipping remaining tests", "ERROR")
                return results
            
            # Test 3: Persona Creation
            persona = self.create_test_persona()
            results["persona_creation"] = persona is not None
            
            # Test 4: Style Transformation
            results["style_transformation"] = self.test_style_transformation() is not None
            
            # Test 5: Twitter Search (may fail without Arcade credentials)
            results["twitter_search"] = self.test_twitter_search() is not None
            
            # Test 6: Output Creation and Approval
            persona_id = persona["id"] if persona else None
            results["output_workflow"] = self.test_output_creation_and_approval(persona_id) if persona_id else False
            
        except Exception as e:
            self.log(f"❌ Test suite error: {str(e)}", "ERROR")
        finally:
            # Always cleanup
            self.cleanup_resources()
        
        # Print results summary
        self.log("")
        self.log("📊 TEST RESULTS SUMMARY")
        self.log("=" * 30)
        
        passed = 0
        total = len(results)
        
        for test_name, passed_test in results.items():
            status = "✅ PASS" if passed_test else "❌ FAIL"
            self.log(f"{test_name.replace('_', ' ').title()}: {status}")
            if passed_test:
                passed += 1
        
        self.log("")
        self.log(f"🎯 Overall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED! Your API is production-ready!")
        else:
            self.log("⚠️  Some tests failed. Check logs above for details.")
        
        return results

def main():
    """Run the production end-to-end tests"""
    tester = MegaforceProductionTester()
    results = tester.run_full_test_suite()
    
    # Exit with appropriate code
    all_passed = all(results.values())
    exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
