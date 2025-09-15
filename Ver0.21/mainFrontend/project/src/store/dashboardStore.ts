import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Dashboard, Widget } from '@/types';
import { localStorageManager } from '@/lib/localStorageManager';
import { syncManager, SyncStatus } from '@/lib/syncManager';
import { useAuthStore } from '@/store/authStore';
import { fetchUserDashboards, fetchTemplates } from '@/utils/dashboardSupabaseUtils';


interface DashboardState {
  // Core state
  dashboards: Dashboard[];
  currentDashboard: Dashboard | null;
  templates: Dashboard[];
  
  // Sync status (optional for components)
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  pendingOperations: number;
  isInitialized: boolean;
  
  // Initialization
  initializeStore: () => Promise<void>;
  
  // Dashboard operations (SYNCHRONOUS - no breaking changes!)
  createDashboard: (name: string, description?: string) => Dashboard;
  updateDashboard: (id: string, updates: Partial<Dashboard>) => void;
  deleteDashboard: (id: string) => void;
  publishDashboard: (id: string) => void;
  unpublishDashboard: (id: string) => void;
  createFromTemplate: (templateId: string, name: string, description?: string) => Dashboard;
  
  // Widget operations (SYNCHRONOUS - no breaking changes!)
  addWidget: (dashboardId: string, widget: Omit<Widget, 'id'>) => void;
  updateWidget: (dashboardId: string, widgetId: string, updates: Partial<Widget>) => void;
  removeWidget: (dashboardId: string, widgetId: string) => void;
  
  // Utility operations
  setCurrentDashboard: (dashboard: Dashboard | null) => void;
  
  // Manual sync control
  forceSync: () => Promise<void>;
  clearSyncQueue: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => {
  let syncStatusUnsubscribe: (() => void) | null = null;
  let queueChangeUnsubscribe: (() => void) | null = null;
  let fullSyncUnsubscribe: (() => void) | null = null;

  return {
    // Initial state
    dashboards: [],
    currentDashboard: null,
    templates: [],
    syncStatus: 'idle',
    lastSyncTime: null,
    pendingOperations: 0,
    isInitialized: false,

    // Initialize store with local data and background sync
    initializeStore: async () => {
      console.log('Initializing dashboard store with lazy sync...');
      
      try {
        // 1. Load immediately from localStorage (fast!)
        const { user } = useAuthStore.getState();
        const userId = user?.id;
        
        const { dashboards, templates } = localStorageManager.load(userId);
        
        set({
          dashboards,
          templates,
          syncStatus: 'idle',
          isInitialized: true
        });
        
        console.log(`Loaded ${dashboards.length} dashboards and ${templates.length} templates from local storage`);
        
        // 2. Setup sync manager listeners
        if (syncStatusUnsubscribe) syncStatusUnsubscribe();
        if (queueChangeUnsubscribe) queueChangeUnsubscribe();
        if (fullSyncUnsubscribe) fullSyncUnsubscribe();

        syncStatusUnsubscribe = syncManager.onStatusChange((status) => {
          set({ syncStatus: status });
        });
        
        queueChangeUnsubscribe = syncManager.onQueueChange((queueLength) => {
          set({ pendingOperations: queueLength });
        });

        fullSyncUnsubscribe = syncManager.onFullSyncComplete(({ dashboards: remote, templates }) => {
          set(state => {
            // build lookup
            const localById = Object.fromEntries(state.dashboards.map(d => [d.id, d]));
            // merge remote over local only if remote is newer
            const merged = remote.map(r => {
              const local = localById[r.id];
              if (!local) return r;
              return new Date(r.updatedAt) > new Date(local.updatedAt) ? r : local;
            });
            // also keep any purely-local dashboards
            const remoteIds = new Set(remote.map(r => r.id));
            state.dashboards.forEach(local => {
              if (!remoteIds.has(local.id)) merged.push(local);
            });
            return { dashboards: merged, templates };
          });
          // persist merged result
          const userId = useAuthStore.getState().user?.id;
          localStorageManager.save(get().dashboards, get().templates, userId);
          set({ lastSyncTime: new Date() });
        });
        
        
        // 3. Prime store from Supabase immediately
        try {
          const [remoteDashboards, remoteTemplates] = await Promise.all([
            fetchUserDashboards(),
            fetchTemplates()
          ]);
          set({ dashboards: remoteDashboards, templates: remoteTemplates });

          // Persist them for offline startup
          const userId = useAuthStore.getState().user?.id;
          localStorageManager.save(remoteDashboards, remoteTemplates, userId);

          set({ lastSyncTime: new Date() });
        } catch (err) {
          console.warn('Failed to load dashboards from Supabase, falling back to localStorage', err);
        }
        
      } catch (error) {
        console.error('Failed to initialize dashboard store:', error);
        // Still mark as initialized so app doesn't get stuck
        set({ isInitialized: true });
      }
    },

    // SYNCHRONOUS Dashboard Operations (No Breaking Changes!)
    createDashboard: (name, description) => {
      const newDashboard: Dashboard = {
        id: uuidv4(),
        name,
        description,
        widgets: [],
        isPublished: false,
        isTemplate: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 1. Update local state immediately
      set(state => ({
        dashboards: [...state.dashboards, newDashboard]
      }));
      
      // 2. Save to localStorage
      const state = get();
      localStorageManager.save(state.dashboards, state.templates, useAuthStore.getState().user?.id);
      
      // 3. Queue for background sync
      syncManager.queueOperation({
        type: 'CREATE',
        dashboard: newDashboard,
        localId: newDashboard.id
      });
      
      return newDashboard;
    },

    updateDashboard: (id, updates) => {
      // 1. Update local state immediately
      set(state => ({
        dashboards: state.dashboards.map(d => 
          d.id === id 
            ? { ...d, ...updates, updatedAt: new Date() }
            : d
        )
      }));
      
      // 2. Save to localStorage
      const state = get();
      localStorageManager.save(state.dashboards, state.templates, useAuthStore.getState().user?.id);
      
      // 3. Queue for background sync
      syncManager.queueOperation({
        type: 'UPDATE',
        id,
        changes: { ...updates, updatedAt: new Date() }
      });
    },

    deleteDashboard: (id) => {
      // 1. Update local state immediately
      set(state => ({
        dashboards: state.dashboards.filter(d => d.id !== id),
        currentDashboard: state.currentDashboard?.id === id ? null : state.currentDashboard
      }));
      
      // 2. Save to localStorage
      const state = get();
      localStorageManager.save(state.dashboards, state.templates, useAuthStore.getState().user?.id);
      
      // 3. Queue for background sync
      syncManager.queueOperation({
        type: 'DELETE',
        id
      });
    },

    publishDashboard: (id) => {
      // 1. Update local state immediately
      set(state => ({
        dashboards: state.dashboards.map(d =>
          d.id === id
            ? { ...d, isPublished: true, isTemplate: true, updatedAt: new Date() }
            : d
        )
      }));
      
      // 2. Save to localStorage
      const state = get();
      localStorageManager.save(state.dashboards, state.templates, useAuthStore.getState().user?.id);
      
      // 3. Queue for background sync
      syncManager.queueOperation({
        type: 'UPDATE',
        id,
        changes: { isPublished: true, isTemplate: true, updatedAt: new Date() }
      });
    },

    unpublishDashboard: (id) => {
      // 1. Update local state immediately
      set(state => ({
        dashboards: state.dashboards.map(d =>
          d.id === id
            ? { ...d, isPublished: false, isTemplate: false, updatedAt: new Date() }
            : d
        )
      }));
      
      // 2. Save to localStorage
      const state = get();
      localStorageManager.save(state.dashboards, state.templates, useAuthStore.getState().user?.id);
      
      // 3. Queue for background sync
      syncManager.queueOperation({
        type: 'UPDATE',
        id,
        changes: { isPublished: false, isTemplate: false, updatedAt: new Date() }
      });
    },

    createFromTemplate: (templateId, name, description) => {
      const state = get();
      const template = state.templates.find(t => t.id === templateId);
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Create new dashboard from template
      const newDashboard: Dashboard = {
        id: uuidv4(),
        name,
        description: description || template.description,
        widgets: template.widgets.map(widget => ({
          ...widget,
          id: uuidv4() // Generate new IDs for widgets
        })),
        isPublished: false,
        isTemplate: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 1. Update local state immediately
      set(state => ({
        dashboards: [...state.dashboards, newDashboard]
      }));
      
      // 2. Save to localStorage
      const newState = get();
      localStorageManager.save(newState.dashboards, newState.templates, useAuthStore.getState().user?.id);
      
      // 3. Queue for background sync
      syncManager.queueOperation({
        type: 'CREATE',
        dashboard: newDashboard,
        localId: newDashboard.id
      });
      
      return newDashboard;
    },

    // SYNCHRONOUS Widget Operations (No Breaking Changes!)
    addWidget: (dashboardId, widget) => {
      const newWidget: Widget = {
        ...widget,
        id: uuidv4()
      };
      
      // 1. Update local state immediately
      set(state => ({
        dashboards: state.dashboards.map(d =>
          d.id === dashboardId
            ? { ...d, widgets: [...d.widgets, newWidget], updatedAt: new Date() }
            : d
        )
      }));
      
      // 2. Save to localStorage
      const state = get();
      localStorageManager.save(state.dashboards, state.templates, useAuthStore.getState().user?.id);
      
      // 3. Queue dashboard update for background sync
      const updatedDashboard = state.dashboards.find(d => d.id === dashboardId);
      if (updatedDashboard) {
        syncManager.queueOperation({
          type: 'UPDATE',
          id: dashboardId,
          changes: { widgets: [...updatedDashboard.widgets, newWidget], updatedAt: new Date() }
        });
      }
    },

    updateWidget: (dashboardId, widgetId, updates) => {
      // 1. Update local state immediately
      set(state => ({
        dashboards: state.dashboards.map(d =>
          d.id === dashboardId
            ? {
                ...d,
                widgets: d.widgets.map(w =>
                  w.id === widgetId ? { ...w, ...updates } : w
                ),
                updatedAt: new Date()
              }
            : d
        )
      }));
      
      // 2. Save to localStorage
      const state = get();
      localStorageManager.save(state.dashboards, state.templates, useAuthStore.getState().user?.id);
      
      // 3. Queue dashboard update for background sync
      const updatedDashboard = state.dashboards.find(d => d.id === dashboardId);
      if (updatedDashboard) {
        syncManager.queueOperation({
          type: 'UPDATE',
          id: dashboardId,
          changes: { widgets: updatedDashboard.widgets, updatedAt: new Date() }
        });
      }
    },

    removeWidget: (dashboardId, widgetId) => {
      // 1. Update local state immediately
      set(state => ({
        dashboards: state.dashboards.map(d =>
          d.id === dashboardId
            ? {
                ...d,
                widgets: d.widgets.filter(w => w.id !== widgetId),
                updatedAt: new Date()
              }
            : d
        )
      }));
      
      // 2. Save to localStorage
      const state = get();
      localStorageManager.save(state.dashboards, state.templates, useAuthStore.getState().user?.id);
      
      // 3. Queue dashboard update for background sync
      const updatedDashboard = state.dashboards.find(d => d.id === dashboardId);
      if (updatedDashboard) {
        syncManager.queueOperation({
          type: 'UPDATE',
          id: dashboardId,
          changes: { widgets: updatedDashboard.widgets, updatedAt: new Date() }
        });
      }
    },

    // Utility operations
    setCurrentDashboard: (dashboard) => {
      set({ currentDashboard: dashboard });
    },

    // Manual sync control
    forceSync: async () => {
      await syncManager.forceSync();
      set({ lastSyncTime: new Date() });
    },

    clearSyncQueue: () => {
      syncManager.clearQueue();
    }
  };
});