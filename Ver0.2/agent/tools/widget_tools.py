import json
import uuid
from datetime import datetime
from typing import Annotated, List, Dict, Any, Optional
from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent, InjectedState
from .models import (
    WidgetResponse, WidgetInputData, WidgetComponentData, ErrorComponentData, UploadPromptComponentData,
    TableWidgetResponse, ChartWidgetResponse, MetricWidgetResponse, TextWidgetResponse, ErrorWidgetResponse,
    Widget
)
from .sql_storage_tools import generate_sql, save_widget_data, get_widget_data, cleanup_widget_data
from .widget_prompts import get_widget_prompt
from ..config import config
import traceback

# Widget-specific generation functions
def generate_table_widget_response(
    user_instructions: str,
    run_id: str,
    sql_query: str,
    result_preview: List[Dict[str, Any]],
    data_sources: List[str],
    show_sql: bool = True
) -> TableWidgetResponse:
    """Generate a table widget response using structured output."""
    llm = ChatOpenAI(model=config.AGENT_SMALL_MODEL, temperature=0.0)
    widget_specific_prompt = get_widget_prompt("table")
    
    complete_prompt = f"""{widget_specific_prompt}

## INPUT DATA
- User Instructions: {user_instructions}
- Widget Type: table
- SQL Query: {sql_query}
- Result Preview: {json.dumps(result_preview)}
- Data Sources: {data_sources}
- Show SQL: {show_sql}
- Run ID: {run_id}

Based on the above input data and following the guidelines and examples for table widgets, generate an appropriate TableWidgetResponse."""

    structured_llm = llm.with_structured_output(TableWidgetResponse)
    return structured_llm.invoke(complete_prompt)

def generate_chart_widget_response(
    user_instructions: str,
    run_id: str,
    sql_query: str,
    result_preview: List[Dict[str, Any]],
    data_sources: List[str],
    show_sql: bool = True
) -> ChartWidgetResponse:
    """Generate a chart widget response using structured output."""
    llm = ChatOpenAI(model=config.AGENT_SMALL_MODEL, temperature=0.0)
    widget_specific_prompt = get_widget_prompt("chart")
    
    complete_prompt = f"""{widget_specific_prompt}

## INPUT DATA
- User Instructions: {user_instructions}
- Widget Type: chart
- SQL Query: {sql_query}
- Result Preview: {json.dumps(result_preview)}
- Data Sources: {data_sources}
- Show SQL: {show_sql}
- Run ID: {run_id}

Based on the above input data and following the guidelines and examples for chart widgets, generate an appropriate ChartWidgetResponse."""

    structured_llm = llm.with_structured_output(ChartWidgetResponse)
    return structured_llm.invoke(complete_prompt)

def generate_metric_widget_response(
    user_instructions: str,
    run_id: str,
    sql_query: str,
    result_preview: List[Dict[str, Any]],
    data_sources: List[str],
    show_sql: bool = True
) -> MetricWidgetResponse:
    """Generate a metric widget response using structured output."""
    llm = ChatOpenAI(model=config.AGENT_SMALL_MODEL, temperature=0.0)
    widget_specific_prompt = get_widget_prompt("metric")
    
    complete_prompt = f"""{widget_specific_prompt}

## INPUT DATA
- User Instructions: {user_instructions}
- Widget Type: metric
- SQL Query: {sql_query}
- Result Preview: {json.dumps(result_preview)}
- Data Sources: {data_sources}
- Show SQL: {show_sql}
- Run ID: {run_id}

Based on the above input data and following the guidelines and examples for metric widgets, generate an appropriate MetricWidgetResponse."""

    structured_llm = llm.with_structured_output(MetricWidgetResponse)
    return structured_llm.invoke(complete_prompt)

def generate_text_widget_response(
    user_instructions: str,
    run_id: str
) -> TextWidgetResponse:
    """Generate a text widget response using structured output."""
    llm = ChatOpenAI(model=config.AGENT_SMALL_MODEL, temperature=0.0)
    widget_specific_prompt = get_widget_prompt("text")
    
    complete_prompt = f"""{widget_specific_prompt}

## INPUT DATA
- User Instructions: {user_instructions}
- Widget Type: text
- Run ID: {run_id}

Based on the above input data and following the guidelines and examples for text widgets, generate an appropriate TextWidgetResponse."""

    structured_llm = llm.with_structured_output(TextWidgetResponse)
    return structured_llm.invoke(complete_prompt)

# Main generation function that routes to widget-specific functions
def generate_widget_response(
    user_instructions: str,
    widget_type: str,
    run_id: str,
    sql_query: Optional[str] = None,
    result_preview: Optional[List[Dict[str, Any]]] = None,
    data_sources: Optional[List[str]] = None,
    show_sql: bool = True
) -> WidgetResponse:
    """
    Generate widget response using widget-specific models and structured output.
    
    Args:
        user_instructions: User instructions for the widget
        widget_type: Type of widget (table, chart, metric, text)
        run_id: Unique run identifier
        sql_query: SQL query for data-driven widgets
        result_preview: Preview of query results
        data_sources: List of data source tables
        show_sql: Whether to show SQL in response
        
    Returns:
        WidgetResponse with appropriate widget-specific data
    """
    # Generate a unique widget ID upfront
    widget_id = f"widget-{uuid.uuid4()}"
    try:
        if widget_type == "table":
            if not sql_query or not result_preview or not data_sources:
                raise ValueError("Table widgets require sql_query, result_preview, and data_sources")
            response = generate_table_widget_response(
                user_instructions, run_id, sql_query, result_preview, data_sources, show_sql
            )
            # Convert to generic WidgetComponentData
            widget_data = WidgetComponentData(
                widget=Widget(
                    id=widget_id,  # Use the generated widget_id
                    type=response.data.widget.type,
                    title=response.data.widget.title,
                    position=response.data.widget.position,
                    size=response.data.widget.size,
                    config=response.data.widget.config
                ),
                query=response.data.query,
                table_names=response.data.table_names,
                show_sql=response.data.show_sql
            )
            return WidgetResponse(type="widget", id=widget_id, data=widget_data)
            
        elif widget_type == "chart":
            if not sql_query or not result_preview or not data_sources:
                raise ValueError("Chart widgets require sql_query, result_preview, and data_sources")
            response = generate_chart_widget_response(
                user_instructions, run_id, sql_query, result_preview, data_sources, show_sql
            )
            # Convert to generic WidgetComponentData
            widget_data = WidgetComponentData(
                widget=Widget(
                    id=widget_id,  # Use the generated widget_id
                    type=response.data.widget.type,
                    title=response.data.widget.title,
                    position=response.data.widget.position,
                    size=response.data.widget.size,
                    config=response.data.widget.config
                ),
                query=response.data.query,
                table_names=response.data.table_names,
                show_sql=response.data.show_sql
            )
            return WidgetResponse(type="widget", id=widget_id, data=widget_data)
            
        elif widget_type == "metric":
            if not sql_query or not result_preview or not data_sources:
                raise ValueError("Metric widgets require sql_query, result_preview, and data_sources")
            response = generate_metric_widget_response(
                user_instructions, run_id, sql_query, result_preview, data_sources, show_sql
            )
            # Convert to generic WidgetComponentData
            widget_data = WidgetComponentData(
                widget=Widget(
                    id=widget_id,  # Use the generated widget_id
                    type=response.data.widget.type,
                    title=response.data.widget.title,
                    position=response.data.widget.position,
                    size=response.data.widget.size,
                    config=response.data.widget.config
                ),
                query=response.data.query,
                table_names=response.data.table_names,
                show_sql=response.data.show_sql
            )
            return WidgetResponse(type="widget", id=widget_id, data=widget_data)
            
        elif widget_type == "text":
            response = generate_text_widget_response(user_instructions, run_id)
            # Convert to generic WidgetComponentData
            widget_data = WidgetComponentData(
                widget=Widget(
                    id=widget_id,  # Use the generated widget_id
                    type=response.data.widget.type,
                    title=response.data.widget.title,
                    position=response.data.widget.position,
                    size=response.data.widget.size,
                    config=response.data.widget.config
                ),
                query=response.data.query,
                table_names=response.data.table_names,
                show_sql=response.data.show_sql
            )
            return WidgetResponse(type="widget", id=widget_id, data=widget_data)
            
        else:
            return WidgetResponse(
                type="error",
                id=f"error-{widget_id}",  # Use widget_id with error prefix
                data={
                    "error": f"Unsupported widget type: {widget_type}",
                    "code": "UNSUPPORTED_WIDGET_TYPE",
                    "suggestions": ["Use one of: table, chart, metric, text"]
                }
            )
            
    except Exception as e:
        return WidgetResponse(
            type="error",
            id=f"error-{widget_id}",
            data={
                "error": str(e),
                "code": "WIDGET_GENERATION_FAILED",
                "suggestions": ["Check input data", "Verify widget type and required parameters"]
            }
        )

@tool
def generate_widget_data(
    user_instructions: str,
    widget_type: str,
    run_id: str,
    sql_query: Optional[str] = None,
    result_preview: Optional[str] = None,
    data_sources: Optional[List[str]] = None,
    show_sql: bool = True
) -> Dict[str, str]:
    """
    Generates a WidgetResponse using an LLM call and saves it to the store.

    Args:
        user_instructions: User instructions for the widget.
        widget_type: Type of the widget (chart, table, metric, text).
        run_id: Unique ID for the agent run.
        sql_query: The generated SQL query (optional).
        result_preview: Preview of the query results as JSON string (optional).
        data_sources: List of data source tables (optional).
        show_sql: Whether to show the SQL query (default: True).

    Returns:
        Dict with widget_id and status (success/error).
    """
    try:
        # Parse result_preview if it's a string
        parsed_result_preview = None
        if result_preview:
            try:
                parsed_result_preview = json.loads(result_preview) if isinstance(result_preview, str) else result_preview
            except json.JSONDecodeError:
                parsed_result_preview = []

        # Generate WidgetResponse using LLM
        widget_response = generate_widget_response(user_instructions, widget_type, run_id, sql_query, parsed_result_preview, data_sources, show_sql)
        widget_id = widget_response.id

        # Save to store
        status = "success" if widget_response.type == "widget" else "error"
        save_widget_data(run_id, widget_id, widget_response.model_dump(), status=status)

        if widget_response.type == "error":
            return {
                "widget_id": widget_id,
                "status": "error",
                "error": widget_response.data.error,
                "code": widget_response.data.code
            }
        return {"widget_id": widget_id, "status": "success"}

    except Exception as e:
        widget_id = f"widget-{uuid.uuid4()}"
        error_data = {
            "error": str(e),
            "code": "WIDGET_GENERATION_FAILED",
            "suggestions": ["Check input data", "Verify LLM configuration"]
        }
        save_widget_data(run_id, widget_id, error_data, status="error")
        return {
            "widget_id": widget_id,
            "status": "error",
            "error": str(e),
            "code": "WIDGET_GENERATION_FAILED"
        }
    
def create_widget_sub_agent():
    """
    Creates a sub-agent for generating widget data.
    """
    llm = ChatOpenAI(model=config.AGENT_MODEL, temperature=0.0)
    tools = [generate_sql, generate_widget_data]
    system_prompt = """
    You are an expert dashboard widget creator. Based on user instructions and data sources, generate the necessary data to create a widget and pass it to the generate_widget_data tool.

    ## AVAILABLE TOOLS
    - generate_sql: Generates and validates SQL queries based on natural language descriptions and data sources.
    - generate_widget_data: Takes input data (SQL query, result preview, user instructions, widget type, data sources, run_id) and generates a WidgetResponse.

    ## WORKFLOW
    1. Analyze the user instructions to determine the widget type (chart, table, metric, text).
    2. For data-driven widgets (chart, table, metric):
       - Use generate_sql to create the appropriate SQL query based on the instruction and data sources.
       - If SQL generation fails, return an error response.
       - Collect the following information from the sql generation:
         - sql_query: The generated SQL query
         - result_preview: Preview of the query results (from generate_sql)
    3. For text widgets:
       - Do NOT generate or use SQL, result_preview, or data_sources.
       - Pass the user instructions as the content for the text widget.
    4. Call generate_widget_data with the following parameters:
       - user_instructions: The original user instructions
       - widget_type: The determined widget type (chart, table, metric, text)
       - run_id: The run ID provided in the input
       - sql_query: The generated SQL query (optional, only for data-driven widgets)
       - result_preview: Preview of the query results as JSON string (optional, only for data-driven widgets)
       - data_sources: The provided data sources (optional, only for data-driven widgets)
       - show_sql: Boolean indicating whether to show the SQL query (default: true)
    5. Return a JSON object with {widget_id, status, error (optional)}.

    ## EXAMPLES
    ### Data-driven widget (table)
    Instructions: "create a table of average satisfaction score by department"
    Data Sources: ["average_satisfaction_by_department_2025_07_14"]
    Run ID: "test-run-id"

    Steps:
    1. Call generate_sql with query_description="table showing average satisfaction score by department" and data_sources=["average_satisfaction_by_department_2025_07_14"]
    2. Call generate_widget_data with parameters:
       - user_instructions="create a table of average satisfaction score by department"
       - widget_type="table"
       - run_id="test-run-id"
       - sql_query="SELECT department, AVG(satisfaction_score) AS average_satisfaction_score FROM average_satisfaction_by_department_2025_07_14 GROUP BY department;"
       - result_preview='[{"department": "HR", "average_satisfaction_score": 4.5}, ...]'
       - data_sources=["average_satisfaction_by_department_2025_07_14"]
       - show_sql=true
    3. Return: {"widget_id": "widget-uuid", "status": "success"}

    ### Text widget
    Instructions: "Show a welcome message: Welcome to the dashboard!"
    Data Sources: []
    Run ID: "test-run-id"

    Steps:
    1. Call generate_widget_data with parameters:
       - user_instructions="Show a welcome message: Welcome to the dashboard!"
       - widget_type="text"
       - run_id="test-run-id"
       - show_sql=false
    2. Return: {"widget_id": "widget-uuid", "status": "success"}

    ## ERROR HANDLING
    If any tool fails, retry up to three times, then return:
    {
        "widget_id": "error-uuid",
        "status": "error",
        "error": "Error message",
        "code": "ERROR_CODE",
        "suggestions": ["Suggestion 1", "Suggestion 2"]
    }
    """
    return create_react_agent(llm, tools, prompt=system_prompt)

def render_widget(state: Annotated[dict, InjectedState],instructions: str, data_sources: List[str], configFromFrontend: RunnableConfig = None) -> Dict[str, Any]:
    """
    This is the main tool that renders a widget component using a ReAct sub-agent and retrieves data from the store.
    It is used to render the widget component in the frontend.
    It is also used to render the widget component in the backend.
    It is also used to render the widget component in the backend.
    Renders a widget component using a ReAct sub-agent and retrieves data from the store.

    Args:
        instructions: User instructions for the widget (e.g., "create a pie chart of customer segments").
        data_sources: List of table names to use for the widget data.
        configFromFrontend: Optional frontend configuration with table schemas and context.

    Returns:
        Dict with a WidgetResponse or ErrorComponent.
    """
    run_id = str(uuid.uuid4())
    try:
        context = configFromFrontend.get("configurable", {}) if configFromFrontend else {}
        if "run_id" in context:
            run_id = context["run_id"]
        
        widget_agent = create_widget_sub_agent()
        response = widget_agent.invoke({
            "messages": [{
                "role": "user",
                "content": f'{instructions}\nUse the following tables Data Sources: {data_sources}\nRun ID: {run_id}'
            }]
        })
        response_content = response["messages"][-1].content
        print("Response content: ", response_content)
        if "```json" in response_content:
            response_content = response_content.split("```json")[1].split("```")[0]
        else:
            response_content = response_content.replace("\n", "")
            if not response_content.startswith("{"):
                print("Response is not JSON, treating as text response",response_content)
                return {
                    "type": "error",
                    "id": f"error-{datetime.now().timestamp()}",
                    "data": {
                        "error": "Response is not JSON",
                        "code": "RESPONSE_NOT_JSON",
                        "suggestions": ["Check instructions", "Verify table schemas"]
                    }
                }
        
        result = json.loads(response_content)

        if result["status"] == "error":
            return {
                "type": "error",
                "id": f"error-{datetime.now().timestamp()}",
                "data": {
                    "error": result.get("error", "Unknown error"),
                    "code": result.get("code", "WIDGET_RENDER_FAILED"),
                    "suggestions": result.get("suggestions", ["Check instructions", "Verify table schemas"])
                }
            }

        widget_id = result["widget_id"]
        widget_data = get_widget_data(run_id, widget_id)
        
        # If widget_data is a full WidgetResponse, extract just the data portion
        if isinstance(widget_data, dict) and "data" in widget_data and "type" in widget_data:
            return {
                "type": "widget",
                "id": widget_id,
                "data": widget_data["data"]
            }
        else:
            # If it's already just the data portion
            return {
                "type": "widget",
                "id": widget_id,
                "data": widget_data
            }

    except Exception as e:
        stack_trace = traceback.format_exc()
        return {
            "type": "error",
            "id": f"error-{datetime.now().timestamp()}",
            "data": {
                "error": str(e),
                "code": "WIDGET_RENDER_FAILED",
                "suggestions": ["Check instructions", "Verify table schemas"],
                "stack_trace": stack_trace
            }
        }

@tool
def render_upload_csv_dialog(table_name: str) -> Dict[str, Any]:
    """
    Prompts the user to upload a CSV file to create or update a table.

    Args:
        table_name: The target table name for the CSV data.

    Returns:
        Dict with an UploadPromptComponent or ErrorComponent.
    """
    try:
        component_id = f"upload-prompt-{uuid.uuid4()}"
        return {
            "type": "upload_prompt",
            "id": component_id,
            "data": {
                "message": f"Upload a CSV file for table '{table_name}'",
                "acceptedTypes": [".csv"],
                "targetTable": table_name
            }
        }
    except Exception as e:
        return {
            "type": "error",
            "id": f"error-{datetime.now().timestamp()}",
            "data": {
                "error": str(e),
                "code": "UPLOAD_PROMPT_FAILED",
                "suggestions": ["Check table name", "Try again"]
            }
        } 