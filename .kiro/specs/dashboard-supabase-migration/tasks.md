# Implementation Plan

- [x] 1. Set up Supabase database schema and security


  - Create SQL migration file with single `dashboards` table storing widgets as JSONB
  - Implement Row Level Security (RLS) policies for user data isolation
  - Add database indexes for performance optimization on user_id and template queries
  - Set up proper foreign key constraints with auth.users table
  - _Requirements: 1.1, 1.4, 2.1_

- [x] 2. Create dashboard Supabase utilities


  - Create `src/utils/dashboardSupabaseUtils.ts` with core dashboard CRUD operations
  - Implement `fetchUserDashboards`, `fetchTemplates`, `createDashboard`, `updateDashboard`, `deleteDashboard` functions
  - Add template management functions: `publishDashboard`, `unpublishDashboard`, `createFromTemplate`
  - Implement error handling wrapper for all Supabase operations with toast notifications
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.3, 4.2_

- [x] 3. Add data transformation utilities

  - Create transformation functions between frontend Dashboard format and Supabase format
  - Implement `transformToSupabase` and `transformFromSupabase` functions
  - Handle date conversion between JavaScript Date objects and Supabase timestamps
  - Add validation for dashboard data before saving to Supabase
  - _Requirements: 4.1, 4.4_



- [ ] 4. Update Dashboard interface minimally
  - Add optional `user_id` field to existing `Dashboard` interface in `src/types/index.ts`
  - Keep existing camelCase naming convention (isPublished, isTemplate, createdAt, updatedAt)
  - Maintain existing Widget interface without any database-specific fields
  - Add Supabase-specific type definitions for internal use only


  - _Requirements: 4.1, 4.4_

- [ ] 5. Refactor dashboard store to use Supabase
  - Update `src/store/dashboardStore.ts` to use Supabase utilities instead of hardcoded templates
  - Replace hardcoded templates array with dynamic template fetching from Supabase



  - Implement optimistic updates for all dashboard operations
  - Add loading states and error handling while maintaining existing store API
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.3_


- [ ] 6. Integrate authentication with dashboard store
  - Connect dashboard store initialization to auth state changes in existing auth listener
  - Clear dashboard data on logout and fetch user dashboards on login
  - Extract user_id from existing auth store for all Supabase operations
  - Handle authentication errors and session expiration gracefully
  - _Requirements: 1.2, 4.4_




- [ ] 7. Migrate existing templates to Supabase
  - Create migration script to move hardcoded templates from dashboardStore.ts to Supabase
  - Insert existing HR Analytics, Sales Analytics, and Customer Analytics templates as system templates
  - Mark migrated templates with `is_template: true` and `is_published: true`
  - Remove hardcoded templates from store after successful migration
  - _Requirements: 2.1, 2.2_

- [ ] 8. Add real-time synchronization
  - Implement Supabase realtime subscriptions for dashboards table
  - Add cross-tab synchronization to keep dashboard data consistent
  - Handle real-time updates for dashboard changes from other sessions/devices
  - Implement simple conflict resolution for concurrent modifications
  - _Requirements: 1.3, 4.5_

- [ ] 9. Implement template system functionality
  - Add `publishDashboard` function to convert user dashboard to template
  - Implement `createFromTemplate` to copy template with new ID and user ownership
  - Update template fetching to show both system and user-published templates
  - Add template unpublishing to revert published dashboards to private
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 10. Add comprehensive error handling
  - Implement error boundary components for dashboard operations
  - Add user-friendly error messages with actionable suggestions using existing toast system
  - Create retry mechanisms for failed Supabase operations
  - Add loading indicators for all async dashboard operations
  - _Requirements: 4.2, 1.5_

- [ ] 11. Add offline support and operation queuing
  - Implement offline detection and operation queuing for dashboard changes
  - Add sync mechanism for queued operations when connection is restored
  - Provide user feedback for offline status and pending sync operations
  - Handle basic conflict resolution for offline changes
  - _Requirements: 1.5_

- [ ] 12. Implement dashboard sharing capabilities
  - Add sharing functionality for published dashboards with proper permission checks
  - Create dashboard copying from shared/template dashboards
  - Add user interface elements for managing dashboard visibility (publish/unpublish)
  - Implement permission checks for dashboard access based on user authentication
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 13. Performance optimization
  - Add database indexes for optimal query performance on user_id and template filtering
  - Implement caching strategies for frequently accessed template data
  - Add pagination for large dashboard lists if needed
  - Optimize real-time subscription performance
  - _Requirements: 1.3, 4.5_