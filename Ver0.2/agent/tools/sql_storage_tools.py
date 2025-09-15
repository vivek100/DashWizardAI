import json
import pandas as pd
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from .storage_tools import db_manager
from .models import SqlResultComponentData, ErrorComponentData
from ..config import config

# Store functions
def save_widget_data(run_id: str, widget_id: str, data: dict, status: str = "success"):
    """Save widget data to the store with a run_id for scoping. Also add a new row for the widget_id"""
    # instea dof save_dataframe , add try catch and raise error if it fails
    try:
        db_manager.execute_query(
            f"INSERT INTO widget_data (run_id, widget_id, data, created_at, status) VALUES ('{run_id}', '{widget_id}', '{json.dumps(data)}', '{datetime.now().isoformat()}', '{status}')"
        )
    except Exception as e:
        raise ValueError(f"Failed to insert widget data: {str(e)}")

def get_widget_data(run_id: str, widget_id: str) -> dict:
    """Retrieve widget data from the store."""
    df = db_manager.execute_query(
        f"SELECT data FROM widget_data WHERE run_id = '{run_id}' AND widget_id = '{widget_id}'"
    )
    if not df.empty:
        return json.loads(df.iloc[0]["data"])
    raise ValueError(f"No widget data found for run_id: {run_id}, widget_id: {widget_id}")

def cleanup_widget_data(run_id: str):
    """Clean up widget data for a specific run_id."""
    db_manager.execute_query(f"DELETE FROM widget_data WHERE run_id = '{run_id}'")

@tool
def generate_sql(query_description: str, data_sources: List[str]) -> Dict[str, Any]:
    """
    Generates and validates a SQL query based on a natural language description.

    Args:
        query_description: Description of the desired query (e.g., "total revenue by product").
        data_sources: List of tables or views to query.

    Returns:
        Dict with a SqlResultComponent or ErrorComponent.
    """
    try:
        llm = ChatOpenAI(model=config.AGENT_SMALL_MODEL, temperature=0.0)
        currentTableSchema = [db_manager.get_table_info(ds) for ds in data_sources]

        if not currentTableSchema:
            return {
                "type": "error",
                "id": f"error-{datetime.now().timestamp()}",
                "data": {
                    "error": f"Data sources '{data_sources}' not found.",
                    "code": "DATA_SOURCE_NOT_FOUND",
                    "suggestions": ["Verify table names"]
                }
            }

        schema = currentTableSchema
        max_retries = 3
        for attempt in range(max_retries):
            prompt = f"""
            You are an expert SQL query generator. Generate a SQL query for the tables '{data_sources}' based on the description: '{query_description}'.

            Table schemas: {schema}

            Rules:
            - Return only the SQL query as a string.
            - Use proper SQL syntax with GROUP BY for aggregations.
            - Reference only columns from the provided schema.
            - Ensure the query is executable and relevant to the description.
            Example:
            Input: Create a bar chart of the average satisfaction score by department
            Output:
            ```sql
            SELECT department, AVG(satisfaction_score) AS average_satisfaction_score
            FROM average_satisfaction_by_department_2025_07_14
            GROUP BY department;
            ```
            """
            response = llm.invoke(prompt)
            #the ai responds with ```sql
            #example
            #SELECT department, AVG(satisfaction_score) AS average_satisfaction_score
            #FROM average_satisfaction_by_department_2025_07_14
            #GROUP BY department;
            #```
            #we need to remove the ```sql and ``` from the response
            query = response.content.strip().replace("```sql", "").replace("```", "")

            print("Sql Query", query)

            try:
                result_df = db_manager.execute_query(query)
                return {
                    "type": "sql_result",
                    "id": f"sql-result-{uuid.uuid4()}",
                    "data": {
                        "query": query,
                        "result_preview": result_df.to_dict(orient="records")[:3],
                        "table_names": data_sources,
                        "execution_time_ms": round((datetime.now() - datetime.now()).total_seconds() * 1000, 2)
                    }
                }
            except Exception as e:
                if attempt < max_retries - 1:
                    continue
                return {
                    "type": "error",
                    "id": f"error-{datetime.now().timestamp()}",
                    "data": {
                        "error": f"Invalid SQL query: {str(e)}",
                        "code": "SQL_GENERATION_FAILED",
                        "suggestions": ["Check query description", f"Verify columns in '{data_sources}', this was the sql query generated and tested: {query}"]
                    }
                }
    except Exception as e:
        return {
            "type": "error",
            "id": f"error-{datetime.now().timestamp()}",
            "data": {
                "error": str(e),
                "code": "SQL_GENERATION_FAILED",
                "suggestions": ["Check table schema", "Try a simpler query description"]
            }
        } 