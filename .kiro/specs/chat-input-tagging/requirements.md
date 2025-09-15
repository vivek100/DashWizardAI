# Requirements Document

## Introduction

The current chat input area in the application allows users to type messages to the AI assistant, but lacks the ability to reference specific data sources, dashboards, or widgets directly. Users need a way to tag and reference available tables, current dashboard widgets, and other dashboards (both draft and published) using "@" mentions, similar to social media platforms. This will provide context-aware assistance and allow the AI to better understand what the user is referring to when asking questions or requesting modifications.

## Requirements

### Requirement 1

**User Story:** As a user, I want to tag available database tables using "@" mentions in the chat input, so that I can easily reference specific data sources when asking the AI questions.

#### Acceptance Criteria

1. WHEN I type "@" in the chat input THEN the system SHALL show a grouped dropdown with sections for "Tables", "Current Dashboard", "Current Dashboard Widgets", and "Other Dashboards"
2. WHEN I continue typing after "@" THEN the dropdown SHALL filter items across all sections based on the typed text
3. WHEN I select a table from the dropdown THEN it SHALL be inserted as a tag block in the input area showing the table name with a table icon
4. WHEN I submit a message with table tags THEN the complete table information including schema and sample data SHALL be included in the chat message context
5. WHEN I press backspace on a table tag THEN the tag SHALL be removed from the input

### Requirement 2

**User Story:** As a user, I want to tag the current dashboard and its widgets using "@" mentions, so that I can ask the AI to modify or analyze specific parts of my dashboard.

#### Acceptance Criteria

1. WHEN I type "@" and there is a current dashboard THEN the dropdown SHALL show the current dashboard in the "Current Dashboard" section
2. WHEN I type "@" and there is a current dashboard THEN the dropdown SHALL show individual widgets in the "Current Dashboard Widgets" section with widget title and type
3. WHEN I select the current dashboard THEN the complete dashboard JSON SHALL be included in the message context
4. WHEN I select a specific widget THEN the widget configuration SHALL be included in the message context
5. WHEN I tag a widget THEN the tag SHALL display the widget title and type icon for easy identification

### Requirement 3

**User Story:** As a user, I want to tag other dashboards (both draft and published) using "@" mentions, so that I can reference or compare different dashboards in my conversations.

#### Acceptance Criteria

1. WHEN I type "@" THEN the dropdown SHALL show all available dashboards from the dashboardStore in the "Other Dashboards" section (both draft and published)
2. WHEN I filter dashboard names THEN the dropdown SHALL show matching dashboards based on name or description across all sections
3. WHEN I select a dashboard THEN the complete dashboard JSON SHALL be included in the message context
4. WHEN I tag a dashboard THEN the tag SHALL display the dashboard name and status badge (draft/published) with appropriate icons
5. WHEN I submit a message with dashboard tags THEN the dashboard data SHALL be accessible to the AI assistant

### Requirement 4

**User Story:** As a developer, I want the tagging system to integrate seamlessly with the existing InputArea component and chat message system, so that tagged content is properly formatted and transmitted.

#### Acceptance Criteria

1. WHEN tags are added to the input THEN they SHALL be displayed as removable blocks within the textarea
2. WHEN the message is submitted THEN tagged content SHALL be formatted and included in the chat message
3. WHEN the AI receives a message with tags THEN it SHALL have access to the complete tagged data
4. WHEN tags are displayed THEN they SHALL be visually distinct from regular text
5. WHEN the input area is resized THEN tags SHALL maintain proper layout and positioning

### Requirement 5

**User Story:** As a user, I want the tagging dropdown to be responsive and performant with keyboard navigation support, so that I can quickly find and select the items I need without delays.

#### Acceptance Criteria

1. WHEN the dropdown appears THEN it SHALL load within 100ms of typing "@"
2. WHEN I type to filter THEN the results SHALL update in real-time without noticeable delay
3. WHEN there are many items THEN the dropdown SHALL implement virtual scrolling or pagination
4. WHEN I use keyboard navigation THEN I SHALL be able to navigate the dropdown with arrow keys and select with Enter
5. WHEN I type the complete item name THEN the system SHALL automatically select the matching item
6. WHEN I click outside the dropdown THEN it SHALL close without selecting an item

### Requirement 6

**User Story:** As a developer, I want the tagging UI to use existing shadcn components and follow the application's design system, so that the feature integrates seamlessly with the existing interface.

#### Acceptance Criteria

1. WHEN the dropdown is displayed THEN it SHALL use shadcn Command component for consistent styling
2. WHEN tags are rendered THEN they SHALL use shadcn Badge component with appropriate variants
3. WHEN icons are displayed THEN they SHALL use the existing Lucide React icons from the application
4. WHEN colors are applied THEN they SHALL follow the existing color scheme and CSS variables
5. WHEN the component is styled THEN it SHALL be responsive and work across different screen sizes