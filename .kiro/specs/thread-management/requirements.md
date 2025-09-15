# Thread Management Requirements Document

## Introduction

This feature implements a comprehensive thread management system for the React application that integrates with LangGraph SDK and Supabase. The system will provide users with the ability to manage chat conversations through a sidebar interface, create new chats, maintain thread history, and associate dashboards with specific threads. The implementation focuses on seamless user experience with proper thread naming, search functionality, and dashboard state management.

## Requirements

### Requirement 1: Thread History Display

**User Story:** As a user, I want to see a list of my previous chat threads in the sidebar, so that I can easily navigate between different conversations.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL fetch and display all threads from Supabase filtered by the authenticated user's user_id
2. WHEN displaying threads THEN the system SHALL show "New Chat" for threads marked as is_new: true
3. WHEN displaying threads THEN the system SHALL show the saved name for threads marked as is_new: false
4. WHEN displaying threads THEN the system SHALL sort them by updated_at in descending order (most recent first)
5. WHEN a user clicks on a thread THEN the system SHALL update the URL with thread_id and load the thread's messages via LangGraph

### Requirement 2: Thread Search Functionality

**User Story:** As a user, I want to search through my chat history, so that I can quickly find specific conversations.

#### Acceptance Criteria

1. WHEN the sidebar is displayed THEN the system SHALL provide a search input field
2. WHEN a user types in the search field THEN the system SHALL filter threads by name in real-time
3. WHEN filtering threads THEN the system SHALL perform case-insensitive matching
4. WHEN no threads match the search query THEN the system SHALL display an empty state

### Requirement 3: New Chat Creation

**User Story:** As a user, I want to start a new chat conversation, so that I can begin a fresh discussion with the AI assistant.

#### Acceptance Criteria

1. WHEN the sidebar is displayed THEN the system SHALL provide a "New Chat" button
2. WHEN the "New Chat" button is clicked THEN the system SHALL create a new thread in Supabase with name "New Chat" and is_new: true
3. WHEN a new thread is created THEN the system SHALL let LangGraph assign a thread ID
4. WHEN a new thread is created THEN the system SHALL update the URL with the new thread_id
5. WHEN a new thread is created THEN the system SHALL display the thread in the sidebar as "New Chat"

### Requirement 4: Thread Naming Management

**User Story:** As a user, I want my chat threads to have meaningful names based on my first message, so that I can easily identify different conversations.

#### Acceptance Criteria

1. WHEN a new thread is created THEN the system SHALL set the thread name to "New Chat" with is_new: true
2. WHEN the first user message is sent in a new thread THEN the system SHALL update the thread name to the first 50-100 characters of the message
3. WHEN updating the thread name THEN the system SHALL sanitize the text to remove special characters
4. WHEN the thread name is updated THEN the system SHALL set is_new: false to prevent future renaming
5. WHEN a thread is reloaded THEN the system SHALL NOT change the thread name even if the first message is reprocessed

### Requirement 5: Thread Differentiation and Navigation

**User Story:** As a user, I want the system to properly handle both new and existing threads, so that I can seamlessly navigate between conversations.

#### Acceptance Criteria

1. WHEN loading an existing thread THEN the system SHALL use the threadId from the URL to fetch messages from LangGraph
2. WHEN creating a new thread THEN the system SHALL let LangGraph generate the threadId and sync it with Supabase
3. WHEN navigating between threads THEN the system SHALL update the browser URL appropriately
4. WHEN the page is refreshed THEN the system SHALL maintain the current thread context based on the URL

### Requirement 6: Error Handling for LangGraph Integration

**User Story:** As a user, I want to receive clear feedback when there are issues with loading my chat threads, so that I understand what went wrong.

#### Acceptance Criteria

1. WHEN LangGraph returns a "Thread not found" error THEN the system SHALL display a user-friendly error message via toast.error
2. WHEN LangGraph errors occur THEN the system SHALL NOT automatically create a new thread
3. WHEN network errors occur THEN the system SHALL provide appropriate error messaging
4. WHEN errors are resolved THEN the system SHALL allow users to retry the operation

### Requirement 7: Message Submission Enhancement

**User Story:** As a user, I want my messages to include relevant context about my session and active dashboard, so that the AI can provide more personalized responses.

#### Acceptance Criteria

1. WHEN submitting a message THEN the system SHALL include thread_id as run_id in the config object
2. WHEN submitting a message THEN the system SHALL include user_id, user_email, and user_name in the config object
3. WHEN an active dashboard exists THEN the system SHALL include activeDashboard data in the config object
4. WHEN user information is not available THEN the system SHALL omit those fields from the config
5. WHEN the message is submitted THEN the system SHALL send all available context to LangGraph

### Requirement 8: Active Dashboard Management

**User Story:** As a user, I want my dashboard associations to be maintained with my chat threads, so that I can resume working on dashboards in the context of specific conversations.

#### Acceptance Criteria

1. WHEN a dashboard is saved or opened via chat interface THEN the system SHALL store the dashboard_id in the threads table
2. WHEN a dashboard preview is closed THEN the system SHALL clear the dashboard_id in the threads table
3. WHEN a thread is reloaded AND a dashboard_id is present THEN the system SHALL open the corresponding dashboard in preview mode
4. WHEN switching between threads THEN the system SHALL maintain separate dashboard states for each thread
5. WHEN a dashboard is associated with a thread THEN the system SHALL persist this relationship across browser sessions

### Requirement 9: Type Safety and Data Integrity

**User Story:** As a developer, I want the thread management system to be type-safe and maintain data integrity, so that the application is reliable and maintainable.

#### Acceptance Criteria

1. WHEN updating database schemas THEN the system SHALL include dashboard_id and is_new columns in the threads table
2. WHEN working with TypeScript THEN the system SHALL provide proper type definitions for all thread-related interfaces
3. WHEN performing database operations THEN the system SHALL handle errors gracefully and maintain data consistency
4. WHEN updating thread metadata THEN the system SHALL validate data before persisting to the database

### Requirement 10: Thread Loading and User Experience

**User Story:** As a user, I want clear visual feedback and smooth transitions when navigating between threads, so that I understand what's happening and can work efficiently.

#### Acceptance Criteria

1. WHEN landing on the page for the first time THEN the system SHALL show a loading state while fetching thread history
2. WHEN landing on the page for the first time AND no thread_id is in URL THEN the system SHALL display a welcome state with option to start new chat
3. WHEN landing on the page for the first time AND a thread_id is in URL THEN the system SHALL load that specific thread and show loading indicators for messages
4. WHEN switching between threads THEN the system SHALL show a loading state in the chat area while fetching messages
5. WHEN switching between threads THEN the system SHALL immediately highlight the selected thread in the sidebar
6. WHEN creating a new thread THEN the system SHALL provide immediate visual feedback by adding the thread to the sidebar
7. WHEN creating a new thread THEN the system SHALL show the new thread as active/selected in the sidebar
8. WHEN thread loading fails THEN the system SHALL display an error state with retry options
9. WHEN messages are loading THEN the system SHALL show skeleton loaders or spinner in the chat area
10. WHEN no threads exist for a user THEN the system SHALL display an empty state encouraging the user to start their first chat