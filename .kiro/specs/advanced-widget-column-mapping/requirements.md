# Requirements Document

## Introduction

This feature addresses critical limitations in the current widget configuration system where widgets automatically display all columns from SQL queries without user control over column selection, mapping, or visualization customization. The current system lacks flexible field mapping, efficient data fetching, and advanced chart configurations, particularly for multi-series and stacked visualizations. This enhancement will implement a unified column selection framework, advanced chart configurations, and optimized query generation to provide users with granular control over their data visualizations.

## Requirements

### Requirement 1: Unified Column Selection System

**User Story:** As a dashboard creator, I want to explicitly select which columns to display in my widgets, so that I can focus on relevant data and avoid cluttered visualizations.

#### Acceptance Criteria

1. WHEN a user configures any widget type THEN the system SHALL provide a `selectedColumns` interface allowing multi-column selection
2. WHEN no columns are selected THEN the system SHALL default to displaying all available columns with a warning prompt
3. WHEN computed fields or VLOOKUP columns exist THEN the system SHALL include them in the column selection pool alongside original columns
4. WHEN a user selects columns THEN the system SHALL update the data preview to reflect only the selected columns
5. WHEN the data source changes THEN the system SHALL refresh the available columns list and preserve valid selections

### Requirement 2: Advanced Chart Widget Configuration

**User Story:** As a data analyst, I want to create complex charts with multiple series, stacking, and grouping capabilities, so that I can represent multi-dimensional data effectively.

#### Acceptance Criteria

1. WHEN configuring a bar chart THEN the system SHALL support multiple Y columns for multi-series or stacked bars
2. WHEN configuring a bar chart THEN the system SHALL support multiple X columns for grouped bars (e.g., Year and Month)
3. WHEN configuring line or area charts THEN the system SHALL support multiple Y columns for multi-series visualizations
4. WHEN configuring any chart type THEN the system SHALL provide a series column option for data grouping
5. WHEN configuring bar or area charts THEN the system SHALL include a stacking toggle for grouped vs stacked modes
6. WHEN configuring pie charts THEN the system SHALL support one X column (category) and multiple Y columns (values)
7. WHEN chart type changes THEN the system SHALL dynamically adapt the configuration UI to show relevant options
8. WHEN multiple columns are selected THEN the system SHALL provide aggregation options (sum, average, count, min, max) for Y values

### Requirement 3: Flexible Column Mapping and Roles

**User Story:** As a dashboard designer, I want to map columns to specific widget roles and customize their display properties, so that I can create tailored visualizations with meaningful labels and formatting.

#### Acceptance Criteria

1. WHEN configuring widgets THEN the system SHALL allow mapping columns to widget-specific roles (X-axis, Y-axis, series, metrics)
2. WHEN mapping columns THEN the system SHALL support custom display names (aliases) for columns in legends and labels
3. WHEN configuring table widgets THEN the system SHALL support column reordering, renaming, and formatting options
4. WHEN configuring metric widgets THEN the system SHALL allow multiple metrics with comparison capabilities
5. WHEN configuring text widgets THEN the system SHALL enable dynamic data binding to include metric values
6. WHEN invalid column types are selected for roles THEN the system SHALL display warnings and suggest appropriate alternatives

### Requirement 4: Optimized Data Fetching

**User Story:** As a system administrator, I want the system to fetch only necessary data columns, so that I can improve performance and reduce server load for large datasets.

#### Acceptance Criteria

1. WHEN widgets have selected columns THEN the system SHALL modify SQL queries to fetch only those columns plus computed/VLOOKUP columns
2. WHEN selectedColumns is undefined or query generation fails THEN the system SHALL fall back to SELECT * with client-side filtering
3. WHEN executing queries THEN the system SHALL optimize JOIN operations to include only required columns from joined tables
4. WHEN data is fetched THEN the system SHALL cache results appropriately to minimize redundant queries
5. WHEN large datasets are processed THEN the system SHALL implement pagination and limit data to reasonable sizes (e.g., 100 rows for rendering)

### Requirement 5: Enhanced Data Preview System

**User Story:** As a widget configurator, I want to see accurate previews of how my column selections and configurations will appear, so that I can validate my choices before saving.

#### Acceptance Criteria

1. WHEN configuring widgets THEN the system SHALL display previews showing only selected columns and applied configurations
2. WHEN chart configurations change THEN the system SHALL show mock visualizations reflecting the selected axes, series, and formatting
3. WHEN table configurations change THEN the system SHALL preview column formatting, ordering, and display options
4. WHEN preview data is unavailable THEN the system SHALL display informative messages with configuration guidance
5. WHEN previews fail to load THEN the system SHALL show all columns with indicators for selected ones and limit to 10 rows

### Requirement 6: Column Metadata Integration

**User Story:** As a data analyst, I want the system to understand column data types and guide my selections, so that I can avoid invalid configurations and create meaningful visualizations.

#### Acceptance Criteria

1. WHEN selecting columns for chart axes THEN the system SHALL suggest numeric columns for Y-axis and categorical/date columns for X-axis
2. WHEN invalid column types are selected THEN the system SHALL display warnings explaining valid column types for each role
3. WHEN column metadata is available THEN the system SHALL use it to validate and guide column selections
4. WHEN metadata is unavailable THEN the system SHALL allow all selections but log errors for type mismatches during rendering
5. WHEN computed fields are created THEN the system SHALL validate formula syntax and data type compatibility

### Requirement 7: Advanced Table Widget Features

**User Story:** As a data viewer, I want enhanced table functionality with column control, formatting, and interaction options, so that I can efficiently analyze and present tabular data.

#### Acceptance Criteria

1. WHEN configuring table widgets THEN the system SHALL provide column formatting options (date, currency, number formatting)
2. WHEN displaying tables THEN the system SHALL support column reordering through drag-and-drop or configuration
3. WHEN tables have many columns THEN the system SHALL allow column hiding/showing without affecting the underlying query
4. WHEN table data is displayed THEN the system SHALL maintain current sorting, searching, and pagination functionality
5. WHEN columns are formatted THEN the system SHALL preserve raw data for sorting and filtering operations

### Requirement 8: Robust Error Handling and Fallbacks

**User Story:** As a system user, I want the system to gracefully handle configuration errors and provide fallback options, so that my widgets remain functional even when advanced features fail.

#### Acceptance Criteria

1. WHEN advanced column mapping fails THEN the system SHALL revert to current single-column mapping behavior
2. WHEN query optimization fails THEN the system SHALL fall back to SELECT * with client-side column filtering
3. WHEN chart rendering fails due to invalid configurations THEN the system SHALL display basic charts with default settings
4. WHEN column metadata is unavailable THEN the system SHALL provide tooltips explaining valid column types for each widget role
5. WHEN performance issues occur THEN the system SHALL limit data processing (100 rows, 10 series) and display appropriate warnings

### Requirement 9: Consistent User Experience

**User Story:** As a dashboard creator, I want a consistent interface across all widget types for column selection and configuration, so that I can efficiently work with different visualization types.

#### Acceptance Criteria

1. WHEN configuring any widget type THEN the system SHALL use consistent UI patterns for column selection (multi-select interface)
2. WHEN switching between widget types THEN the system SHALL maintain similar terminology and interaction patterns
3. WHEN column selection interfaces are displayed THEN the system SHALL use consistent visual indicators for selected, available, and computed columns
4. WHEN configuration panels are shown THEN the system SHALL organize options logically with clear section headers and descriptions
5. WHEN errors or warnings occur THEN the system SHALL display them consistently across all widget types with actionable guidance