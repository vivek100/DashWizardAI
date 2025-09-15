"""Dashboard Analysis ReAct Agent

Main agent implementation using LangGraph's create_react_agent function
for autonomous CSV analysis and reporting.
"""

import os
from typing import List, Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import Tool
from langchain_core.runnables import RunnableConfig

# Import all tools
from .tools.csv_tools import (
    get_table_names, 
    get_table_schema,
    get_table_sample
)
from .tools.analysis_tools import (
    execute_pandas_query,
    analyze_text_data
)
from .tools.report_tools import (
    generate_analysis_report
)

from .tools.visualization_tools import (
    render_widget,
    render_dashboard,
    render_upload_csv_dialog
)

from .config import config
from .prompts import get_system_prompt


def create_dashboard_agent():
    """Create and configure the dashboard analysis agent.
    
    Returns:
        Configured LangGraph ReAct agent for dashboard analysis
    """
    
    # Validate configuration
    config.validate()
    
    # Initialize the language model
    llm = ChatOpenAI(
        model=config.AGENT_MODEL,
        temperature=config.AGENT_TEMPERATURE,
        api_key=config.OPENAI_API_KEY
    )
    
    # Collect all analysis tools
    tools = [
        # Data Exploration Tools
        get_table_names,
        get_table_schema, 
        get_table_sample,
        
        # Analysis and Processing Tools
        execute_pandas_query,
        analyze_text_data,
        
        # Reporting Tools
        generate_analysis_report,

        # Visualization Tools
        render_widget,
        render_dashboard,
        render_upload_csv_dialog
    ]
    
    # Create the ReAct agent using LangGraph's built-in function
    agent = create_react_agent(
        model=llm,
        tools=tools,
        prompt=get_system_prompt
    )
    
    return agent


def get_agent_info() -> Dict[str, Any]:
    """Get information about the agent and its capabilities.
    
    Returns:
        Dictionary with agent metadata and capabilities
    """
    return {
        "name": "Dashboard Analysis Agent",
        "description": "Autonomous AI agent for data analysis and reporting with enhanced data processing capabilities",
        "version": "1.1.0",
        "model": config.AGENT_MODEL,
        "capabilities": [
            "Data table exploration and analysis",
            "Flexible statistical analysis with configurable output modes",
            "Advanced data pipeline creation and management",
            "Text sentiment and theme analysis", 
            "Automated report generation",
            "Multi-step data reasoning with intermediate table support",
            "Business insight extraction with structured responses"
        ],
        "tools": [
            {
                "name": "get_table_names", 
                "description": "List all available data tables for the current user"
            },
            {
                "name": "get_table_schema",
                "description": "Examine table structure and column information"
            },
            {
                "name": "get_table_sample",
                "description": "View sample rows from tables"
            },
            {
                "name": "execute_pandas_query",
                "description": "Enhanced data operations with flexible output modes (preview/full/none) and table creation control",
                "enhanced_features": [
                    "Configurable return modes: preview, full, or metadata only",
                    "Optional intermediate table creation",
                    "Structured response with schema information",
                    "Contextual guidance for next steps",
                    "Support for complex data analysis pipelines"
                ]
            },
            {
                "name": "analyze_text_data",
                "description": "Advanced AI-powered text analysis with multi-task support, batch processing, and structured output. Accepts a list of analysis tasks (each with column_name and description), supports preview/full return modes, and can create new columns for each analysis. Example: analysis_tasks=[{\"column_name\": \"sentiment\", \"description\": \"Classify sentiment as positive or negative.\"}]"
            },
            {
                "name": "generate_analysis_report",
                "description": "Create comprehensive analysis reports"
            },
            {
                "name": "create_data_summary",
                "description": "Generate quick data overviews"
            },
            {
                "name": "compare_tables",
                "description": "Compare multiple datasets"
            }
        ],
        "config": {
            "model": config.AGENT_MODEL,
            "temperature": config.AGENT_TEMPERATURE,
            "database_path": config.DUCKDB_PATH
        },
        "enhanced_features": {
            "data_pipeline_support": True,
            "flexible_output_modes": True,
            "intermediate_table_management": True,
            "structured_responses": True,
            "schema_aware_processing": True
        }
    }


# Create the agent instance for export
agent = create_dashboard_agent()


# Test function for local development
def test_agent_locally():
    """Test the agent locally with a simple query."""
    print("🤖 Dashboard Analysis Agent - Local Test")
    print("=" * 50)
    
    # Test agent creation
    try:
        test_agent = create_dashboard_agent()
        print("✅ Agent created successfully")
        
        # Show agent info
        info = get_agent_info()
        print(f"\n📋 Agent Info:")
        print(f"   Name: {info['name']}")
        print(f"   Version: {info['version']}")
        print(f"   Model: {info['model']}")
        print(f"   Tools: {len(info['tools'])} available")
        
        # Show enhanced features
        print(f"\n🚀 Enhanced Features:")
        for feature, enabled in info['enhanced_features'].items():
            status = "✅" if enabled else "❌"
            print(f"   {status} {feature.replace('_', ' ').title()}")
        
        # Test basic tool availability
        print(f"\n🔧 Available Tools:")
        for i, tool_info in enumerate(info['tools'], 1):
            print(f"   {i:2d}. {tool_info['name']}")
            if 'enhanced_features' in tool_info:
                print(f"       Enhanced: {', '.join(tool_info['enhanced_features'])}")
        
        print("\n✅ Local test completed successfully!")
        print("\nTo test with real data:")
        print("1. Start LangGraph server: langgraph serve")
        print("2. Send requests to the API endpoint")
        print("3. Try the enhanced execute_pandas_query with different return modes")
        print("4. Ensure data tables are available in the database for analysis")
        
    except Exception as e:
        print(f"❌ Error creating agent: {str(e)}")
        print("\nCheck your configuration:")
        print("1. Ensure OPENAI_API_KEY is set")
        print("2. Verify all dependencies are installed")
        print("3. Check database path permissions")


if __name__ == "__main__":
    test_agent_locally() 