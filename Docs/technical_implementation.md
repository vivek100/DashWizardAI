# Detailed Technical Implementation Plan

This document provides a file-by-file guide for migrating the application to a Supabase-backed, multi-tenant architecture with enhanced table type support.

---

## 1. Supabase Schema & SQL

Create a new SQL file `planforDB/supabase_schema.sql` to define the database structure and security policies.

**`planforDB/supabase_schema.sql`:**
```sql
-- 1. DASHBOARDS TABLE
CREATE TABLE public.dashboards (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid DEFAULT auth.uid() NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    layout jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. WIDGETS TABLE
CREATE TABLE public.widgets (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    dashboard_id uuid NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
    user_id uuid DEFAULT auth.uid() NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    config jsonb,
    data_table_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. TABLE_SCHEMAS TABLE
CREATE TYPE table_type AS ENUM ('table', 'view', 'text');

CREATE TABLE public.table_schemas (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid DEFAULT auth.uid() NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    table_name text NOT NULL,
    display_name text NOT NULL,
    schema jsonb NOT NULL,
    table_type table_type NOT NULL DEFAULT 'table',
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, table_name)
);

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_schemas ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES
CREATE POLICY "Allow individual access to own dashboards" ON public.dashboards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow individual access to own widgets" ON public.widgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow individual access to own table schemas" ON public.table_schemas FOR ALL USING (auth.uid() = user_id);
```

---

## 2. Backend Refactor (`agent/`)

### `config.py`
- **Action:** Add Supabase credentials from environment variables.

### New File: `agent/supabase_client.py`
- **Action:** Create a centralized Supabase client for backend use.

### `tools/models.py`
- **Action:** Add `user_id: str` to `Dashboard` and `Widget` Pydantic models.

### `custom_app.py`
- **Action:** Secure all endpoints and refactor database logic.
- **Details:**
    1.  **Authentication Middleware/Decorator:** Implement a function to be used by all routes. It should:
        -   Extract the JWT from the `Authorization` header.
        -   Use `supabase.auth.get_user(jwt)` to validate the token.
        -   If valid, attach the user object to the request; otherwise, return a 401 Unauthorized error.
    2.  **Dashboard/Widget Endpoints:** Rewrite all CRUD endpoints (`/dashboards`, `/widgets`, etc.) to:
        -   Use the authenticated `user_id` from the request.
        -   Call the Supabase client (`supabase.table('...').select/insert/update/delete(...)`) instead of DuckDB for these operations.
        -   Ensure all queries are filtered by `user_id`.

### `tools/storage_tools.py`
- **Action:** Refactor `DuckDBManager` to handle user-specific tables and schema synchronization.
- **Details:**
    1.  **Modify `load_csv_to_table` and `load_df_to_table`:**
        -   Accept a `user_id` and `table_type` ('table', 'view', or 'text') as arguments.
        -   Generate a unique, user-specific table name (e.g., `f"user_{user_id}_table_{uuid4().hex[:8]}"`).
        -   After successfully creating the table in DuckDB, call `sync_schema_to_supabase` with table type.
    2.  **New Function `sync_schema_to_supabase(user_id, table_name, schema, table_type, description)`:**
        -   Takes the user ID, table name, schema, table type, and optional description.
        -   Uses the Supabase client to `upsert` a record into the `table_schemas` table.
        -   For views, extracts the base table name and stores it in the schema.
    3.  **Modify `delete_table`:**
        -   Accept `user_id` and `table_name`.
        -   After dropping the table from DuckDB, use the Supabase client to delete the corresponding record from `table_schemas`.
    4.  **New Function `get_user_tables(user_id, table_type=None)`:**
        -   Queries Supabase to get all tables for a user, optionally filtered by table type.
        -   Returns a list of table metadata including name, type, and description.

---

### New File: `tools/analysis_tools.py`
- **Action:** Update analysis tools to properly handle different table types.
- **Details:**
    1.  **Modify analysis functions** to check the table type before processing:
        -   For 'table' type: Process as regular data tables
        -   For 'view' type: Process as derived data with reference to base tables
        -   For 'text' type: Return the content directly without processing
    2.  **Add type-specific processing** for each analysis function to handle the different data structures.
    3.  **Update metadata handling** to include table type information in responses.

### `tools/widget_tools.py` and `tools/dashboard_tools.py`
- **Action:** Update widget and dashboard tools to work with the new table type system.
- **Details:**
    1.  **Widget Generation:**
        -   Update widget generation to handle different table types appropriately
        -   For 'text' type tables, generate text widgets instead of data visualizations
        -   For 'view' type tables, include information about base tables in the widget metadata
    2.  **Dashboard Layout:**
        -   Update the dashboard layout system to handle different widget types
        -   Add special handling for text widgets to ensure proper display
    3.  **Data Source Management:**
        -   Update data source selection to filter by table type where appropriate
        -   Add visual indicators for different table types in the UI

## 3. Frontend Refactor (`boltFrontend/project/src/`)

### New File: `lib/supabase.ts`
- **Action:** Create a reusable Supabase client instance for the frontend.
- **Details:** Initialize the client using the public URL and `anon` key.

### `App.tsx` or `main.tsx`
- **Action:** Implement authentication state management.
- **Details:**
    -   On application startup, listen for Supabase auth state changes (`supabase.auth.onAuthStateChange`).
    -   Store the user session in a global state (e.g., Zustand, React Context).
    -   Implement protected routes that require a valid session to access the main dashboard area.

### `store/dashboardStore.ts`
- **Action:** Refactor the store to be the single source of truth, synchronized with Supabase.
- **Details:**
    1.  **`fetchDashboards`:** On user login, call `supabase.from('dashboards').select('*').eq('user_id', userId)`. Populate the store with the result.
    2.  **`addDashboard`, `updateDashboard`, `deleteDashboard`:**
        -   These functions should now call the corresponding Supabase methods (`insert`, `update`, `delete`).
        -   On success, update the local store state to reflect the change.
        -   Implement optimistic updates for a better user experience.
    3.  Repeat the same pattern for widgets, ensuring all queries are filtered by `dashboard_id` and `user_id`.

### `services/api.ts` (or equivalent)
- **Action:** Update API client to include the auth token and handle table types.
- **Details:**
    -   Create a wrapper around `fetch` or `axios`.
    -   Before sending any request to your backend, get the current session token from `supabase.auth.getSession()`.
    -   If a token exists, add it to the `Authorization` header: `Bearer ${token}`.
    -   Add type-specific API endpoints for different table types.
    -   Implement proper error handling for type-related errors.

## 4. Frontend Components

### `components/data/DataPage.tsx`
- **Action:** Update the data management page to handle different table types.
- **Details:**
    -   Add filters to show/hide different table types.
    -   Include visual indicators for each table type (icon + label).
    -   Update the table listing to show type-specific information.
    -   Add type-specific actions (e.g., "View Text" for text tables).

### `components/data/CSVUploadDialog.tsx`
- **Action:** Update the CSV upload dialog to support table metadata.
- **Details:**
    -   Add fields for table description and type selection.
    -   Include validation based on the selected table type.
    -   Show preview with type-specific formatting.

### `components/data/SQLEditor.tsx`
- **Action:** Enhance the SQL editor to work with different table types.
- **Details:**
    -   Update the schema browser to show table types.
    -   Add syntax highlighting and autocomplete for type-specific operations.
    -   Include warnings for operations that aren't supported for certain table types.

## 5. Data Flow and State Management

### Data Fetching
- **Action:** Implement type-aware data fetching.
- **Details:**
    -   For 'table' type: Fetch paginated data with sorting and filtering
    -   For 'view' type: Fetch data with awareness of underlying tables
    -   For 'text' type: Fetch the full content in a single request

### State Updates
- **Action:** Handle table type-specific state updates.
- **Details:**
    -   Update the state management to track the type of each table
    -   Implement type-specific reducers or store slices
    -   Add middleware to handle type-specific side effects

### Error Handling
- **Action:** Enhance error handling for type-related issues.
- **Details:**
    -   Add specific error messages for type-related errors
    -   Implement fallback behavior when a table type is not supported
    -   Add logging for type-related warnings and errors

