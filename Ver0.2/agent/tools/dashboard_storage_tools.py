import json
import pandas as pd
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from langchain_core.tools import tool

from agent.tools.sql_storage_tools import get_widget_data
from .storage_tools import db_manager
from .models import ErrorComponentData, DashboardInputData, Dashboard, DashboardComponentData

# Core dashboard storage functions
def save_dashboard_data(run_id: str, dashboard_id: str, data: dict, status: str = "success"):
    """Save dashboard data as a new version."""
    _ensure_dashboard_table_exists()
    try:
        current_version = _get_next_version(dashboard_id)
        db_manager.conn.execute("""
            INSERT INTO dashboard_data (run_id, dashboard_id, data, created_at, updated_at, status, version)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [
            run_id,
            dashboard_id,
            json.dumps(data),
            datetime.now().isoformat(),
            datetime.now().isoformat(),
            status,
            current_version
        ])
    except Exception as e:
        raise RuntimeError(f"Failed to save dashboard data: {str(e)}")

def _get_next_version(dashboard_id: str) -> int:
    """Get the next version number for a dashboard."""
    try:
        df = db_manager.execute_query(
            f"SELECT MAX(version) as max_version FROM dashboard_data WHERE dashboard_id = '{dashboard_id}'"
        )
        max_version = int(df.iloc[0]["max_version"]) + 1 if not df.empty and df.iloc[0]["max_version"] is not None else 1

        return max_version
    except:
        return 1
       
def get_dashboard_data(run_id: str, dashboard_id: str) -> dict:
    """Retrieve dashboard data from the store."""
    try:
        df = db_manager.execute_query(
            f"SELECT data FROM dashboard_data WHERE run_id = '{run_id}' AND dashboard_id = '{dashboard_id}' ORDER BY version DESC LIMIT 1"
        )
        if not df.empty:
            return json.loads(df.iloc[0]["data"])
        raise RuntimeError(f"No dashboard data found for run_id: {run_id}, dashboard_id: {dashboard_id}")
    except Exception as e:
        raise RuntimeError(f"Failed to retrieve dashboard data: {str(e)}")

def cleanup_dashboard_data(run_id: str):
    """Clean up dashboard data for a specific run_id."""
    try:
        db_manager.execute_query(f"DELETE FROM dashboard_data WHERE run_id = '{run_id}'")
    except Exception as e:
        print(f"Warning: Failed to cleanup dashboard data for run_id {run_id}: {str(e)}")

def get_dashboard_versions(dashboard_id: str) -> List[dict]:
    """Get all versions of a dashboard."""
    try:
        df = db_manager.execute_query(
            f"SELECT run_id, version, created_at, updated_at, status FROM dashboard_data WHERE dashboard_id = '{dashboard_id}' ORDER BY version DESC"
        )
        return df.to_dict(orient="records")
    except Exception as e:
        print(f"Warning: Failed to get dashboard versions for {dashboard_id}: {str(e)}")
        return []



def initialize_dashboard(run_id: str, dashboard_name: str, description: str = "", dashboard_id: str = None) -> tuple[str, str]:
    """Initialize a new dashboard with basic structure and metadata.

    Args:
        run_id (str): The run ID associated with the dashboard.
        dashboard_name (str): The name of the dashboard.
        description (str, optional): Description of the dashboard. Defaults to "".
        dashboard_id (str, optional): The dashboard ID. If None or invalid, a new UUID is generated. Defaults to None.

    Returns:
        tuple[str, str]: A tuple containing the dashboard ID and a message indicating initialization status.

    Raises:
        RuntimeError: If saving the dashboard data fails.
    """
    # Check if dashboard_id is None or invalid
    if dashboard_id is None:
        dashboard_id = str(uuid.uuid4())
        message = f"Dashboard initialized with new ID: {dashboard_id}"
    else:
        # Validate if dashboard_id is a valid UUID
        try:
            uuid_obj = uuid.UUID(dashboard_id, version=4)
            if str(uuid_obj) == dashboard_id:  # Ensure exact match
                message = f"Dashboard initialized with provided ID: {dashboard_id}"
            else:
                dashboard_id = str(uuid.uuid4())
                message = f"Invalid dashboard_id provided. Initialized with new ID: {dashboard_id}"
        except ValueError:
            dashboard_id = str(uuid.uuid4())
            message = f"Invalid dashboard_id provided. Initialized with new ID: {dashboard_id}"

    dashboard_config = {
        "id": dashboard_id,
        "name": dashboard_name,
        "description": description,
        "widgets": [],
        "layout": {
            "columns": 12,
            "rowHeight": 30,
            "margin": [10, 10]
        },
        "isPublished": False,
        "isTemplate": False,
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat(),
        "version": 1
    }

    try:
        save_dashboard_data(run_id, dashboard_id, dashboard_config, "success")
        return message
    except Exception as e:
        raise RuntimeError(f"Failed to initialize dashboard: {str(e)}")
    
def add_widget_to_dashboard(run_id: str, dashboard_id: str, widget_id: str = None) -> dict:
    """Add a new widget to an existing dashboard."""
    try:
        dashboard_config = get_dashboard_data(run_id, dashboard_id)
        widget_data = get_widget_data(run_id, widget_id)
        widget_config = widget_data.get("data", {}).get("widget", {})
        dashboard_config["widgets"].append(widget_config)
        dashboard_config["updatedAt"] = datetime.now().isoformat()
        save_dashboard_data(run_id, dashboard_id, dashboard_config, "success")
        return dashboard_config
    except Exception as e:
        raise RuntimeError(f"Failed to add widget to dashboard: {str(e)}")

def replace_widget_in_dashboard(run_id: str, dashboard_id: str, old_widget_id: str, new_widget_id: str) -> dict:
    """replace a widget in the dashboard with a new widget"""
    try:
        dashboard_config = get_dashboard_data(run_id, dashboard_id)
        widget_data = get_widget_data(run_id, new_widget_id)
        widget_config = widget_data.get("data", {}).get("widget", {})
        widget_found = False
        for i, widget in enumerate(dashboard_config["widgets"]):
            if widget.get("id") == old_widget_id:
                dashboard_config["widgets"][i] = widget_config
                widget_found = True
                break
        if not widget_found:
            raise RuntimeError(f"Widget with id {old_widget_id} not found in dashboard")
        dashboard_config["updatedAt"] = datetime.now().isoformat()
        save_dashboard_data(run_id, dashboard_id, dashboard_config, "success")
        return dashboard_config
    except Exception as e:
        raise RuntimeError(f"Failed to replace widget in dashboard: {str(e)}")

def remove_widget_from_dashboard(run_id: str, dashboard_id: str, widget_id: str) -> dict:
    """Remove a widget from the dashboard."""
    try:
        # Get current dashboard
        dashboard_config = get_dashboard_data(run_id, dashboard_id)
        
        # Remove the widget
        original_count = len(dashboard_config["widgets"])
        dashboard_config["widgets"] = [w for w in dashboard_config["widgets"] if w.get("id") != widget_id]
        
        if len(dashboard_config["widgets"]) == original_count:
            raise RuntimeError(f"Widget with id {widget_id} not found in dashboard")
        
        dashboard_config["updatedAt"] = datetime.now().isoformat()
        
        # Save updated dashboard
        save_dashboard_data(run_id, dashboard_id, dashboard_config, "success")
        
        return dashboard_config
    except Exception as e:
        raise RuntimeError(f"Failed to remove widget from dashboard: {str(e)}")

def update_dashboard_metadata(run_id: str, dashboard_id: str, name: str = None, description: str = None) -> dict:
    """Update dashboard name and/or description."""
    try:
        # Get current dashboard
        dashboard_config = get_dashboard_data(run_id, dashboard_id)
        
        # Update metadata
        if name is not None:
            dashboard_config["name"] = name
        if description is not None:
            dashboard_config["description"] = description
        
        dashboard_config["updatedAt"] = datetime.now().isoformat()
        
        # Save updated dashboard
        save_dashboard_data(run_id, dashboard_id, dashboard_config, "success")
        
        return dashboard_config
    except Exception as e:
        raise RuntimeError(f"Failed to update dashboard metadata: {str(e)}")

# Helper functions
def _ensure_dashboard_table_exists():
    """Ensure the dashboard_data table exists with proper schema."""
    try:
        # Check if table exists by trying to query it
        db_manager.execute_query("SELECT COUNT(*) FROM dashboard_data LIMIT 1")
    except:
        # Table doesn't exist, create it
        try:
            db_manager.execute_query("""
                CREATE TABLE IF NOT EXISTS dashboard_data (
                    run_id TEXT,
                    dashboard_id TEXT,
                    data TEXT,
                    created_at TEXT,
                    updated_at TEXT,
                    status TEXT,
                    version INTEGER DEFAULT 1,
                    PRIMARY KEY (run_id, dashboard_id, version)
                )
            """)
        except Exception as e:
            print(f"Warning: Failed to create dashboard_data table: {str(e)}")

# Widget positioning and layout logic
def calculate_widget_position(dashboard_widgets: List[dict], new_widget_type: str) -> dict:
    """Calculate optimal position for new widget based on existing layout and widget type."""
    
    # Widget type positioning preferences
    position_rules = {
        "metric": {"preferred_y": 0, "preferred_x_positions": [0, 300, 600], "width": 280, "height": 160},
        "chart": {"preferred_y": 180, "preferred_x_positions": [0, 300], "width": 500, "height": 300},
        "table": {"preferred_y": 500, "preferred_x_positions": [0], "width": 580, "height": 300},
        "text": {"preferred_y": 400, "preferred_x_positions": [0, 300], "width": 400, "height": 200}
    }
    
    if new_widget_type not in position_rules:
        # Default positioning for unknown widget types
        return {"x": 0, "y": 600}
    
    rules = position_rules[new_widget_type]
    preferred_y = rules["preferred_y"]
    preferred_x_positions = rules["preferred_x_positions"]
    
    # Get existing widget positions
    occupied_positions = []
    for widget in dashboard_widgets:
        pos = widget.get("position", {})
        size = widget.get("size", {})
        if pos and size:
            occupied_positions.append({
                "x": pos.get("x", 0),
                "y": pos.get("y", 0),
                "width": size.get("width", 0),
                "height": size.get("height", 0)
            })
    
    # Find first available position
    for x_pos in preferred_x_positions:
        if not _position_overlaps(x_pos, preferred_y, rules["width"], rules["height"], occupied_positions):
            return {"x": x_pos, "y": preferred_y}
    
    # If preferred positions are taken, find next available row
    next_y = _find_next_available_row(preferred_y, occupied_positions)
    return {"x": preferred_x_positions[0], "y": next_y}

def get_widget_dimensions(widget_type: str) -> dict:
    """Get appropriate dimensions for each widget type."""
    dimensions = {
        "metric": {"width": 280, "height": 160},
        "chart": {"width": 500, "height": 300},
        "table": {"width": 580, "height": 300},
        "text": {"width": 400, "height": 200}
    }
    
    return dimensions.get(widget_type, {"width": 400, "height": 250})

def _position_overlaps(x: float, y: float, width: float, height: float, occupied_positions: List[dict]) -> bool:
    """Check if a position overlaps with existing widgets."""
    margin = 20  # Minimum margin between widgets
    
    for occupied in occupied_positions:
        # Check for overlap with margin
        if (x < occupied["x"] + occupied["width"] + margin and
            x + width + margin > occupied["x"] and
            y < occupied["y"] + occupied["height"] + margin and
            y + height + margin > occupied["y"]):
            return True
    
    return False

def _find_next_available_row(preferred_y: float, occupied_positions: List[dict]) -> float:
    """Find the next available row below the preferred Y position."""
    if not occupied_positions:
        return preferred_y
    
    # Find the lowest Y position that doesn't conflict
    max_y_in_row = preferred_y
    for occupied in occupied_positions:
        if occupied["y"] >= preferred_y - 50 and occupied["y"] <= preferred_y + 50:  # Same row range
            max_y_in_row = max(max_y_in_row, occupied["y"] + occupied["height"])
    
    return max_y_in_row + 30  # Add some spacing

def optimize_dashboard_layout(dashboard_config: dict) -> dict:
    """Optimize the layout of all widgets in a dashboard."""
    if not dashboard_config.get("widgets"):
        return dashboard_config
    
    # Sort widgets by type priority (metrics first, then charts, then tables, then text)
    type_priority = {"metric": 0, "chart": 1, "table": 2, "text": 3}
    
    widgets = dashboard_config["widgets"].copy()
    widgets.sort(key=lambda w: type_priority.get(w.get("type", "text"), 3))
    
    # Recalculate positions for all widgets
    optimized_widgets = []
    for widget in widgets:
        widget_type = widget.get("type", "text")
        
        # Calculate new position
        new_position = calculate_widget_position(optimized_widgets, widget_type)
        new_dimensions = get_widget_dimensions(widget_type)
        
        # Update widget position and size
        widget["position"] = new_position
        widget["size"] = new_dimensions
        
        optimized_widgets.append(widget)
    
    dashboard_config["widgets"] = optimized_widgets
    return dashboard_config

# Validation and error handling functions
def validate_dashboard_config(dashboard_config: dict) -> List[str]:
    """Validate dashboard configuration and return list of errors."""
    errors = []
    
    # Check required fields
    if not dashboard_config.get("id"):
        errors.append("Dashboard ID is required")
    
    if not dashboard_config.get("name"):
        errors.append("Dashboard name is required")
    
    if not isinstance(dashboard_config.get("widgets", []), list):
        errors.append("Widgets must be a list")
    
    # Validate widgets
    for i, widget in enumerate(dashboard_config.get("widgets", [])):
        widget_errors = validate_widget_config(widget, i)
        errors.extend(widget_errors)
    
    return errors

def validate_widget_config(widget: dict, widget_index: int) -> List[str]:
    """Validate individual widget configuration."""
    errors = []
    prefix = f"Widget {widget_index + 1}"
    
    # Check required fields
    if not widget.get("id"):
        errors.append(f"{prefix}: Widget ID is required")
    
    if not widget.get("type"):
        errors.append(f"{prefix}: Widget type is required")
    elif widget["type"] not in ["chart", "table", "metric", "text"]:
        errors.append(f"{prefix}: Invalid widget type '{widget['type']}'")
    
    if not widget.get("title"):
        errors.append(f"{prefix}: Widget title is required")
    
    # Check position and size
    position = widget.get("position", {})
    if not isinstance(position, dict) or "x" not in position or "y" not in position:
        errors.append(f"{prefix}: Valid position with x and y coordinates is required")
    
    size = widget.get("size", {})
    if not isinstance(size, dict) or "width" not in size or "height" not in size:
        errors.append(f"{prefix}: Valid size with width and height is required")
    
    # Validate widget-specific configuration
    config = widget.get("config", {})
    widget_type = widget.get("type")
    
    if widget_type in ["chart", "table", "metric"]:
        if not config.get("dataSource") and not config.get("query"):
            errors.append(f"{prefix}: Data source or query is required for {widget_type} widgets")
    
    if widget_type == "chart":
        if not config.get("chartType"):
            errors.append(f"{prefix}: Chart type is required for chart widgets")
        if not config.get("xColumn") or not config.get("yColumn"):
            errors.append(f"{prefix}: X and Y columns are required for chart widgets")
    
    if widget_type == "table":
        if not config.get("columns"):
            errors.append(f"{prefix}: Columns configuration is required for table widgets")
    
    if widget_type == "metric":
        if not config.get("metricColumn"):
            errors.append(f"{prefix}: Metric column is required for metric widgets")
    
    if widget_type == "text":
        if not config.get("content"):
            errors.append(f"{prefix}: Content is required for text widgets")
    
    return errors

def handle_dashboard_error(error: Exception, operation: str, dashboard_id: str = None) -> Dict[str, Any]:
    """Handle dashboard errors and return standardized error response."""
    error_message = str(error)
    
    # Determine error code and suggestions based on error type and operation
    if "not found" in error_message.lower():
        code = "DASHBOARD_NOT_FOUND"
        suggestions = [
            "Verify the dashboard ID is correct",
            "Check if the dashboard exists in the system",
            "Try creating a new dashboard instead"
        ]
    elif "invalid" in error_message.lower() or "validation" in error_message.lower():
        code = "INVALID_DASHBOARD_CONFIG"
        suggestions = [
            "Check dashboard configuration format",
            "Ensure all required fields are present",
            "Validate widget configurations"
        ]
    elif "storage" in error_message.lower() or "database" in error_message.lower():
        code = "STORAGE_ERROR"
        suggestions = [
            "Check database connection",
            "Verify storage permissions",
            "Try the operation again"
        ]
    elif "widget" in error_message.lower():
        code = "WIDGET_ERROR"
        suggestions = [
            "Check widget configuration",
            "Verify data sources are available",
            "Ensure widget type is supported"
        ]
    else:
        code = f"{operation.upper()}_FAILED"
        suggestions = [
            "Check the operation parameters",
            "Verify system configuration",
            "Contact support if the issue persists"
        ]
    
    return {
        "dashboard_id": dashboard_id or f"error-{uuid.uuid4()}",
        "status": "error",
        "error": error_message,
        "code": code,
        "suggestions": suggestions
    }

# Dashboard generation tool
@tool
def generate_dashboard_response(dashboard_input: DashboardInputData) -> Dict[str, Any]:
    """
    Generate a final dashboard response for frontend display.
    
    Args:
        dashboard_input: Input data containing dashboard configuration and metadata.
        
    Returns:
        Dict with dashboard_id, status, and dashboard_config or error information.
    """
    try:
        # Get the dashboard data
        dashboard_config = get_dashboard_data(dashboard_input.run_id, dashboard_input.dashboard_id)
        
        return {
            "dashboard_id": dashboard_input.dashboard_id,
            "status": "success",
            "dashboard_config": dashboard_config
        }
        
    except Exception as e:
        return {
            "dashboard_id": dashboard_input.dashboard_id or f"error-{uuid.uuid4()}",
            "status": "error",
            "error": str(e),
            "code": "DASHBOARD_GENERATION_FAILED",
            "suggestions": [
                "Check if dashboard exists",
                "Verify run_id and dashboard_id",
                "Ensure dashboard was properly saved"
            ]
        }
    

def save_dashboard_context(configFromFrontend):
    """
    Pulls ActiveDashboard data and its dashboard_id out of the agent’s RunnableConfig.
    And then saves in the dashboard table with the current run id and dashboard id for agent to access.
    We should save if the dashboard data is not already saved in the dashboard table.
    return the dashboard data or text that no active dashboard.
    """
    cfg = (configFromFrontend or {}).get("configurable", {})
    run_id = cfg["run_id"]
    activeDashboard = cfg.get("activeDashboard", None)
    print("this is the active dashboard", activeDashboard)

    if not activeDashboard:
        return "No active dashboard"
    
    activeDashboardId = activeDashboard[0].get("id", None)
    activeDashboardData = activeDashboard[0]
    save_dashboard_data(run_id, activeDashboardId, activeDashboardData, "success")
    
    return activeDashboard