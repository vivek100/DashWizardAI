import React from 'react';
import { Dashboard } from '@/types';
import { DashboardViewer } from '@/components/dashboards/DashboardViewer';
import { Button } from '@/components/ui/button';

interface DashboardPreviewProps {
  dashboardPreview: Dashboard;
  setDashboardPreview: (value: Dashboard | null) => void;
}

export default function DashboardPreview({ dashboardPreview, setDashboardPreview }: DashboardPreviewProps) {
  return (
    <div className="w-96 border-l border-gray-200 bg-gray-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Dashboard Preview</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDashboardPreview(null)}
          >
            ✕
          </Button>
        </div>
      </div>
      <div className="h-full overflow-auto p-4">
        <DashboardViewer dashboard={dashboardPreview} embedded={true} />
      </div>
    </div>
  );
} 