#!/usr/bin/env python3
"""
Setup script for the Stream Agent API.
"""
import os
import sys
from pathlib import Path

def create_env_file():
    """Create .env file if it doesn't exist."""
    env_file = Path(".env")
    if env_file.exists():
        print("✓ .env file already exists")
        return

    print("Creating .env file...")
    env_content = """# Required environment variables

# User ID for authentication
USER_ID=your_user_id_here

# LLM Provider (openai, anthropic, etc.)
LLM_PROVIDER=openai

# LLM Model to use
LLM_MODEL=gpt-4o-2024-08-06

# OpenAI API Key (if using OpenAI)
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic API Key (if using Anthropic)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
"""

    with open(env_file, 'w') as f:
        f.write(env_content)

    print(f"✓ Created {env_file}")
    print("Please edit the .env file with your actual values before running the API.")

def check_dependencies():
    """Check if required dependencies are installed."""
    try:
        import fastapi
        import uvicorn
        import pydantic
        print("✓ All required dependencies are installed")
        return True
    except ImportError as e:
        print(f"✗ Missing dependency: {e}")
        print("Please run: pip install -e .")
        return False

def main():
    print("🚀 Setting up Stream Agent API")
    print("=" * 40)

    # Check dependencies
    if not check_dependencies():
        sys.exit(1)

    # Create .env file
    create_env_file()

    print("\n🎉 Setup complete!")
    print("Next steps:")
    print("1. Edit the .env file with your API keys and user ID")
    print("2. Run the API with: python api/run.py")
    print("3. Access the API docs at: http://localhost:8000/docs")

if __name__ == "__main__":
    main()