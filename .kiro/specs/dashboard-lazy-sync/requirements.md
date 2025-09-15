# Dashboard Lazy Sync Requirements

## Problem Statement

The original Supabase migration plan failed because it made all dashboard operations async, breaking existing components and creating poor UX. We need a **lazy sync** approach that:

1. **Maintains synchronous API** for components
2. **Loads local data immediately** 
3. **Syncs to Supabase in background**
4. **Gracefully handles offline/errors**
5. **Preserves existing component compatibility**

## Core Principles

### 1. Local-First Architecture
- Store acts as single source of truth
- Load from local storage immediately (fast)
- Sync to/from Supabase in background (reliable)
- Components never wait for network

### 2. Zero Breaking Changes
- All existing store methods remain synchronous
- Components work exactly as before
- No loading states in component layer
- Same API surface maintained

### 3. Background Sync Strategy
- **On App Load**: Load local → Sync from Supabase → Merge conflicts
- **On Create/Update**: Update local immediately → Sync to Supabase → Handle failures
- **On Auth Change**: Clear local → Load user data from Supabase
- **Periodic Sync**: Sync every 30 seconds when active

## Requirements

### R1: Synchronous Store Operations
**As a developer**, I want dashboard store operations to remain synchronous, so existing components continue working without modification.

**Acceptance Criteria:**
- All store methods (create, update, delete, addWidget) remain synchronous
- Components get immediate state updates
- No async/await required in component code
- Background sync happens transparently

### R2: Persistent Local Storage
**As a user**, I want my dashboards to persist locally, so I can work offline and get instant loading.

**Acceptance Criteria:**
- Dashboards saved to localStorage on every change
- App loads local data immediately on startup
- Offline operations queue for later sync
- Works without internet connection

### R3: Background Supabase Sync
**As a user**, I want my data synced across devices, so I can access dashboards anywhere.

**Acceptance Criteria:**
- Changes sync to Supabase in background
- Failed syncs retry automatically
- Periodic sync ensures data consistency
- User sees sync status indicators

### R4: Graceful Error Handling
**As a user**, I want the app to work even when Supabase is down, so I'm never blocked from working.

**Acceptance Criteria:**
- App functions normally when Supabase unavailable
- Sync errors don't break the UI
- Queued operations retry when connection restored
- Clear status indicators for sync issues

### R5: User Data Isolation
**As a user**, I want my dashboards private to my account, so other users can't see my data.

**Acceptance Criteria:**
- User data filtered by auth.user_id
- Templates shared appropriately
- RLS policies enforce data isolation
- Auth changes trigger data reload

### R6: Conflict Resolution
**As a user**, I want conflicts resolved intelligently when I work across devices, so I don't lose work.

**Acceptance Criteria:**
- Last-write-wins for simple conflicts
- User prompted for complex conflicts
- Version timestamps used for resolution
- Manual merge option for important conflicts 