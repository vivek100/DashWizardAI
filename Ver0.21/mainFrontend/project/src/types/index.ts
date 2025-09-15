export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'csv' | 'sql';
  columns: string[];
  rowCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  isPublished: boolean;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced Widget interface for React Flow integration
export interface Widget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'text';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: WidgetConfig;
  // React Flow specific properties
  nodeType?: 'widget';
  selected?: boolean;
  dragging?: boolean;
  resizing?: boolean;
}

// React Flow Node type for widgets
export interface WidgetNode {
  id: string;
  type: 'widget';
  position: { x: number; y: number };
  data: {
    widget: Widget;
    onSelect: (widget: Widget) => void;
    onConfigure: (widget: Widget) => void;
    onDelete: (widgetId: string) => void;
    onResize: (widgetId: string, size: { width: number; height: number }) => void;
    isSelected: boolean;
    isPreviewMode: boolean;
  };
  style?: {
    width: number;
    height: number;
  };
}

// Widget interaction modes
export type WidgetInteractionMode = 'select' | 'drag' | 'resize' | 'configure' | 'scroll';

// Widget action types
export interface WidgetAction {
  type: 'select' | 'configure' | 'delete' | 'resize';
  widgetId: string;
  payload?: any;
}

export interface WidgetConfig {
  // Data source
  dataSource?: string;
  query?: string;
  
  // Chart specific
  chartType?: 'bar' | 'line' | 'pie' | 'area';
  xColumn?: string;
  yColumn?: string;
  colorScheme?: 'default' | 'blue' | 'green' | 'purple' | 'custom';
  customColors?: string[];
  showLabels?: boolean;
  showLegend?: boolean;
  format?: 'number' | 'currency' | 'percentage';
  
  // Metric specific
  metricColumn?: string;
  aggregationType?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  targetValue?: number;
  showTrend?: boolean;
  comparisonPeriod?: 'previous' | 'year' | 'target';
  
  // Table specific
  pageSize?: number;
  sortable?: boolean;
  searchable?: boolean;
  exportable?: boolean;
  showRowNumbers?: boolean;
  alternateRowColors?: boolean;
  
  // Text specific
  content?: string;
  
  // Styling
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  padding?: number;
  fontFamily?: string;
  fontSize?: string;
  customCSS?: string;
  
  // Responsive
  mobileResponsive?: boolean;
  tabletOptimized?: boolean;
  desktopEnhanced?: boolean;
  breakpoints?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  
  // Filters and computed fields
  filters?: Filter[];
  computedFields?: ComputedField[];
  
  // Advanced features
  autoRefresh?: boolean;
  refreshInterval?: number;
  maxRetries?: number;
  cacheResults?: boolean;
  cacheDuration?: number;
  lazyLoading?: boolean;
  debouncedUpdates?: boolean;
  debounceDelay?: number;
  queryTimeout?: number;
  
  // VLOOKUP
  vlookupTables?: VlookupTable[];
  
  // Aggregations
  groupByColumns?: string;
  havingClause?: string;
  orderByColumn?: string;
  orderByDirection?: 'ASC' | 'DESC';
  limitRows?: number;
  
  // Custom code
  customJS?: string;
}

export interface Filter {
  column: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'in' | 'date_range';
  value: string | number;
}

export interface ComputedField {
  name: string;
  formula: string;
  type: 'number' | 'text' | 'date';
}

export interface VlookupTable {
  id: string;
  sourceTable: string;
  targetTable: string;
  sourceColumn: string;
  targetColumn: string;
  returnColumn: string;
  alias: string;
}

export interface Aggregation {
  column: string;
  function: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface SavedQuery {
  id: string;
  name: string;
  query: string;
  description?: string;
  createdAt: Date;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  suggestions?: string[];
}


// AI Response Types
export interface AIResponse {
  text: string;
  components?: AIComponent[];
  actions?: AIAction[];
}


export interface AIAction {
  type: 'save_dashboard' | 'update_dashboard' | 'open_editor' | 'execute_query' | 'upload_csv';
  payload: any;
}

// Enhanced Chat Message with AI Response
export interface EnhancedChatMessage extends ChatMessage {
  aiResponse?: AIResponse;
}

// Component Data Types
export interface WidgetComponentData {
  widget: Widget;
  queryResult?: any[];
  showSQL?: boolean;
}

export interface DashboardComponentData {
  dashboard: Dashboard;
  previewMode?: boolean;
}

export interface SQLResultComponentData {
  query: string;
  result: any[];
  tableName?: string;
  executionTime?: number;
}

export interface UploadPromptComponentData {
  message: string;
  acceptedTypes: string[];
  targetTable?: string;
}

export interface DashboardConfigComponentData {
  config: Dashboard;
  changes: Partial<Dashboard>;
}

export interface ErrorComponentData {
  error: string;
  code?: string;
  suggestions?: string[];
}

export interface ToolCallComponentData {
  name: string;
  args: any;
}

export interface ToolResultComponentData {
  name: string;
  result: any;
  parseError?: string;
  warningMessage?: string;
}

export type AIComponent = 
  | { type: 'widget'; id: string; data: WidgetComponentData }
  | { type: 'dashboard'; id: string; data: DashboardComponentData }
  | { type: 'sql_result'; id: string; data: SQLResultComponentData }
  | { type: 'upload_prompt'; id: string; data: UploadPromptComponentData }
  | { type: 'error'; id: string; data: ErrorComponentData }
  | { type: 'tool_call'; id: string; data: ToolCallComponentData }
  | { type: 'tool_result'; id: string; data: ToolResultComponentData };

// Thread management types
export interface Thread {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  dashboard_id?: string | null;
  is_new?: boolean;
}

// Supabase Database types
export type Database = {
  public: {
    Tables: {
      threads: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
          dashboard_id: string | null;
          is_new: boolean;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          dashboard_id?: string | null;
          is_new?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
          dashboard_id?: string | null;
          is_new?: boolean;
        };
      };
    };
  };
};