"""CSV Loading and Schema Tools

Tools for loading CSV files into DuckDB and exploring table schemas.
"""

import os
from typing import List, Dict, Any
from langchain_core.tools import tool
from .storage_tools import db_manager


@tool
def load_csv_to_table(csv_file: str) -> str:
    """Load a CSV file into the database and return the table name.
    
    This tool loads a CSV file into DuckDB storage, automatically detecting
    column types and creating a unique table name for the data.
    
    Args:
        csv_file: Path to the CSV file to load
        
    Returns:
        The name of the table where the CSV data was loaded
        
    Example:
        table_name = load_csv_to_table("data/customer_survey.csv")
        # Returns: "csv_table_a1b2c3d4"
    """
    try:
        if not os.path.exists(csv_file):
            return f"Error: CSV file '{csv_file}' not found. Please provide a valid file path."
        
        table_name = db_manager.load_csv_to_table(csv_file)
        
        # Get basic info about loaded data
        info = db_manager.get_table_info(table_name)
        
        return f"""Successfully loaded CSV file '{csv_file}' into table '{table_name}'.
        
Table Info:
- Rows: {info['row_count']:,}
- Columns: {info['column_count']}
- Table ID: {table_name}

Use get_table_schema('{table_name}') to explore the column structure."""
        
    except Exception as e:
        return f"Error loading CSV file: {str(e)}"


@tool  
def get_table_names(user_id: str) -> str:
    """Get a list of all available tables in the database.
    
    Returns a list of table names that have been loaded or created,
    useful for understanding what data is available for analysis.
    
    Returns:
        Formatted string listing all available tables with metadata
    """
    try:
        table_names = db_manager.get_table_names(user_id)
        
        if not table_names:
            return "No tables found in the database. Use load_csv_to_table() to load data first."
        
        result = "Available tables in database:\n\n"
        
        for table_name in table_names:
            try:
                info = db_manager.get_table_info(table_name)
                result += f"📊 {table_name}\n"
                result += f"   Type: {info['table_type']}\n"
                result += f"   Rows: {info['row_count']:,}\n"
                result += f"   Columns: {info['column_count']}\n"
                result += f"   Description: {info['description']}\n\n"
            except:
                result += f"📊 {table_name} (metadata unavailable)\n\n"
        
        return result
        
    except Exception as e:
        return f"Error retrieving table names: {str(e)}"


@tool
def get_table_schema(table_name: str) -> str:
    """Get detailed schema information for a specific table.
    
    Returns column names, data types, and other schema details to help
    understand the structure of the data for analysis.
    
    Args:
        table_name: Name of the table to examine
        
    Returns:
        Formatted schema information including column details and sample data
    """
    try:
        # Get schema information
        schema = db_manager.get_table_schema(table_name)
        info = db_manager.get_table_info(table_name)
        
        if not schema:
            return f"Error: Table '{table_name}' not found or has no columns."
        
        result = f"Schema for table '{table_name}':\n\n"
        result += f"📊 **Table Info:**\n"
        result += f"   - Rows: {info['row_count']:,}\n"
        result += f"   - Columns: {info['column_count']}\n"
        result += f"   - Type: {info['table_type']}\n"
        result += f"   - Description: {info['description']}\n\n"
        
        result += "📋 **Columns:**\n"
        for i, col in enumerate(schema, 1):
            result += f"{i:2d}. {col['column_name']} ({col['data_type']})\n"
        
        # Get sample data
        try:
            sample_df = db_manager.get_table_sample(table_name, limit=3)
            result += f"\n🔍 **Sample Data (first 3 rows):**\n"
            result += sample_df.to_string(index=False)
        except:
            result += "\n(Sample data unavailable)"
        
        return result
        
    except Exception as e:
        return f"Error getting schema for table '{table_name}': {str(e)}"


@tool
def get_table_sample(table_name: str, num_rows: int = 5) -> str:
    """Get sample rows from a table to understand the data.
    
    Useful for exploring data content before performing analysis.
    
    Args:
        table_name: Name of the table to sample
        num_rows: Number of rows to return (default 5, max 20)
        
    Returns:
        Formatted sample data from the table
    """
    try:
        # Limit sample size for safety
        num_rows = min(max(1, num_rows), 20)
        
        sample_df = db_manager.get_table_sample(table_name, limit=num_rows)
        
        if len(sample_df) == 0:
            return f"Table '{table_name}' is empty (no rows)."
        
        result = f"Sample data from '{table_name}' ({num_rows} rows):\n\n"
        result += sample_df.to_string(index=False)
        
        # Add data type info
        result += f"\n\nData types:\n"
        for col, dtype in sample_df.dtypes.items():
            result += f"  {col}: {dtype}\n"
        
        return result
        
    except Exception as e:
        return f"Error getting sample from table '{table_name}': {str(e)}" 