import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDashboardStore } from '@/store/dashboardStore';
import { useDataStore } from '@/store/dataStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WidgetRenderer } from './WidgetRenderer';
import { Share, Download, RefreshCw } from 'lucide-react';
import { Dashboard } from '@/types';
import { toast } from 'sonner';

interface DashboardViewerProps {
  dashboard?: Dashboard;
  embedded?: boolean;
}

export function DashboardViewer({ dashboard: propDashboard, embedded = false }: DashboardViewerProps) {
  const { id } = useParams();
  const { dashboards } = useDashboardStore();
  const { initialize } = useDataStore();
  const [dashboard, setDashboard] = useState<Dashboard | null>(propDashboard || null);
  const [loading, setLoading] = useState(!propDashboard);

  useEffect(() => {
    if (propDashboard) {
      setDashboard(propDashboard);
      setLoading(false);
      return;
    }

    initialize();
    
    if (id) {
      const foundDashboard = dashboards.find(d => d.id === id && d.isPublished);
      if (foundDashboard) {
        setDashboard(foundDashboard);
      }
    }
    setLoading(false);
  }, [id, dashboards, initialize, propDashboard]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Dashboard link copied to clipboard');
  };

  const handleExport = () => {
    // In a real implementation, this would export the dashboard as PDF or image
    toast.info('Export functionality coming soon');
  };

  const handleRefresh = () => {
    // Refresh all widgets
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Not Found</h1>
          <p className="text-gray-600">The dashboard you're looking for doesn't exist or isn't published.</p>
        </div>
      </div>
    );
  }

  if (embedded) {
    return (
      <div className="h-full bg-gray-50 overflow-auto custom-scrollbar">
        {dashboard.widgets.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <h3 className="text-sm font-medium mb-1">No widgets</h3>
              <p className="text-xs">This dashboard is empty</p>
            </div>
          </div>
        ) : (
          <div className="relative p-4" style={{ minHeight: '600px' }}>
            {dashboard.widgets.map((widget) => (
              <div
                key={widget.id}
                className="absolute"
                style={{
                  left: widget.position.x,
                  top: widget.position.y,
                  width: widget.size.width,
                  height: widget.size.height,
                  transform: 'scale(0.7)',
                  transformOrigin: 'top left'
                }}
              >
                <WidgetRenderer
                  widget={widget}
                  isSelected={false}
                  isPreviewMode={true}
                  onDelete={() => {}}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{dashboard.name}</h1>
              {dashboard.description && (
                <p className="text-gray-600 mt-1">{dashboard.description}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant="default">Published</Badge>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm" onClick={handleShare}>
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto p-6">
        {dashboard.widgets.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No widgets in this dashboard
              </h3>
              <p className="text-gray-500">
                This dashboard doesn't contain any widgets yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {dashboard.widgets.map((widget) => (
              <div
                key={widget.id}
                className="absolute"
                style={{
                  left: widget.position.x,
                  top: widget.position.y,
                  width: widget.size.width,
                  height: widget.size.height
                }}
              >
                <WidgetRenderer
                  widget={widget}
                  isSelected={false}
                  isPreviewMode={true}
                  onDelete={() => {}}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}