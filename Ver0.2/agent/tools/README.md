# Visualization Tools - Modular Structure

This document describes the refactored modular structure of the visualization tools.

## File Structure

### 1. `models.py`
Contains all Pydantic models used across the visualization system:
- **Filter & ComputedField**: Data filtering and computed field models
- **WidgetConfig**: Widget configuration model with all chart, table, metric, and text options
- **Widget**: Complete widget model with position, size, and configuration
- **Dashboard**: Dashboard model containing multiple widgets
- **Component Data Classes**: Data models for different component types
  - `WidgetComponentData`
  - `DashboardComponentData`
  - `SqlResultComponentData`
  - `UploadPromptComponentData`
  - `ErrorComponentData`
- **Final Components**: Response models for different component types
  - `WidgetComponent`, `WidgetResponse`
  - `DashboardComponent`, `DashboardResponse`
  - `SqlResultComponent`
  - `UploadPromptComponent`
  - `ErrorComponent`

### 2. `sql_storage_tools.py`
Contains SQL generation and data storage functionality:
- **Storage Functions**:
  - `save_widget_data()`: Save widget data to database
  - `get_widget_data()`: Retrieve widget data from database
  - `cleanup_widget_data()`: Clean up widget data
- **SQL Tools**:
  - `generate_sql()`: Generate and validate SQL queries from natural language

### 3. `widget_tools.py`
Contains widget-specific tools and agents:
- **Tools**:
  - `generate_widget_data()`: Save widget response data to store
  - `render_widget()`: Main widget rendering tool
  - `render_upload_csv_dialog()`: CSV upload dialog tool
- **Agents**:
  - `create_widget_sub_agent()`: Sub-agent for widget creation with SQL generation workflow

### 4. `dashboard_tools.py`
Contains dashboard-specific tools and agents:
- **Tools**:
  - `render_dashboard()`: Main dashboard rendering tool
  - `render_error()`: Error component rendering tool
- **Agents**:
  - `create_dashboard_sub_agent()`: Sub-agent for dashboard creation

### 5. `visualization_tools.py`
Main entry point that imports from all modules for backward compatibility:
- Imports all models from `models.py`
- Imports SQL and storage tools from `sql_storage_tools.py`
- Imports widget tools from `widget_tools.py`
- Imports dashboard tools from `dashboard_tools.py`
- Provides `__all__` export list for clean imports

## Key Changes Made

### 1. Widget Sub-Agent Workflow Update
- Now follows the requested workflow: `instructions` → `generate_sql` → `generate_widget_data`
- `generate_widget_data` now accepts `WidgetResponse` objects instead of `WidgetConfig`
- Added proper error handling with 3-retry limit
- Enhanced clarification handling for unclear instructions

### 2. Data Sources Parameter
- `render_widget()` now requires `data_sources` parameter (list of table names)
- Updated main agent prompt to reflect this change
- Sub-agent uses data sources for SQL generation

### 3. Improved Error Handling
- Better error messages with specific suggestions
- Stack trace inclusion for debugging
- Proper error propagation from sub-agents

### 4. SQL Generation Enhancements
- Handles SQL code block formatting (removes ```sql markers)
- Better query validation and error reporting
- Preview-only result data (first 3 rows) for performance

## Usage Examples

### Widget Creation
```python
from .tools.widget_tools import render_widget

# Create a pie chart widget
result = await render_widget(
    instructions="create a pie chart of customer segments",
    data_sources=["customer_data"]
)
```

### Dashboard Creation
```python
from .tools.dashboard_tools import render_dashboard

# Create an HR analytics dashboard
result = render_dashboard(
    instructions="create an HR analytics dashboard with employee metrics"
)
```

### Direct SQL Generation
```python
from .tools.sql_storage_tools import generate_sql

# Generate SQL for analysis
result = await generate_sql(
    query_description="total revenue by product category",
    data_sources=["sales_data"]
)
```

## Benefits of Modular Structure

1. **Maintainability**: Easier to maintain and update individual components
2. **Testability**: Each module can be tested independently
3. **Reusability**: Components can be reused across different parts of the system
4. **Clarity**: Clear separation of concerns between models, SQL, widgets, and dashboards
5. **Performance**: Faster imports and reduced memory footprint
6. **Extensibility**: Easy to add new widget types or dashboard features

## Backward Compatibility

The main `visualization_tools.py` file maintains full backward compatibility by re-exporting all functions and classes from the modular files. Existing code will continue to work without changes. 