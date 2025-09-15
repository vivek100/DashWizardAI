"""Configuration management for the dashboard agent."""

import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Configuration settings for the dashboard agent."""
    
    # OpenAI Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # LangSmith Configuration  
    LANGCHAIN_TRACING_V2: str = os.getenv("LANGCHAIN_TRACING_V2", "false")
    LANGCHAIN_API_KEY: str = os.getenv("LANGCHAIN_API_KEY", "")
    LANGCHAIN_PROJECT: str = os.getenv("LANGCHAIN_PROJECT", "dashboard-agent")
    
    # Database Configuration
    DUCKDB_PATH: str = os.getenv("DUCKDB_PATH", "./data/dashboard.db")  # Always use project root data dir
    
    # Agent Configuration
    AGENT_MODEL: str = os.getenv("AGENT_MODEL", "gpt-4.1-mini")
    AGENT_BIG_MODEL: str = os.getenv("AGENT_BIG_MODEL", "gpt-4.1-mini")
    AGENT_SMALL_MODEL: str = os.getenv("AGENT_SMALL_MODEL", "gpt-4o-mini")
    AGENT_TEMPERATURE: float = float(os.getenv("AGENT_TEMPERATURE", "0.1"))
    
    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "localhost")
    API_PORT: int = int(os.getenv("API_PORT", "2024"))
    
    @classmethod
    def validate(cls) -> bool:
        """Validate that required configuration is present."""
        if not cls.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required")
        return True

# Global config instance
config = Config() 