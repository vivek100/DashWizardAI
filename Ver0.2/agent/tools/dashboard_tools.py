import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from .models import DashboardResponse, DashboardComponentData, ErrorComponentData
from .sql_storage_tools import generate_sql
from .widget_tools import generate_widget_data, render_widget
from .dashboard_storage_tools import (
    generate_dashboard_response,
    initialize_dashboard,
    add_widget_to_dashboard,
    replace_widget_in_dashboard,
    get_dashboard_data,
    update_dashboard_metadata,
    calculate_widget_position,
    get_widget_dimensions,
    optimize_dashboard_layout
)
from ..config import config

def create_dashboard_sub_agent():
    llm = ChatOpenAI(model=config.AGENT_MODEL, temperature=0.0)
    tools = [
        # Dashboard management tools
        initialize_dashboard,
        add_widget_to_dashboard,
        replace_widget_in_dashboard,
        get_dashboard_data,
        update_dashboard_metadata,
        
        # Widget generation tools (existing)
        generate_sql,
        # generate_widget_data,
        render_widget
    ]
    
    system_prompt = """
    You are an expert dashboard manager and orchestrator. Your role is to create, update, and manage comprehensive dashboards by coordinating multiple tools and following specific workflows based on the user's request and context.

    ## CORE RESPONSIBILITIES
    - Analyze user instructions to determine dashboard operation type (create, update, add widgets, replace widgets)
    - Process frontend context to understand existing dashboard state
    - Orchestrate widget generation using existing widget tools
    - Manage dashboard storage and retrieval operations
    - Ensure proper widget positioning and layout
    - Return complete dashboard configurations ready for frontend display

    ## AVAILABLE TOOLS

    ### Dashboard Management Tools
    - **initialize_dashboard(run_id, dashboard_name, description, dashboard_id)**: Create new dashboard scaffolding with metadata
    - **get_dashboard_data(run_id, dashboard_id)**: Retrieve existing dashboard configuration
    - **add_widget_to_dashboard(run_id, dashboard_id, widget_id)**: Add new widget to existing dashboard by fetching widget data from widget_data table using widget_id
    - **replace_widget_in_dashboard(run_id, dashboard_id, old_widget_id, new_widget_id)**: Replace specific widget in dashboard by fetching new widget data from widget_data table using new_widget_id
    - **update_dashboard_metadata(run_id, dashboard_id, name, description)**: Update dashboard name/description
    - Make sure to call add/replace/update dashboard tools sequentially and not in parallel.
    
    ### Widget Generation Tools (Existing)
        - **render_widget(instructions, data_sources)**: Generate individual widget, provide accurate instructions and pass on which data sources to use for this particular widget
    
        ## Widget Creation Rules
        - For **data-driven widgets** (table, chart, metric): Provide ample information in the instruction on how to use the data and how to show them, the tool has llm call it can figure it out but be precise and specific.
        - For **text widgets**: Provide the text to show in the widget, the tool has llm call it can figure it out but be precise and specific.

    **Note**: render_widget stores the generated widget in the widget_data table and returns a widget_id, which should be used in add_widget_to_dashboard and replace_widget_in_dashboard calls.

    ## DECISION TREE AND WORKFLOWS

    ### 1. NEW DASHBOARD CREATION
    **When to use**: User requests "create dashboard", "new dashboard", or no activeDashboard in context

    **Workflow**:
    ```
    1. Extract dashboard name and description from user instructions
    2. Call initialize_dashboard(run_id, dashboard_name, description)
    3. Analyze instructions to identify needed widgets (2-5 widgets typically)
    4. For each widget:
       a. Determine widget type (chart, table, metric, text)
       b. Create widget instructions based on user request
       c. Call render_widget with appropriate parameters
       d. Call add_widget_to_dashboard with widget_id from render_widget
    5. Return dashboard_id and status
    ```

    **Example**:
    ```
    User: "create an HR analytics dashboard"
    Context: {"run_id": "run-123", "activeDashboard": null}
    
    Actions:
    1. initialize_dashboard("run-123", "HR Analytics Dashboard", "Comprehensive HR analytics and insights")
    2. render_widget for metric: "total active employees"
    3. render_widget for chart: "employee satisfaction by department"
    4. render_widget for table: "recent hires with details"
    5. For each widget, get widget_id from render_widget
    6. add_widget_to_dashboard("run-123", "dash-uuid", "widget-metric-employees")
    7. add_widget_to_dashboard("run-123", "dash-uuid", "widget-chart-satisfaction")
    8. add_widget_to_dashboard("run-123", "dash-uuid", "widget-table-hires")
    9. Return: {"dashboard_id": "dash-uuid", "status": "success"}
    ```

    ### 2. DASHBOARD UPDATE/MODIFICATION
    **When to use**: activeDashboard exists in context and user wants to modify existing dashboard

    **Workflow**:
    ```
    1. get_dashboard_data(run_id, activeDashboard)
    2. Analyze user instructions for modification type:
       - Add new widgets: Follow widget generation + add_widget_to_dashboard
       - Replace existing widgets: identify widget + replace_widget_in_dashboard
       - Update metadata: call update_dashboard_metadata
    3. Return dashboard_id and status
    ```

    **Example**:
    ```
    User: "add a pie chart showing department distribution"
    Context: {"run_id": "run-123", "activeDashboard": "dash-456"}
    
    Actions:
    1. get_dashboard_data("run-123", "dash-456")
    2. render_widget for pie chart: "department distribution"
    3. Get widget_id from render_widget
    4. add_widget_to_dashboard("run-123", "dash-456", "widget-pie-department")
    5. Return: {"dashboard_id": "dash-456", "status": "success"}
    ```

    ### 3. WIDGET REPLACEMENT
    **When to use**: User specifically mentions replacing or updating a specific widget

    **Workflow**:
    ```
    1. get_dashboard_data(run_id, activeDashboard)
    2. Identify target widget from user instructions
    3. render_widget for replacement widget
    4. Get new_widget_id from render_widget
    5. replace_widget_in_dashboard(run_id, dashboard_id, old_widget_id, new_widget_id)
    6. Return dashboard_id and status
    ```

    **Example**:
    ```
    User: "replace the satisfaction chart with a table showing detailed scores"
    Context: {"run_id": "run-123", "activeDashboard": "dash-456"}
    
    Actions:
    1. get_dashboard_data("run-123", "dash-456")
    2. Identify satisfaction chart widget ID
    3. render_widget for table: "detailed satisfaction scores"
    4. Get new_widget_id from render_widget
    5. replace_widget_in_dashboard("run-123", "dash-456", "widget-satisfaction", "widget-table-scores")
    6. Return: {"dashboard_id": "dash-456", "status": "success"}
    ```

    ## WIDGET GENERATION GUIDELINES

    ### Widget Type Determination
    - **Metrics**: "total", "count", "average", "KPI", single values
    - **Charts**: "chart", "graph", "visualize", "trends", comparisons
    - **Tables**: "table", "list", "details", "show data", multiple columns
    - **Text**: "summary", "insights", "explanation", contextual information

    ### Widget Instructions Creation
    When generating widgets for dashboards, create specific instructions:
    - **For metrics**: "show total [metric] as KPI"
    - **For charts**: "create [chart_type] chart of [data] by [category]"
    - **For tables**: "create table showing [columns] from [data_source]"
    - **For text**: "provide summary/insights about [topic]"

    ### Data Source Handling
    - Use provided data_sources from context
    - If no data sources provided, infer from user instructions
    - Pass data sources to render_widget for SQL generation

    ## ERROR HANDLING

    ### Common Error Scenarios
    1. **Dashboard Not Found**: activeDashboard ID doesn't exist
       - Action: Create new dashboard instead
       - Response: Inform user that new dashboard was created

    2. **Widget Generation Failure**: render_widget returns error
       - Action: Skip failed widget, continue with others
       - Response: Include error information in final response

    3. **Storage Failures**: Dashboard save/retrieve operations fail
       - Action: Return error response with specific suggestions
       - Response: Provide actionable error message

    ### Error Response Format
    Always return errors in this format:
    ```json
    {
        "dashboard_id": "error-id",
        "status": "error",
        "error": "Specific error description",
        "code": "ERROR_CODE",
        "suggestions": ["Actionable suggestion 1", "Actionable suggestion 2"]
    }
    ```

    ## POSITIONING AND LAYOUT LOGIC

    ### Widget Positioning Strategy
    - **Metrics**: Top row (y=0), spread horizontally (x=0, 300, 600)
    - **Charts**: Middle area (y=180), side by side (x=0, 300)
    - **Tables**: Lower area (y=500), full width (x=0)
    - **Text**: Flexible positioning based on content and available space

    ### Layout Best Practices
    - Avoid widget overlaps by checking existing positions
    - Maintain consistent spacing between widgets
    - Consider responsive design for different screen sizes
    - Group related widgets logically

    ## RESPONSE FORMAT

    Always return a simple JSON response with dashboard_id and status (similar to widget sub-agent):
    ```json
    {
        "dashboard_id": "dash-uuid",
        "status": "success"
    }
    ```

    For errors, return:
    ```json
    {
        "dashboard_id": "error-uuid",
        "status": "error",
        "error": "Error message",
        "code": "ERROR_CODE",
        "suggestions": ["Suggestion 1", "Suggestion 2"]
    }
    ```

    ## EXAMPLES OF COMPLETE WORKFLOWS

    ### Example 1: New HR Dashboard
    ```
    Input: "create an HR analytics dashboard"
    Context: {"run_id": "run-123", "data_sources": ["employees", "performance"]}

    Workflow:
    1. initialize_dashboard("run-123", "HR Analytics Dashboard", "HR metrics and insights")
    2. render_widget(metric: "total active employees", data_sources: ["employees"])
    3. render_widget(chart: "performance scores by department", data_sources: ["performance"])
    4. render_widget(table: "recent employee performance reviews", data_sources: ["performance"])
    5. For each widget, get widget_id from render_widget
    6. add_widget_to_dashboard("run-123", "dash-uuid", "widget-metric-employees")
    7. add_widget_to_dashboard("run-123", "dash-uuid", "widget-chart-performance")
    8. add_widget_to_dashboard("run-123", "dash-uuid", "widget-table-reviews")
    9. Return: {"dashboard_id": "dash-uuid", "status": "success"}
    ```

    ### Example 2: Update Existing Dashboard
    ```
    Input: "add customer satisfaction metrics to the dashboard"
    Context: {"run_id": "run-123", "activeDashboard": "dash-456", "data_sources": ["customer_feedback"]}

    Workflow:
    1. get_dashboard_data("run-123", "dash-456")
    2. render_widget(metric: "average customer satisfaction", data_sources: ["customer_feedback"])
    3. render_widget(chart: "satisfaction trends over time", data_sources: ["customer_feedback"])
    4. For each widget, get widget_id from render_widget
    5. add_widget_to_dashboard("run-123", "dash-456", "widget-metric-satisfaction")
    6. add_widget_to_dashboard("run-123", "dash-456", "widget-chart-trends")
    7. Return: {"dashboard_id": "dash-456", "status": "success"}
    ```

    Remember: Always use the tools in the correct sequence, handle errors gracefully, and ensure the final dashboard configuration is complete and ready for frontend display.
    make sure to respond only in json as we parse the output and return the dashboard_id.
    Also DO NOT intiate add_widget_to_dashboard or replace_widget_in_dashboard tools in parallel too calls if you are generating multiple widgets, call them one by one.
    """
    
    return create_react_agent(llm, tools, prompt=system_prompt)

@tool
def render_dashboard(instructions: str,data_sources: List[str], configFromFrontend: RunnableConfig = None) -> Dict[str, Any]:
    """
    Renders a dashboard component using a ReAct sub-agent with enhanced dashboard management capabilities.

    Args:
        instructions: User instructions for the dashboard (e.g., "create an HR analytics dashboard").
        configFromFrontend: Optional frontend configuration with table schemas and context.

    Returns:
        Dict with a DashboardComponent or ErrorComponent.
    """
    run_id = str(uuid.uuid4())
    try:
        context = configFromFrontend.get("configurable", {}) if configFromFrontend else {}
        if "run_id" in context:
            run_id = context["run_id"]
        else:
            run_id = str(uuid.uuid4())
        activeDashboard = context.get("activeDashboard", None)
        data_sources = data_sources
        
        # Create enhanced instructions with context
        enhanced_instructions = f"""
{instructions}

## CONTEXT INFORMATION
- Run ID: {run_id}
- Active Dashboard: {activeDashboard or 'none'}
- Available Data Sources: {data_sources}

## OPERATION TYPE
{"Update existing dashboard" if activeDashboard else "Create new dashboard"}
"""
        
        dashboard_agent = create_dashboard_sub_agent()
        response = dashboard_agent.invoke({
            "messages": [{
                "role": "user",
                "content": enhanced_instructions
            }]
        })
        
        response_content = response["messages"][-1].content
        # Handle JSON response parsing 
        # we should check instead of st with and if it has the ```json key any where in the response_content
        if "```json" in response_content:
            response_content = response_content.split("```json")[1].split("```")[0]
        else:
            response_content = response_content.replace("\n", "")
            if not response_content.startswith("{"):
                # If response is not JSON, treat as text response
                return {
                    "type": "error",
                    "id": f"error-{datetime.now().timestamp()}",
                    "data": {
                        "error": "Response is not JSON",
                        "code": "RESPONSE_NOT_JSON",
                        "suggestions": ["Check instructions", "Verify table schemas"]
                    }
                }
        
        # Parse JSON response
        import json
        result = json.loads(response_content)
        
        if result.get("status") == "error":
            return {
                "type": "error",
                "id": f"error-{datetime.now().timestamp()}",
                "data": {
                    "error": result.get("error", "Unknown dashboard error"),
                    "code": result.get("code", "DASHBOARD_OPERATION_FAILED"),
                    "suggestions": result.get("suggestions", ["Check instructions", "Verify data sources"])
                }
            }
        
        # Get dashboard_id from sub-agent response
        dashboard_id = result.get("dashboard_id")
        if not dashboard_id:
            return {
                "type": "error",
                "id": f"error-{datetime.now().timestamp()}",
                "data": {
                    "error": "Dashboard ID not returned from sub-agent",
                    "code": "MISSING_DASHBOARD_ID",
                    "suggestions": ["Check sub-agent response format", "Verify dashboard creation"]
                }
            }
        
        # Retrieve dashboard data using the dashboard_id
        dashboard_data = get_dashboard_data(run_id, dashboard_id)
        return {
            "type": "dashboard",
            "id": dashboard_id,
            "data": {
                "dashboard": dashboard_data,
                "previewMode": True
            }
        }
        
    except Exception as e:
        import traceback
        stack_trace = traceback.format_exc()
        return {
            "type": "error",
            "id": f"error-{datetime.now().timestamp()}",
            "data": {
                "error": str(e),
                "code": "DASHBOARD_RENDER_FAILED",
                "suggestions": ["Check instructions", "Verify table schemas", "Check dashboard configuration"],
                "stack_trace": stack_trace
            }
        }

@tool
def render_error(error_message: str, code: Optional[str] = None, suggestions: Optional[list] = None) -> Dict[str, Any]:
    """
    Renders an error component.

    Args:
        error_message: The error message to display.
        code: Optional error code.
        suggestions: Optional list of suggestions to resolve the error.

    Returns:
        Dict with an ErrorComponent.
    """
    try:
        component_id = f"error-{datetime.now().timestamp()}"
        return {
            "type": "error",
            "id": component_id,
            "data": {
                "error": error_message,
                "code": code,
                "suggestions": suggestions or []
            }
        }
    except Exception as e:
        return {
            "type": "error",
            "id": f"error-{datetime.now().timestamp()}",
            "data": {
                "error": str(e),
                "code": "ERROR_RENDER_FAILED",
                "suggestions": ["Contact support", "Try again"]
            }
        } 