# User Stories for Supabase Migration

This document outlines the required features for the database migration in the form of user stories. Each story represents a key piece of functionality from the perspective of a user or developer.

---

### Epic: Multi-Tenant Data Architecture

#### User Story 1: Secure User Authentication & Data Isolation
*   **As a** user,
*   **I want to** log in to the application securely,
*   **so that** I can access only my own dashboards, widgets, and data tables, ensuring my information is private and isolated from other users.

**Acceptance Criteria:**
- A user can sign up and log in using Supabase Auth (e.g., email/password).
- All API requests to the backend that handle user data must include a valid JWT in the `Authorization` header.
- The backend must validate the JWT and extract the `user_id` for each authenticated request.
- Any database query for dashboards, widgets, or table schemas must be filtered by the authenticated `user_id`.
- A user attempting to access another user's data via a direct API call or URL manipulation must receive a `403 Forbidden` or `404 Not Found` error.

#### User Story 2: Persistent, User-Scoped Dashboard and Widget Management
*   **As a** user,
*   **I want** my dashboards and widgets to be saved to my personal account,
*   **so that** I can access and manage them across different sessions and devices without affecting other users' work.

**Acceptance Criteria:**
- When a user creates a new dashboard, a record is created in the Supabase `dashboards` table, linked to their `user_id`.
- When a user adds a widget, a record is created in the Supabase `widgets` table, linked to their `user_id` and the parent `dashboard_id`.
- All dashboard and widget metadata (e.g., name, layout, type, configuration) is stored in Supabase, not DuckDB.
- When the application loads, it fetches only the authenticated user's dashboards and widgets from Supabase.
- All updates (e.g., renaming a dashboard, moving a widget) are persisted to Supabase in real-time or near real-time.

#### User Story 3: Private Data Table Management
*   **As a** user,
*   **I want to** upload my own data tables (e.g., CSVs),
*   **so that** I can build visualizations based on my private data, with the assurance that this data remains separate from other users' tables.

**Acceptance Criteria:**
- When a user uploads a table, the data is loaded into a DuckDB instance.
- The table name in DuckDB is mapped to the user's `user_id` to ensure uniqueness and prevent access conflicts (e.g., a naming convention like `user_{user_id}_{table_name}`).
- The backend API for listing available tables for a user only shows tables associated with their `user_id`.
- The backend API for querying data from DuckDB only permits operations on tables owned by the authenticated user.

#### User Story 4: Automated Table Schema Synchronization
*   **As a** developer,
*   **I want** the schema of any user-uploaded table in DuckDB to be automatically cataloged in a central Supabase table,
*   **so that** the AI agent can quickly understand the structure of available tables without needing to query DuckDB's metadata each time, improving performance and enabling more accurate query generation.

**Acceptance Criteria:**
- When a user successfully uploads a new table to DuckDB, a corresponding record is created in the `table_schemas` table in Supabase.
- This record must contain the `user_id`, the unique `table_name` used in DuckDB, and a `jsonb` object representing the table's schema (e.g., `{"column_name": "data_type", ...}`).
- When a user deletes a table from DuckDB, the corresponding record in `table_schemas` is automatically deleted.
- If a table is replaced or updated, the schema in `table_schemas` is updated to reflect the new structure.

#### User Story 5: Seamless Frontend State Synchronization
*   **As a** user,
*   **I want** the dashboard application to feel fast and responsive, with my changes saved automatically,
*   **so that** I have a modern, seamless user experience without worrying about manually saving my work.

**Acceptance Criteria:**
- The frontend application initializes the Supabase JS client on startup.
- On initial load after login, the application fetches all of the user's dashboards and widgets from Supabase to populate the UI.
- The frontend uses the Supabase JS client to perform all CRUD (Create, Read, Update, Delete) operations on dashboards and widgets.
- The UI state is updated optimistically after a user action, with changes persisted to Supabase in the background.
- (Optional but recommended) The application subscribes to real-time changes using Supabase Realtime, so that if a change is made in another session, it is reflected automatically in the current UI.
