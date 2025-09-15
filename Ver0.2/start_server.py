#!/usr/bin/env python3
"""Start the LangGraph server for the dashboard agent.

This script provides an easy way to start the server with proper configuration.
"""

import os
import sys
import subprocess
from pathlib import Path

def check_requirements():
    """Check if all requirements are met."""
    print("🔍 Checking requirements...")
    
    # Check if .env exists
    if not Path(".env").exists():
        print("❌ .env file not found!")
        print("Please copy .env.template to .env and add your API keys")
        return False
    
    # Check if langgraph is installed
    try:
        import langgraph
        print("✅ LangGraph installed")
    except ImportError:
        print("❌ LangGraph not installed!")
        print("Run: pip install -r requirements.txt")
        return False
    
    # Check if data directory exists
    data_dir = Path("data")
    if not data_dir.exists():
        print("📁 Creating data directory...")
        data_dir.mkdir(exist_ok=True)
    
    print("✅ All requirements met")
    return True


def start_server():
    """Start the LangGraph server."""
    if not check_requirements():
        sys.exit(1)
    
    print("\n🚀 Starting LangGraph server...")
    print("=" * 50)
    print("Server will be available at: http://localhost:2024")
    print("API endpoint: http://localhost:2024/dashboard_agent/")
    print("Playground: http://localhost:2024/playground")
    print("=" * 50)
    print("\nPress Ctrl+C to stop the server")
    print()
    
    try:
        # Start the LangGraph server
        subprocess.run([
            "langgraph", "dev",
            "--host", "localhost",
            "--port", "2024",
            "--server-log-level", "DEBUG",
            "--allow-blocking"
        ], check=True)
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error starting server: {e}")
        print("\nTroubleshooting:")
        print("1. Check that your .env file has valid API keys")
        print("2. Ensure all dependencies are installed")
        print("3. Verify langgraph.json is properly configured")
    except FileNotFoundError:
        print("\n❌ LangGraph CLI not found!")
        print("Install with: pip install -r requirements.txt")


if __name__ == "__main__":
    start_server() 