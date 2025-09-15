# Implementation Plan: Supabase Migration

## Step 1: Supabase Setup
- [ ] Create Supabase project, get URL and keys.
- [ ] Define `dashboards`, `widgets`, `table_schemas` tables as above.
- [ ] Enable RLS and write policies for user scoping.

## Step 2: Backend Refactor
- [ ] Add Supabase client utility (`supabase_client.py`).
- [ ] Update `models.py` to add `user_id` to all relevant models.
- [ ] Refactor `custom_app.py`:
    - Require JWT on all endpoints.
    - Extract user ID and use it for all queries.
    - Replace dashboard/widget CRUD with Supabase API calls.
- [ ] Refactor `storage_tools.py` and `csv_tools.py`:
    - Map DuckDB tables to user.
    - On table add/drop, update Supabase `table_schemas`.
- [ ] Add sync logic: when a table is added/deleted in DuckDB, update Supabase schema.

## Step 3: Frontend Refactor
- [ ] Add Supabase JS client (`lib/supabase.ts`).
- [ ] Refactor `dashboardStore.ts`:
    - Fetch dashboards/widgets from Supabase on load.
    - Sync all add/update/delete actions to Supabase.
- [ ] Update components to use new store logic.
- [ ] On login, fetch user’s dashboards/widgets.
- [ ] Ensure all backend API calls include JWT.

## Step 4: Testing and Migration
- [ ] Migrate existing dashboard/widget data from DuckDB to Supabase (one-time script).
- [ ] Test end-to-end: user login, dashboard/widget CRUD, table upload/delete, schema sync.
- [ ] Add error handling and logging for all critical operations.

## Step 5: Documentation & Deployment
- [ ] Update README and developer docs.
- [ ] Deploy backend and frontend with new configuration.
