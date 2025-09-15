import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

export function Layout() {
  const { isSidebarExpanded } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className={cn(
        'transition-all duration-300 ease-in-out',
        'ml-16' // Always account for collapsed sidebar
      )}>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}