import React from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { cn } from '@/lib/utils';
import { Loader2, Wifi, WifiOff, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface SyncStatusProps {
  className?: string;
  showText?: boolean;
}

export function SyncStatus({ className, showText = false }: SyncStatusProps) {
  const { syncStatus, pendingOperations, lastSyncTime, forceSync } = useDashboardStore();

  const getStatusInfo = () => {
    switch (syncStatus) {
      case 'syncing':
        return {
          icon: Loader2,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          text: 'Syncing...',
          description: `${pendingOperations} operations pending`
        };
      case 'offline':
        return {
          icon: WifiOff,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          text: 'Offline',
          description: 'Changes will sync when online'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          text: 'Sync Error',
          description: 'Some changes failed to sync'
        };
      case 'idle':
      default:
        return {
          icon: pendingOperations > 0 ? Clock : CheckCircle,
          color: pendingOperations > 0 ? 'text-yellow-500' : 'text-green-500',
          bgColor: pendingOperations > 0 ? 'bg-yellow-50' : 'bg-green-50',
          text: pendingOperations > 0 ? 'Pending' : 'Synced',
          description: pendingOperations > 0 
            ? `${pendingOperations} changes queued` 
            : lastSyncTime 
              ? `Last sync: ${lastSyncTime.toLocaleTimeString()}`
              : 'Up to date'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div 
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-md transition-colors cursor-pointer hover:opacity-80",
        statusInfo.bgColor,
        className
      )}
      onClick={() => {
        if (syncStatus !== 'syncing') {
          forceSync().catch(console.error);
        }
      }}
      title={statusInfo.description}
    >
      <Icon 
        className={cn(
          "h-4 w-4",
          statusInfo.color,
          syncStatus === 'syncing' && "animate-spin"
        )} 
      />
      
      {showText && (
        <span className={cn("text-sm font-medium", statusInfo.color)}>
          {statusInfo.text}
        </span>
      )}
      
      {pendingOperations > 0 && (
        <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded-full">
          {pendingOperations}
        </span>
      )}
    </div>
  );
}

// Detailed sync status component for settings/debugging
export function DetailedSyncStatus() {
  const { 
    syncStatus, 
    pendingOperations, 
    lastSyncTime, 
    isInitialized, 
    forceSync, 
    clearSyncQueue 
  } = useDashboardStore();

  const handleForceSync = async () => {
    try {
      await forceSync();
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  const handleClearQueue = () => {
    clearSyncQueue();
  };

  if (!isInitialized) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm text-gray-600">Initializing dashboard store...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Sync Status</h3>
        <SyncStatus showText />
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Status:</span>
          <span className="ml-2 font-medium capitalize">{syncStatus}</span>
        </div>
        <div>
          <span className="text-gray-500">Pending:</span>
          <span className="ml-2 font-medium">{pendingOperations}</span>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">Last Sync:</span>
          <span className="ml-2 font-medium">
            {lastSyncTime ? lastSyncTime.toLocaleString() : 'Never'}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={handleForceSync}
          disabled={syncStatus === 'syncing'}
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncStatus === 'syncing' ? 'Syncing...' : 'Force Sync'}
        </button>
        
        {pendingOperations > 0 && (
          <button
            onClick={handleClearQueue}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Clear Queue
          </button>
        )}
      </div>
    </div>
  );
} 