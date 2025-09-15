"""Custom FastAPI app for DuckDB operations

This app provides REST endpoints for reading and writing to DuckDB.
Uses lazy initialization to avoid resource conflicts with LangGraph server.
"""

from fastapi import FastAPI, HTTPException, Request, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
import jwt
from pydantic import BaseModel, ConfigDict
from typing import Any, Dict, List, Optional, Union
import pandas as pd
import os
import shutil
import asyncio
from datetime import datetime

app = FastAPI(
    title="DuckDB API Extension",
    description="Custom endpoints for reading/writing to DuckDB database",
    version="1.0.0"
)

# Add CORS middleware (add this after app creation)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local development
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",

        # Render frontend (placeholder)
        "https://your-frontend-app.onrender.com",
        "https://*.onrender.com",

        # Vercel frontend (placeholder)
        "https://your-frontend-app.vercel.app",
        "https://*.vercel.app",

        # Development - remove in production
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return user ID."""
    token = credentials.credentials
    try:
        # Verify JWT token using Supabase's auth client
        user = supabase.auth.get_user(token)
        if not user:
            print("Invalid or expired token")
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return user.user.id
    except Exception as e:
        print(f"Authentication failed: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

# Request/Response models
class QueryRequest(BaseModel):
    query: str

class ExecuteRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    results: List[Dict[str, Any]]
    columns: List[str]
    row_count: int

class ExecuteResponse(BaseModel):
    status: str
    message: str
    affected_rows: Optional[int] = None

class TablesResponse(BaseModel):
    tables: List[str]
    count: int

class TableInfoResponse(BaseModel):
    table_name: str
    row_count: int
    column_count: int
    columns: List[Dict[str, Optional[str]]] # Modified this line to allow Optional[str] for dictionary values
    sample_data: List[Dict[str, Any]]

# New models for frontend integration
class DataSourceExport(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)

    id: str
    name: str
    type: str = "csv"
    columns: List[str]
    rowCount: int
    createdAt: str
    updatedAt: str
    csvContent: str

class SavedQueryExport(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)

    id: str
    name: str
    query: str
    description: Optional[str] = None
    createdAt: str

class DatabaseExportResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)

    tables: List[DataSourceExport]
    views: List[SavedQueryExport]
    metadata: Dict[str, Any]

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "DuckDB API Extension",
        "version": "1.0.0",
        "endpoints": {
            "query": "POST /duckdb/query - Execute SELECT queries",
            "execute": "POST /duckdb/execute - Execute DDL/DML operations",
            "tables": "GET /duckdb/tables - List all tables",
            "table_info": "GET /duckdb/tables/{table_name} - Get table details",
            "upload_csv": "POST /duckdb/upload_csv - Load CSV file to table",
            "export_database": "GET /duckdb/export - Export entire database for frontend",
            "export_table": "GET /duckdb/export/{table_name} - Export specific table as CSV"
        }
    }

@app.post("/duckdb/query", response_model=QueryResponse)
async def duckdb_query(request: QueryRequest) -> QueryResponse:
    """Execute a read-only SQL query on DuckDB and return results."""
    # Lazy import to avoid resource conflicts
    from agent.tools.storage_tools import db_manager

    try:
        # Validate it's a SELECT query for safety
        query_lower = request.query.strip().lower()
        if not query_lower.startswith('select'):
            raise HTTPException(
                status_code=400,
                detail="Only SELECT queries are allowed. Use /duckdb/execute for other operations."
            )

        df = db_manager.execute_query(request.query)

        return QueryResponse(
            results=df.to_dict(orient="records"),
            columns=list(df.columns),
            row_count=len(df)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query failed: {str(e)}")

@app.post("/duckdb/execute", response_model=ExecuteResponse)
async def duckdb_execute(request: ExecuteRequest) -> ExecuteResponse:
    """Execute a write/DDL SQL operation on DuckDB (INSERT, UPDATE, CREATE, etc.)."""
    # Lazy import to avoid resource conflicts
    from agent.tools.storage_tools import db_manager

    try:
        # For non-SELECT queries, we may not get a DataFrame back
        query_lower = request.query.strip().lower()

        if query_lower.startswith('select'):
            raise HTTPException(
                status_code=400,
                detail="SELECT queries should use /duckdb/query endpoint."
            )

        # Execute the query
        result = db_manager.conn.execute(request.query)

        # Try to get row count for INSERT/UPDATE/DELETE
        affected_rows = None
        if any(query_lower.startswith(op) for op in ['insert', 'update', 'delete']):
            try:
                affected_rows = result.rowcount if hasattr(result, 'rowcount') else None
            except:
                pass

        return ExecuteResponse(
            status="success",
            message="Operation executed successfully",
            affected_rows=affected_rows
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Execution failed: {str(e)}")

@app.get("/duckdb/tables", response_model=TablesResponse)
async def list_tables(current_user: str = Depends(get_current_user)) -> TablesResponse:
    """List all tables in the DuckDB database."""
    # Lazy import to avoid resource conflicts
    from agent.tools.storage_tools import db_manager

    try:
        tables = db_manager.get_table_names(current_user)
        return TablesResponse(
            tables=tables,
            count=len(tables)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list tables: {str(e)}")

@app.get("/duckdb/tables/{table_name}", response_model=TableInfoResponse)
async def get_table_info(table_name: str) -> TableInfoResponse:
    """Get detailed information about a specific table."""
    # Lazy import to avoid resource conflicts
    from agent.tools.storage_tools import db_manager

    try:
        info = db_manager.get_table_info(table_name)
        sample_df = db_manager.get_table_sample(table_name, limit=5)

        return TableInfoResponse(
            table_name=table_name,
            row_count=info['row_count'],
            column_count=info['column_count'],
            columns=info['schema'],
            sample_data=sample_df.to_dict(orient="records")
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found or error: {str(e)}")

@app.post("/duckdb/upload_csv", response_model=ExecuteResponse)
async def upload_csv(
    csv_file: UploadFile = File(...),
    table_name: Optional[str] = Form(None),
    current_user: str = Depends(get_current_user)
) -> ExecuteResponse:
    """Load a CSV file into DuckDB as a new table directly from the uploaded content."""
    from agent.tools.storage_tools import db_manager # Lazy import
    import io
    try:
        print("csv upload started")
        print(table_name,csv_file,current_user)
        contents = await csv_file.read()
        buffer = io.BytesIO(contents)
        print(table_name)
        # Try utf-8, then utf-8-sig, then latin1
        for encoding in ["utf-8", "utf-8-sig", "latin1"]:
            buffer.seek(0)
            try:
                df = pd.read_csv(buffer, encoding=encoding)
                break
            except UnicodeDecodeError:
                continue
        else:
            raise HTTPException(status_code=400, detail="CSV upload failed: Could not decode file with utf-8, utf-8-sig, or latin1 encoding.")
        if table_name:
            saved_table = db_manager.save_dataframe(
                df,
                table_name,
                f"CSV data from {csv_file.filename}",
                current_user
            )
        else:
            saved_table = db_manager.load_csv_from_dataframe(df, csv_file.filename)
        return ExecuteResponse(
            status="success",
            message=f"CSV file loaded successfully into table '{saved_table}'"
        )
    except Exception as e:
        print(f"CSV upload failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"CSV upload failed: {str(e)}")

@app.get("/duckdb/export", response_model=DatabaseExportResponse)
async def export_database(current_user: str = Depends(get_current_user)) -> DatabaseExportResponse:
    """Export entire database in format compatible with frontend dataStore."""
    from agent.tools.storage_tools import db_manager
    import io
    import uuid

    try:
        # Get all tables
        tables = db_manager.get_table_names(current_user)

        exported_tables = []
        exported_views = []

        # Export each table
        for table_name in tables:
            try:
                # Get table info
                table_info = db_manager.get_table_info(table_name)

                # Get all data as DataFrame
                df = db_manager.execute_query(f"SELECT * FROM {table_name}")

                # Convert to CSV string
                csv_buffer = io.StringIO()
                df.to_csv(csv_buffer, index=False)
                csv_content = csv_buffer.getvalue()

                # Create DataSourceExport object
                table_export = DataSourceExport(
                    id=str(uuid.uuid4()),
                    name=table_name,
                    type="csv",
                    columns=list(df.columns),
                    rowCount=len(df),
                    createdAt=datetime.now().isoformat(),
                    updatedAt=datetime.now().isoformat(),
                    csvContent=csv_content
                )

                exported_tables.append(table_export)

            except Exception as e:
                print(f"Warning: Failed to export table {table_name}: {str(e)}")
                continue

        # Get metadata about the database
        metadata = {
            "exported_at": datetime.now().isoformat(),
            "total_tables": len(exported_tables),
            "total_views": len(exported_views),
            "database_path": db_manager.db_path
        }

        return DatabaseExportResponse(
            tables=exported_tables,
            views=exported_views,
            metadata=metadata
        )

    except Exception as e:
        print(f"Database export failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database export failed: {str(e)}")

@app.get("/duckdb/export/{table_name}")
async def export_table_as_csv(table_name: str):
    """Export a specific table as CSV content."""
    from agent.tools.storage_tools import db_manager
    import io

    try:
        # Get table data
        df = db_manager.execute_query(f"SELECT * FROM {table_name}")

        # Convert to CSV
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_content = csv_buffer.getvalue()

        return {
            "table_name": table_name,
            "csv_content": csv_content,
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": list(df.columns)
        }

    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found or error: {str(e)}")

@app.get("/duckdb/sync")
async def sync_database():
    """Sync database state and return summary."""
    from agent.tools.storage_tools import db_manager

    try:
        tables = db_manager.get_table_names()
        table_summaries = []

        for table_name in tables:
            try:
                info = db_manager.get_table_info(table_name)
                table_summaries.append({
                    "name": table_name,
                    "row_count": info['row_count'],
                    "column_count": info['column_count'],
                    "columns": [col['column_name'] for col in info['schema']]
                })
            except Exception as e:
                table_summaries.append({
                    "name": table_name,
                    "error": str(e)
                })

        return {
            "status": "success",
            "total_tables": len(tables),
            "last_sync": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database sync failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    # Lazy import to avoid resource conflicts
    from agent.tools.storage_tools import db_manager

    try:
        # Simple query to test database connection
        db_manager.conn.execute("SELECT 1").fetchone()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unhealthy: {str(e)}") 