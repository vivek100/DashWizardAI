"""DuckDB Storage Management for Dashboard Agent

Handles all database operations including table creation, querying, and data persistence.
"""

import os
import uuid
import duckdb
import pandas as pd
from typing import List, Dict, Any, Optional
from pathlib import Path
from ..config import config
from .context_tools import extract_user_context

class DuckDBManager:
    """Manages DuckDB connections and operations for the dashboard agent."""
    
    def __init__(self, db_path: Optional[str] = None):
        """Initialize DuckDB manager.
        
        Args:
            db_path: Path to DuckDB database file. Uses config default if None.
        """
        # Always use the project root data directory for the database
        self.db_path = db_path or config.DUCKDB_PATH
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self.conn = duckdb.connect(self.db_path)
        # Note: No agent-local data dir is used; all code references the same db file
        
        # Initialize metadata table for tracking loaded tables
        self._init_metadata_table()
    
    def _init_metadata_table(self):
        """Initialize metadata table to track loaded CSV files and analysis results."""
        # Step 1: Create table if it doesn't exist
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS table_metadata (
                table_name VARCHAR PRIMARY KEY,
                original_file VARCHAR,
                table_type VARCHAR,  -- 'csv', 'analysis', 'report'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                description TEXT,
                row_count INTEGER,
                column_count INTEGER,
                user_id VARCHAR
            )
        """)

        # Step 2: Check if 'user_id' column exists
        result = self.conn.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'table_metadata' AND column_name = 'user_id'
        """).fetchall()
        print(f"Result: {result}")
        if not result:
            print("Adding user_id column to table_metadata")
            self.conn.execute("ALTER TABLE table_metadata ADD COLUMN user_id VARCHAR")

        # Step 3: Add index on user_id (DuckDB supports advisory indexes)
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_table_metadata_user_id ON table_metadata(user_id)")

    
    def load_csv_to_table(self, csv_file: str, configFromFrontend = None) -> str:
        """Load CSV file into DuckDB table with unique name.
        
        Args:
            csv_file: Path to CSV file
            user_id: ID of the user loading the CSV
        Returns:
            Table name where CSV was loaded
        """
        user_id, run_id = extract_user_context(configFromFrontend)
        if not os.path.exists(csv_file):
            raise FileNotFoundError(f"CSV file not found: {csv_file}")
        
        # Generate unique table name
        table_name = f"csv_table_{uuid.uuid4().hex[:8]}"
        
        try:
            # Load CSV into DuckDB
            self.conn.execute(f"""
                CREATE TABLE {table_name} AS 
                SELECT * FROM read_csv_auto('{csv_file}')
            """)
            
            # Get table statistics
            row_count = self.conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
            column_count = len(self.get_table_schema(table_name))
            
            # Store metadata
            self.conn.execute("""
                INSERT INTO table_metadata 
                (table_name, original_file, table_type, row_count, column_count, description, user_id)
                VALUES (?, ?, 'csv', ?, ?, ?, ?)
            """, [table_name, csv_file, row_count, column_count, f"CSV data from {os.path.basename(csv_file)}", user_id])
            
            return table_name
            
        except Exception as e:
            # Clean up if table creation failed
            try:
                self.conn.execute(f"DROP TABLE IF EXISTS {table_name}")
            except:
                pass
            raise Exception(f"Failed to load CSV {csv_file}: {str(e)}")
    
    def load_csv_from_dataframe(self, df: pd.DataFrame, original_filename: str = "", configFromFrontend = None) -> str:
        """Load a Pandas DataFrame into a DuckDB table with a unique name.
        Args:
            df: Pandas DataFrame to load.
            original_filename: Original filename for metadata (optional).
            user_id: ID of the user loading the CSV
        Returns:
            Table name where DataFrame was loaded.
        """
        user_id, run_id = extract_user_context(configFromFrontend)
        import uuid
        table_name = f"csv_table_{uuid.uuid4().hex[:8]}"
        try:
            self.conn.register('temp_df_for_csv_load', df)
            self.conn.execute(f"CREATE TABLE {table_name} AS SELECT * FROM temp_df_for_csv_load")
            self.conn.unregister('temp_df_for_csv_load')
            row_count = len(df)
            column_count = len(df.columns)
            self.conn.execute("""
                INSERT INTO table_metadata 
                (table_name, original_file, table_type, row_count, column_count, description, user_id)
                VALUES (?, ?, 'csv', ?, ?, ?, ?)
            """, [table_name, original_filename, row_count, column_count, f"CSV data from {original_filename or 'uploaded data'}", user_id])
            return table_name
        except Exception as e:
            try:
                self.conn.execute(f"DROP TABLE IF EXISTS {table_name}")
            except:
                pass
            print(f"Failed to load DataFrame into table: {str(e)}")
            raise Exception(f"Failed to load DataFrame into table: {str(e)}")
    
    def get_table_names(self, user_id: str = "", configFromFrontend = None) -> List[str]:
        """Get list of all user tables (excluding metadata), filtered by user_id from table_metadata."""
        if user_id == "":
            user_id, run_id = extract_user_context(configFromFrontend)
        else:
            user_id = user_id
        result = self.conn.execute("""
            SELECT t.table_name 
            FROM information_schema.tables t
            JOIN table_metadata m ON t.table_name = m.table_name
            WHERE t.table_schema = 'main' 
            AND t.table_name != 'table_metadata'
            AND m.user_id = ?
            ORDER BY t.table_name
        """, [user_id]).fetchall()
        # print(f"Result: {result}")
        return [row[0] for row in result]
    
    def get_table_schema(self, table_name: str) -> List[Dict[str, str]]:
        """Get schema information for a table.
        
        Args:
            table_name: Name of the table
            
        Returns:
            List of dictionaries with column information
        """
        try:
            result = self.conn.execute(f"DESCRIBE {table_name}").fetchall()
            schema = []
            for row in result:
                schema.append({
                    "column_name": row[0],
                    "data_type": row[1],
                    "null": row[2],
                    "key": row[3] if len(row) > 3 else None,
                    "default": row[4] if len(row) > 4 else None
                })
            return schema
        except Exception as e:
            raise Exception(f"Failed to get schema for table {table_name}: {str(e)}")
    
    def get_table_sample(self, table_name: str, limit: int = 5) -> pd.DataFrame:
        """Get sample rows from a table.
        
        Args:
            table_name: Name of the table
            limit: Number of rows to sample
            
        Returns:
            DataFrame with sample data
        """
        try:
            df = self.conn.execute(f"SELECT * FROM {table_name} LIMIT {limit}").df()
            return df
        except Exception as e:
            raise Exception(f"Failed to get sample from table {table_name}: {str(e)}")
    
    def execute_query(self, query: str) -> pd.DataFrame:
        """Execute SQL query and return results as DataFrame.
        
        Args:
            query: SQL query to execute
            
        Returns:
            Query results as DataFrame
        """
        try:
            df = self.conn.execute(query).df()
            return df
        except Exception as e:
            raise Exception(f"Failed to execute query: {str(e)}")
    
    def save_dataframe(self, df: pd.DataFrame, table_name: str, description: str = "", user_id: str = "", configFromFrontend = None) -> str:
        """Save DataFrame as a new table.
        
        Args:
            df: DataFrame to save
            table_name: Name for the new table
            description: Description of the table

        Returns:
            Table name where data was saved
        """
        try:
            if user_id == "":
                user_id, run_id = extract_user_context(configFromFrontend)
            else:
                user_id = user_id
            # Drop table if it exists
            self.conn.execute(f"DROP TABLE IF EXISTS {table_name}")
            
            # Create table from DataFrame
            self.conn.register('temp_df', df)
            self.conn.execute(f"CREATE TABLE {table_name} AS SELECT * FROM temp_df")
            self.conn.unregister('temp_df')
            
            # Store metadata
            row_count = len(df)
            column_count = len(df.columns)
            self.conn.execute("""
                INSERT OR REPLACE INTO table_metadata 
                (table_name, original_file, table_type, row_count, column_count, description, user_id)
                VALUES (?, ?, 'analysis', ?, ?, ?, ?)
            """, [table_name, '', row_count, column_count, description, user_id])
            
            return table_name
            
        except Exception as e:
            print(f"Failed to save DataFrame as {table_name}: {str(e)}")
            raise Exception(f"Failed to save DataFrame as {table_name}: {str(e)}")
    
    def get_table_info(self, table_name: str) -> Dict[str, Any]:
        """Get comprehensive information about a table.
        
        Args:
            table_name: Name of the table
            
        Returns:
            Dictionary with table information
        """
        try:
            # Get metadata
            metadata_result = self.conn.execute("""
                SELECT * FROM table_metadata WHERE table_name = ?
            """, [table_name]).fetchone()
            
            if metadata_result:
                metadata = {
                    "table_name": metadata_result[0],
                    "original_file": metadata_result[1],
                    "table_type": metadata_result[2],
                    "created_at": metadata_result[3],
                    "description": metadata_result[4],
                    "row_count": metadata_result[5],
                    "column_count": metadata_result[6]
                }
            else:
                # Table exists but no metadata (manual creation)
                row_count = self.conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
                column_count = len(self.get_table_schema(table_name))
                metadata = {
                    "table_name": table_name,
                    "original_file": "",
                    "table_type": "unknown",
                    "created_at": None,
                    "description": "No metadata available",
                    "row_count": row_count,
                    "column_count": column_count
                }
            
            # Add schema
            metadata["schema"] = self.get_table_schema(table_name)
            
            return metadata
            
        except Exception as e:
            raise Exception(f"Failed to get info for table {table_name}: {str(e)}")
    
    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()


# Global instance for use by tools
db_manager = DuckDBManager() 