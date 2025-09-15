from typing import List, Dict, Any, Optional, Literal, Union
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

# --- Filter & ComputedField ---
class Filter(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    column: str = Field(..., description="The column to filter on.")
    operator: Literal["equals", "contains", "greater", "less", "in", "date_range"] = Field(..., description="The filter operator.")
    value: Union[str, float] = Field(..., description="The filter value.")

class ComputedField(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    name: str = Field(..., description="The name of the computed field.")
    formula: str = Field(..., description="The formula for the computed field.")
    type: Literal["number", "text", "date"] = Field(..., description="The data type of the computed field.", json_schema_extra={"type": "string"})

# --- Widget-Specific Config Models ---

# Base config with common fields
class BaseWidgetConfig(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    data_source: Optional[str] = Field(None, alias="dataSource", description="The data source table or view.")
    query: Optional[str] = Field(None, description="The SQL query for the widget.")
    filters: Optional[List[Filter]] = Field(None, description="Filters to apply.")
    computed_fields: Optional[List[ComputedField]] = Field(None, alias="computedFields", description="Computed fields.")

# Table widget configuration
class TableWidgetConfig(BaseWidgetConfig):
    columns: Optional[List[Dict[str, str]]] = Field(None, description="Column definitions with header and accessor.")
    sortable: Optional[bool] = Field(None, description="Enable sorting.")
    searchable: Optional[bool] = Field(None, description="Enable search.")
    page_size: Optional[int] = Field(None, alias="pageSize", description="Page size for pagination.")

# Chart widget configuration  
class ChartWidgetConfig(BaseWidgetConfig):
    chart_type: Optional[Literal["bar", "line", "pie", "area"]] = Field(None, alias="chartType", description="The chart type.")
    x_column: Optional[str] = Field(None, alias="xColumn", description="The column for the x-axis.")
    y_column: Optional[str] = Field(None, alias="yColumn", description="The column for the y-axis.")
    color_scheme: Optional[Literal["default", "blue", "green", "purple", "custom"]] = Field(None, alias="colorScheme", description="Color scheme for visualization.")
    show_labels: Optional[bool] = Field(None, alias="showLabels", description="Whether to show labels.")
    show_legend: Optional[bool] = Field(None, alias="showLegend", description="Whether to show legend.")

# Metric widget configuration
class MetricWidgetConfig(BaseWidgetConfig):
    metric_column: Optional[str] = Field(None, alias="metricColumn", description="Metric column name.")
    aggregation_type: Optional[Literal["count", "sum", "avg", "min", "max"]] = Field(None, alias="aggregationType", description="Aggregation function.")
    format: Optional[Literal["number", "currency", "percentage"]] = Field(None, description="Format of values.")
    target_value: Optional[float] = Field(None, alias="targetValue", description="Target value for comparison.")
    show_trend: Optional[bool] = Field(None, alias="showTrend", description="Whether to show trend lines.")
    comparison_period: Optional[Literal["previous", "year", "target"]] = Field(None, alias="comparisonPeriod", description="Comparison period.")

# Text widget configuration
class TextWidgetConfig(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    content: Optional[str] = Field(None, description="Content for text widget.")

# Union type for all widget configs
WidgetConfig = Union[TableWidgetConfig, ChartWidgetConfig, MetricWidgetConfig, TextWidgetConfig]

# --- Widget ---

class Position(BaseModel):
    x: float = Field(..., description="X position.")
    y: float = Field(..., description="Y position.")

class Size(BaseModel):
    width: float = Field(..., description="Width.")
    height: float = Field(..., description="Height.")

class Widget(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    id: str = Field(..., description="Unique identifier for the widget.")
    type: Literal["chart", "table", "metric", "text"] = Field(..., description="The widget type.", json_schema_extra={"type": "string"})
    title: str = Field(..., description="Title for the widget.")
    position: Position = Field(..., description="X and Y position.")
    size: Size = Field(..., description="Width and height.")
    config: WidgetConfig = Field(..., description="Configuration of the widget.")

# --- Dashboard ---
class Dashboard(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    id: str = Field(..., description="Unique identifier for the dashboard.")
    name: str = Field(..., description="Name of the dashboard.")
    description: Optional[str] = Field(..., description="Description of the dashboard.")
    widgets: List[Widget] = Field(..., description="List of widgets.")
    is_published: bool = Field(..., alias="isPublished", description="Is the dashboard published?")
    is_template: bool = Field(..., alias="isTemplate", description="Is this a dashboard template?")
    created_at: Optional[str] = Field(..., alias="createdAt", description="Creation timestamp.")
    updated_at: Optional[str] = Field(..., alias="updatedAt", description="Last update timestamp.")

# --- Component Data Classes ---
class WidgetComponentData(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    widget: Widget = Field(..., description="Widget configuration.")
    query: str = Field(..., description="Executed SQL query.")
    table_names: List[str] = Field(..., description="Source table names.")
    show_sql: bool = Field(..., description="Whether to show SQL query.")

class DashboardComponentData(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    dashboard: Dashboard = Field(..., description="Dashboard configuration.")
    preview_mode: bool = Field(True, description="Whether preview is enabled.")
    owner: Optional[str] = Field(None, description="Owner of the dashboard.")

class SqlResultComponentData(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    query: str = Field(..., description="SQL query.")
    result_preview: List[Dict[str, Union[str, float, None]]] = Field(..., description="Query result preview.")
    table_names: List[str] = Field(..., description="Names of the queried tables.")
    execution_time_ms: float = Field(..., description="Execution time in milliseconds.")

class UploadPromptComponentData(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    message: str = Field(..., description="Upload message.")
    accepted_file_types: List[str] = Field(..., description="Accepted file types.")
    target_table: str = Field(..., description="Target table to upload to.")

class ErrorComponentData(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    error: str = Field(..., description="Error message.")
    code: Optional[str] = Field(..., description="Error code.")
    suggestions: Optional[List[str]] = Field(..., description="Suggestions to fix the error.")

# -- Intermediate Models to talk between sub agents and sturctured generation tools ---
# Input model for the LLM call
class WidgetInputData(BaseModel):
    sql_query: Optional[str] = Field(None, description="The generated SQL query.")
    result_preview: Optional[List[Dict[str, Any]]] = Field(None, description="Preview of the query results.")
    user_instructions: str = Field(..., description="User instructions for the widget.")
    widget_type: Literal["chart", "table", "metric", "text"] = Field(..., description="Type of the widget.")
    data_sources: Optional[List[str]] = Field(None, description="List of data source tables.")
    run_id: str = Field(..., description="Unique ID for the agent run.")
    show_sql: Optional[bool] = Field(True, description="Whether to show the SQL query.")

# Input model for dashboard operations
class DashboardInputData(BaseModel):
    user_instructions: str = Field(..., description="User instructions for the dashboard.")
    dashboard_id: Optional[str] = Field(None, description="Existing dashboard ID for updates.")
    dashboard_name: Optional[str] = Field(None, description="Name for new dashboard.")
    dashboard_description: Optional[str] = Field(None, description="Description for new dashboard.")
    run_id: str = Field(..., description="Unique ID for the agent run.")
    widget_instructions: List[str] = Field(default_factory=list, description="Individual widget requests.")
    data_sources: List[str] = Field(default_factory=list, description="Available data sources.")

# --- Widget-Specific Response Models ---

# Table widget response
class TableWidget(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    id: str = Field(..., description="Unique identifier for the widget.")
    type: Literal["table"] = Field(..., description="The widget type.")
    title: str = Field(..., description="Title for the widget.")
    position: Position = Field(..., description="X and Y position.")
    size: Size = Field(..., description="Width and height.")
    config: TableWidgetConfig = Field(..., description="Table widget configuration.")

# Chart widget response
class ChartWidget(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    id: str = Field(..., description="Unique identifier for the widget.")
    type: Literal["chart"] = Field(..., description="The widget type.")
    title: str = Field(..., description="Title for the widget.")
    position: Position = Field(..., description="X and Y position.")
    size: Size = Field(..., description="Width and height.")
    config: ChartWidgetConfig = Field(..., description="Chart widget configuration.")

# Metric widget response
class MetricWidget(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    id: str = Field(..., description="Unique identifier for the widget.")
    type: Literal["metric"] = Field(..., description="The widget type.")
    title: str = Field(..., description="Title for the widget.")
    position: Position = Field(..., description="X and Y position.")
    size: Size = Field(..., description="Width and height.")
    config: MetricWidgetConfig = Field(..., description="Metric widget configuration.")

# Text widget response
class TextWidget(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    id: str = Field(..., description="Unique identifier for the widget.")
    type: Literal["text"] = Field(..., description="The widget type.")
    title: str = Field(..., description="Title for the widget.")
    position: Position = Field(..., description="X and Y position.")
    size: Size = Field(..., description="Width and height.")
    config: TextWidgetConfig = Field(..., description="Text widget configuration.")

# Widget-specific component data models
class TableWidgetComponentData(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    widget: TableWidget = Field(..., description="Table widget configuration.")
    query: str = Field(..., description="Executed SQL query.")
    table_names: List[str] = Field(..., description="Source table names.")
    show_sql: bool = Field(..., description="Whether to show SQL query.")

class ChartWidgetComponentData(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    widget: ChartWidget = Field(..., description="Chart widget configuration.")
    query: str = Field(..., description="Executed SQL query.")
    table_names: List[str] = Field(..., description="Source table names.")
    show_sql: bool = Field(..., description="Whether to show SQL query.")

class MetricWidgetComponentData(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    widget: MetricWidget = Field(..., description="Metric widget configuration.")
    query: str = Field(..., description="Executed SQL query.")
    table_names: List[str] = Field(..., description="Source table names.")
    show_sql: bool = Field(..., description="Whether to show SQL query.")

class TextWidgetComponentData(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    widget: TextWidget = Field(..., description="Text widget configuration.")
    query: str = Field("", description="Empty query for text widgets.")
    table_names: List[str] = Field(default_factory=list, description="Empty table names for text widgets.")
    show_sql: bool = Field(False, description="Never show SQL for text widgets.")

# Widget-specific response models
class TableWidgetResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["widget"]
    id: str
    data: TableWidgetComponentData

class ChartWidgetResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["widget"]
    id: str
    data: ChartWidgetComponentData

class MetricWidgetResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["widget"]
    id: str
    data: MetricWidgetComponentData

class TextWidgetResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["widget"]
    id: str
    data: TextWidgetComponentData

class ErrorWidgetResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["error"]
    id: str
    data: ErrorComponentData

# --- Final Components ---
class WidgetComponent(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["widget"] = Field(..., description="Component type: 'widget'.", json_schema_extra={"type": "string"})
    id: str = Field(..., description="Component ID.")
    data: WidgetComponentData = Field(..., description="Widget-related data.")

class WidgetResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["widget", "error"]
    id: str
    data: Union[WidgetComponentData, ErrorComponentData]

class DashboardComponent(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["dashboard"] = Field(..., description="Component type: 'dashboard'.", json_schema_extra={"type": "string"})
    id: str = Field(..., description="Component ID.")
    data: DashboardComponentData = Field(..., description="Dashboard-related data.")

class DashboardResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["dashboard", "error"]
    id: str
    data: Union[DashboardComponentData, ErrorComponentData]

class SqlResultComponent(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["sql_result"] = Field(..., description="Component type: 'sql_result'.", json_schema_extra={"type": "string"})
    id: str = Field(..., description="Component ID.")
    data: SqlResultComponentData = Field(..., description="SQL result data.")

class UploadPromptComponent(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["upload_prompt"] = Field(..., description="Component type: 'upload_prompt'.", json_schema_extra={"type": "string"})
    id: str = Field(..., description="Component ID.")
    data: UploadPromptComponentData = Field(..., description="Upload prompt data.")

class ErrorComponent(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["error"] = Field(..., description="Component type: 'error'.", json_schema_extra={"type": "string"})
    id: str = Field(..., description="Component ID.")
    data: ErrorComponentData = Field(..., description="Error details.") 