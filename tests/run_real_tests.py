#!/usr/bin/env python3

import subprocess
import sys
import os
from pathlib import Path

def run_real_tests():
    """Run the real integration test suite for Megaforce project."""
    
    print("🚀 Running Megaforce REAL Integration Test Suite...")
    print("=" * 60)
    print("⚠️  These tests use actual Arcade API calls - NO MOCKING")
    print("=" * 60)
    
    # Ensure we're in the project root
    project_root = Path(__file__).parent.parent
    os.chdir(project_root)
    
    # Check environment variables
    has_credentials = bool(os.getenv("ARCADE_API_KEY") and os.getenv("USER_ID"))
    
    if has_credentials:
        print("✅ Arcade API credentials found")
        print(f"🆔 User ID: {os.getenv('USER_ID')}")
        print(f"🔑 API Key: {os.getenv('ARCADE_API_KEY')[:20]}...")
    else:
        print("⚠️  No Arcade API credentials found")
        print("   Some tests will be skipped")
        print("   Set ARCADE_API_KEY and USER_ID to run full test suite")
    
    # Test categories to run
    test_files = [
        ("Real Integration Tests", "tests/test_real_integration.py"),
        ("Real API Tests", "tests/test_real_api.py"),
        ("Schema Validation Tests", "tests/test_parser_agent.py"),
        ("Style Agent Tests", "tests/test_style_agent.py"),
    ]
    
    results = {}
    
    for category, test_file in test_files:
        print(f"\n📋 Running {category}...")
        print("-" * 40)
        
        try:
            # Run specific test file with verbose output
            result = subprocess.run([
                "uv", "run", "pytest", 
                test_file,
                "-v",
                "-s",  # Don't capture output so we can see real-time results
                "--tb=short"
            ], cwd=project_root)
            
            if result.returncode == 0:
                print(f"✅ {category} - PASSED")
                results[category] = "PASSED"
            else:
                print(f"❌ {category} - FAILED")
                results[category] = "FAILED"
                
        except Exception as e:
            print(f"❌ {category} - ERROR: {e}")
            results[category] = "ERROR"
    
    # Summary
    print("\n" + "=" * 60)
    print("🎯 REAL TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for status in results.values() if status == "PASSED")
    failed = sum(1 for status in results.values() if status == "FAILED")
    errors = sum(1 for status in results.values() if status == "ERROR")
    
    for category, status in results.items():
        icon = "✅" if status == "PASSED" else "❌"
        print(f"{icon} {category}: {status}")
    
    print(f"\n📊 Results: {passed} passed, {failed} failed, {errors} errors")
    
    if has_credentials:
        if failed == 0 and errors == 0:
            print("🎉 All real tests passed! Your Megaforce system is working correctly with Arcade API.")
        else:
            print("⚠️ Some real tests failed. Check the output above for details.")
    else:
        print("ℹ️  Limited testing completed due to missing credentials.")
        print("   Set ARCADE_API_KEY and USER_ID environment variables for full testing.")
    
    return failed == 0 and errors == 0

def run_posting_tests():
    """Run posting tests with explicit confirmation."""
    
    print("⚠️  WARNING: POSTING TESTS")
    print("=" * 40)
    print("The posting tests will create REAL tweets on your X account!")
    print("These tweets will be automatically deleted, but they will be visible briefly.")
    print("")
    
    confirm = input("Do you want to run posting tests? (yes/no): ").strip().lower()
    
    if confirm in ['yes', 'y']:
        print("🚀 Running posting tests with ENABLE_REAL_POSTING_TESTS=1...")
        
        # Set environment variable and run posting tests
        env = os.environ.copy()
        env["ENABLE_REAL_POSTING_TESTS"] = "1"
        
        result = subprocess.run([
            "uv", "run", "pytest", 
            "tests/test_real_integration.py::TestRealIntegration::test_real_posting_workflow",
            "-v", "-s"
        ], env=env)
        
        if result.returncode == 0:
            print("✅ Posting tests completed successfully")
        else:
            print("❌ Posting tests failed")
    else:
        print("⏭️  Posting tests skipped")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--posting":
        run_posting_tests()
    else:
        success = run_real_tests()
        
        print("\n" + "=" * 60)
        print("🔧 ADDITIONAL TEST OPTIONS")
        print("=" * 60)
        print("To run posting tests (creates real tweets):")
        print("  python tests/run_real_tests.py --posting")
        print("")
        print("To run specific tests:")
        print("  uv run pytest tests/test_real_integration.py -v")
        print("  uv run pytest tests/test_real_api.py -v")
        
        sys.exit(0 if success else 1)
