import { supabase } from '@/lib/supabase';
import { Dashboard } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

// Supabase dashboard type (matches database schema)
interface SupabaseDashboard {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  widgets: any[]; // JSON stored as array
  is_published: boolean;
  is_template: boolean;
  created_at: string;
  updated_at: string;
  version: number;
  last_modified_by: string | null;
}

/**
 * Transform frontend Dashboard to Supabase format
 */
function transformToSupabase(dashboard: Dashboard, userId: string): Omit<SupabaseDashboard, 'version' | 'last_modified_by'> {
  return {
    id: dashboard.id,
    user_id: userId,
    name: dashboard.name,
    description: dashboard.description || null,
    widgets: dashboard.widgets,
    is_published: dashboard.isPublished,
    is_template: dashboard.isTemplate,
    created_at: dashboard.createdAt.toISOString(),
    updated_at: dashboard.updatedAt.toISOString()
  };
}

/**
 * Transform Supabase dashboard to frontend format
 */
function transformFromSupabase(supabaseDashboard: SupabaseDashboard): Dashboard {
  return {
    id: supabaseDashboard.id,
    name: supabaseDashboard.name,
    description: supabaseDashboard.description || undefined,
    widgets: supabaseDashboard.widgets,
    isPublished: supabaseDashboard.is_published,
    isTemplate: supabaseDashboard.is_template,
    createdAt: new Date(supabaseDashboard.created_at),
    updatedAt: new Date(supabaseDashboard.updated_at)
  };
}

/**
 * Handle Supabase operation with error handling and retries
 */
async function handleSupabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  errorMessage: string,
  showToast = true
): Promise<T> {
  try {
    const { data, error } = await operation();
    
    if (error) {
      console.error(`${errorMessage}:`, error);
      if (showToast) {
        toast.error(`${errorMessage}: ${error.message}`);
      }
      throw new Error(error.message);
    }
    
    if (!data) {
      throw new Error('No data returned from operation');
    }
    
    return data;
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    if (showToast && error instanceof Error) {
      toast.error(`${errorMessage}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get current user ID with authentication check
 */
function getCurrentUserId(): string {
  const { user } = useAuthStore.getState();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.id;
}

/**
 * Fetch user's dashboards from Supabase
 */
export async function fetchUserDashboards(): Promise<Dashboard[]> {
  const userId = getCurrentUserId();
  
  const dashboards = await handleSupabaseOperation(
    () => supabase
      .from('dashboards')
      .select('*')
      .eq('user_id', userId)
      .eq('is_template', false)
      .order('updated_at', { ascending: false }),
    'Failed to fetch dashboards',
    false // Don't show toast for background fetches
  );
  console.log('User dashboards', dashboards);
  return dashboards.map(transformFromSupabase);
}

/**
 * Fetch dashboard templates from Supabase
 */
export async function fetchTemplates(): Promise<Dashboard[]> {
  const templates = await handleSupabaseOperation(
    () => supabase
      .from('dashboards')
      .select('*')
      .eq('is_template', true)
      .eq('is_published', true)
      .order('name'),
    'Failed to fetch templates',
    false // Don't show toast for background fetches
  );
  
  return templates.map(transformFromSupabase);
}

/**
 * Create a new dashboard in Supabase (or update if it exists with the local ID)
 */
export async function createDashboard(dashboard: Dashboard): Promise<Dashboard> {
  const userId = getCurrentUserId();
  
  const supabaseData = transformToSupabase(dashboard, userId);
  
  // Use upsert to handle both create and update cases
  const created = await handleSupabaseOperation(
    () => supabase
      .from('dashboards')
      .upsert(supabaseData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select('*')
      .single(),
    'Failed to create dashboard',
    false // Don't show toast for background sync
  );
  
  return transformFromSupabase(created);
}

/**
 * Update an existing dashboard in Supabase (using upsert to handle missing dashboards)
 */
export async function updateDashboard(id: string, updates: Partial<Dashboard>): Promise<Dashboard> {
  const userId = getCurrentUserId();
  
  // Create a complete dashboard object for upsert
  const dashboardData: Omit<SupabaseDashboard, 'version' | 'last_modified_by'> = {
    id,
    user_id: userId,
    name: updates.name || 'Untitled Dashboard',
    description: updates.description || null,
    widgets: updates.widgets || [],
    is_published: updates.isPublished || false,
    is_template: updates.isTemplate || false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Use upsert to handle both update and create cases
  const updated = await handleSupabaseOperation(
    () => supabase
      .from('dashboards')
      .upsert(dashboardData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select('*')
      .single(),
    'Failed to update dashboard',
    false // Don't show toast for background sync
  );
  
  return transformFromSupabase(updated);
}

/**
 * Delete a dashboard from Supabase
 */
export async function deleteDashboard(id: string): Promise<void> {
  const userId = getCurrentUserId();
  
  await handleSupabaseOperation(
    () => supabase
      .from('dashboards')
      .delete()
      .eq('id', id)
      .eq('user_id', userId), // Ensure user can only delete their own dashboards
    'Failed to delete dashboard'
  );
}

/**
 * Publish a dashboard as a template
 */
export async function publishDashboard(id: string): Promise<Dashboard> {
  return updateDashboard(id, { isPublished: true, isTemplate: true });
}

/**
 * Unpublish a dashboard (remove from templates)
 */
export async function unpublishDashboard(id: string): Promise<Dashboard> {
  return updateDashboard(id, { isPublished: false, isTemplate: false });
}

/**
 * Create a dashboard from a template
 */
export async function createFromTemplate(templateId: string, name: string, description?: string): Promise<Dashboard> {
  // First, fetch the template
  const template = await handleSupabaseOperation(
    () => supabase
      .from('dashboards')
      .select('*')
      .eq('id', templateId)
      .eq('is_template', true)
      .eq('is_published', true)
      .single(),
    'Failed to fetch template'
  );
  
  const templateDashboard = transformFromSupabase(template);
  
  // Create new dashboard from template
  const newDashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'> = {
    name,
    description: description || templateDashboard.description,
    widgets: templateDashboard.widgets.map(widget => ({
      ...widget,
      id: crypto.randomUUID() // Generate new IDs for widgets
    })),
    isPublished: false,
    isTemplate: false
  };
  
  return createDashboard(newDashboard);
}

/**
 * Sync local dashboard with remote version (for conflict resolution)
 */
export async function syncDashboard(localDashboard: Dashboard): Promise<{ 
  needsUpdate: boolean; 
  remoteDashboard?: Dashboard; 
  conflict?: boolean; 
}> {
  const userId = getCurrentUserId();
  
  try {
    const { data: remote, error } = await supabase
      .from('dashboards')
      .select('*')
      .eq('id', localDashboard.id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // Dashboard doesn't exist remotely, create it
      if (error.code === 'PGRST116') {
        console.log(`Dashboard ${localDashboard.id} not found in Supabase, creating it...`);
        await createDashboard(localDashboard);
        return { needsUpdate: false };
      }
      throw error;
    }
    
    const remoteDashboard = transformFromSupabase(remote);
    
    // Check if remote is newer
    const needsUpdate = remoteDashboard.updatedAt > localDashboard.updatedAt;
    
    // Check for conflicts (both local and remote have been modified)
    const conflict = needsUpdate && localDashboard.updatedAt > new Date(localDashboard.createdAt);
    
    return { needsUpdate, remoteDashboard, conflict };
    
  } catch (error) {
    console.error('Error syncing dashboard:', error);
    return { needsUpdate: false };
  }
}

/**
 * Batch sync multiple dashboards
 */
export async function batchSyncDashboards(localDashboards: Dashboard[]): Promise<{
  updated: Dashboard[];
  conflicts: Array<{ local: Dashboard; remote: Dashboard }>;
  errors: Array<{ dashboard: Dashboard; error: string }>;
}> {
  const updated: Dashboard[] = [];
  const conflicts: Array<{ local: Dashboard; remote: Dashboard }> = [];
  const errors: Array<{ dashboard: Dashboard; error: string }> = [];
  
  // Process dashboards in parallel for better performance
  const syncPromises = localDashboards.map(async (dashboard) => {
    try {
      const syncResult = await syncDashboard(dashboard);
      
      if (syncResult.conflict && syncResult.remoteDashboard) {
        conflicts.push({ local: dashboard, remote: syncResult.remoteDashboard });
      } else if (syncResult.needsUpdate && syncResult.remoteDashboard) {
        updated.push(syncResult.remoteDashboard);
      }
    } catch (error) {
      errors.push({ 
        dashboard, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  await Promise.all(syncPromises);
  
  return { updated, conflicts, errors };
}

/**
 * Get dashboard by ID (with user permission check)
 */
export async function getDashboard(id: string): Promise<Dashboard | null> {
  const userId = getCurrentUserId();
  
  try {
    const dashboard = await handleSupabaseOperation(
      () => supabase
        .from('dashboards')
        .select('*')
        .eq('id', id)
        .or(`user_id.eq.${userId},and(is_template.eq.true,is_published.eq.true)`)
        .single(),
      'Failed to fetch dashboard',
      false
    );
    
    return transformFromSupabase(dashboard);
  } catch (error) {
    if (error instanceof Error && error.message.includes('No rows')) {
      return null;
    }
    throw error;
  }
}

/**
 * Search dashboards (user's own + published templates)
 */
export async function searchDashboards(query: string): Promise<Dashboard[]> {
  const userId = getCurrentUserId();
  
  const dashboards = await handleSupabaseOperation(
    () => supabase
      .from('dashboards')
      .select('*')
      .or(`user_id.eq.${userId},and(is_template.eq.true,is_published.eq.true)`)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('updated_at', { ascending: false }),
    'Failed to search dashboards',
    false
  );
  
  return dashboards.map(transformFromSupabase);
} 