import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useDataStore } from '@/store/dataStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { DataPage } from '@/components/data/DataPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TableWidget } from '@/components/dashboards/widgets/TableWidget';
import { DashboardEditor } from '@/components/dashboards/DashboardEditor';
import { DashboardFlowEditor } from '@/components/dashboards/DashboardFlowEditor';
import { 
  Database, 
  Upload, 
  BarChart3,
  Eye,
  Edit,
  Plus,
  FileText,
  Calendar,
  Star,
  Users,
  TrendingUp,
  ArrowLeft,
  Table,
  Layers,
  Sparkles,
  Zap,
  Activity,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { Dashboard, Widget } from '@/types';
import { toast } from 'sonner';
import { fetchThreads, updateThread } from '@/utils/supabaseUtils';

type ViewMode = 'chat' | 'dashboard-editor';

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const threadId = searchParams.get('thread_id');
  const { initialize: initializeData, tables, views } = useDataStore();
  const { dashboards, templates, createDashboard, updateDashboard } = useDashboardStore();
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [selectedDataSource, setSelectedDataSource] = useState<{ name: string; type: 'table' | 'view' } | null>(null);
  const [showDataModal, setShowDataModal] = useState(false);
  const [newChatKey, setNewChatKey] = useState<string>('');


  // Add event listener for new chat
  useEffect(() => {
    const handleNewChat = (event: Event) => {
      setNewChatKey((event as CustomEvent).detail);
      setSelectedDashboard(null);
      setViewMode('chat');
    };
    window.addEventListener('newChat', handleNewChat);
    return () => window.removeEventListener('newChat', handleNewChat);
  }, []);
  // Update new chat key when we don't have a threadId to force remount
  // Also remove the selected dashboard if present when thread changes
  useEffect(() => {
    const updateDashboardFromThread = async () => {
      //console.log('Thread id was updated', threadId);
      if (!threadId) {
        setSelectedDashboard(null);
        setViewMode('chat');
        return;
      }
  
      try {
        const threads = await fetchThreads();
        const thread = threads.find(t => t.id === threadId);
        //console.log(thread?.dashboard_id);
        //console.log(dashboards);
        if (thread?.dashboard_id) {
          const dashboard = dashboards.find(d => d.id === thread.dashboard_id);
          if (dashboard) {
            setSelectedDashboard(dashboard);
            setViewMode('dashboard-editor');
          } else {
            setSelectedDashboard(null);
            setViewMode('chat');
          }
        } else {
          setSelectedDashboard(null);
          setViewMode('chat');
        }
      } catch (err) {
        console.error("Failed to load dashboard for thread:", err);
      }
    };
  
    updateDashboardFromThread();
  }, [threadId]);
  
  // helper: set UI state AND persist to thread
  const openDashboardAndSync = async (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard);
    setViewMode('dashboard-editor');

    if (threadId) {
      try {
        await updateThread(threadId, { dashboard_id: dashboard.id });
      } catch (err) {
        console.error('Failed to sync thread → dashboard:', err);
        toast.error('Could not link this chat to the dashboard.');
      }
    }
  };
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  const handleDashboardSelect = (dashboard: Dashboard) => {
    openDashboardAndSync(dashboard);
  };

  // Add updated handleBackToChat to clear thread dashboard_id
  const handleBackToChat = async () => {
    setViewMode('chat');
    setSelectedDashboard(null);
    if (threadId) {
      try {
        await updateThread(threadId, { dashboard_id: null });
      } catch (error) {
        console.error('Failed to clear thread dashboard:', error);
        toast.error('Failed to clear thread dashboard');
      }
    }
  };

  const handleDashboardChange = async (updatedDashboard: Dashboard) => {
    setSelectedDashboard(updatedDashboard);
    updateDashboard(updatedDashboard.id, updatedDashboard);

    if (threadId) {
      try {
        await updateThread(threadId, { dashboard_id: updatedDashboard.id });
      } catch (err) {
        console.error('Failed to re-sync thread → dashboard after edit:', err);
        toast.error('Could not update the dashboard link for this chat.');
      }
    }
  };
  

  const handleCreateDashboard = () => {
    const newDashboard = createDashboard('Untitled Dashboard', 'Created with AI assistance');
    openDashboardAndSync(newDashboard);
  };

  const handleViewDashboard = (id: string) => {
    navigate(`/dashboards/view/${id}`);
  };

  const handleEditDashboard = (id: string) => {
    const dashboard = dashboards.find(d => d.id === id);
    if (dashboard) {
      openDashboardAndSync(dashboard);
    }
  };

  const [showDataPageModal, setShowDataPageModal] = useState(false);

  const handleOpenDataPage = () => {
    setShowDataPageModal(true);
  };

  const handleDataSourceClick = (name: string, type: 'table' | 'view') => {
    try {
      setSelectedDataSource({ name, type });
      setShowDataModal(true);
    } catch (error) {
      console.error('Error opening data source:', error);
      toast.error('Failed to open data source');
    }
  };

  const dataSourceWidget = useMemo(() => {
    if (!selectedDataSource) return null;
    
    return {
      id: `data-preview-${selectedDataSource.name}`,
      type: 'table' as const,
      title: `${selectedDataSource.type === 'table' ? 'Table' : 'View'}: ${selectedDataSource.name}`,
      position: { x: 0, y: 0 },
      size: { width: 800, height: 400 },
      config: {
        dataSource: selectedDataSource.name,
        query: `SELECT * FROM "${selectedDataSource.name}" LIMIT 100`,
        pageSize: 10,
        sortable: true,
        searchable: true,
        exportable: true,
        showRowNumbers: true,
        alternateRowColors: true
      }
    };
  }, [selectedDataSource]);

  const handleUseTemplate = (template: Dashboard) => {
    const newDashboard = createDashboard(
      `${template.name} Copy`,
      `Created from ${template.name} template`
    );
    
    const dashboardWithWidgets = {
      ...newDashboard,
      widgets: template.widgets.map(widget => ({
        ...widget,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      }))
    };
    
    updateDashboard(newDashboard.id, { widgets: dashboardWithWidgets.widgets });
    openDashboardAndSync(dashboardWithWidgets);
  };

  if (viewMode === 'dashboard-editor' && selectedDashboard) {
    return (
      <div className="h-[calc(100vh-3rem)] flex gap-6 overflow-hidden">
        {/* Chat Interface - 1/4 */}
        <div className="w-1/4 min-w-[400px] flex flex-col">
          <Card className="h-full flex flex-col border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader className="pb-4 flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-white">AI Assistant</CardTitle>
                    <CardDescription className="text-blue-100 text-sm">Live dashboard editing with AI</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Activity className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <div className="h-full overflow-y-auto">
              <ChatInterface 
                key={threadId ? threadId : newChatKey}
                onDashboardAction={(action, dashboard) => {
                  if (action === 'create' || action === 'edit') {
                    if (dashboard) {
                      setSelectedDashboard(dashboard);
                      setViewMode('dashboard-editor');
                    } else {
                      // Reset to chat mode if no dashboard
                      setSelectedDashboard(null);
                      setViewMode('chat');
                    }
                  }
                }}
                currentDashboard={selectedDashboard}
                threadId={threadId}
              />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Editor - 3/4 */}
        <div className="flex-1 overflow-hidden">
          <DashboardFlowEditor
            initialDashboard={selectedDashboard}
            onDashboardChange={handleDashboardChange}
            onBack={handleBackToChat}
            embedded={true}
            className="h-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] flex gap-6 overflow-hidden">
      {/* Chat Interface - 3/5 */}
      <div className="flex-1 flex flex-col">
        <Card className="h-full flex flex-col border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader className="pb-4 flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl font-semibold text-white flex items-center">
                  AI Assistant
                  <Badge variant="secondary" className="ml-3 bg-white/20 text-white border-white/30">
                    <Zap className="w-3 h-3 mr-1" />
                    Powered by AI
                  </Badge>
                </CardTitle>
                <CardDescription className="text-blue-100 text-sm mt-1">
                  Chat with AI to create dashboards and analyze data instantly
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="h-full overflow-y-auto">
            <ChatInterface 
                key={threadId ? threadId : newChatKey}
                onDashboardAction={(action, dashboard) => {
                  if (action === 'create' || action === 'edit') {
                    if (dashboard) {
                      setSelectedDashboard(dashboard);
                      setViewMode('dashboard-editor');
                    } else {
                      // Reset to chat mode if no dashboard
                      setSelectedDashboard(null);
                      setViewMode('chat');
                    }
                  }
                }}
                currentDashboard={selectedDashboard}
                threadId={threadId}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Sidebar - Data & Dashboards - 1/5 */}
      <div className="w-2/5 min-w-[320px] flex flex-col overflow-hidden">
        <div className="h-full overflow-y-auto space-y-6 pr-2 pb-6">
        {/* Data Section */}
        <Card className="flex flex-col h-[calc(50vh-3rem)] border-0 shadow-lg">
          <CardHeader className="pb-3 flex-shrink-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Database className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-white">Data Sources</CardTitle>
                  <CardDescription className="text-emerald-100 text-xs">
                    Manage your data tables and views
                  </CardDescription>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleOpenDataPage}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden bg-gradient-to-br from-white to-emerald-50/30 flex flex-col">
            <div className="flex-1 overflow-hidden p-4">
              <ScrollArea className="h-full custom-scrollbar">
                <div className="space-y-4 pr-2">
                  {/* Tables */}
                  {tables.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold text-gray-800 flex items-center font-mono">
                          <Table className="w-4 h-4 mr-2 text-emerald-600" />
                          Tables ({tables.length})
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-emerald-100">
                          <Upload className="w-3 h-3 text-emerald-600" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {tables.map((table) => (
                          <div 
                            key={table.id} 
                            className="p-2 bg-white rounded-lg border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => handleDataSourceClick(table.name, 'table')}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <Table className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                              <div className="font-semibold text-gray-900 text-xs font-mono truncate group-hover:text-emerald-700">
                                {table.name}
                              </div>
                            </div>
                            <div className="text-gray-600 text-xs font-mono">
                              {table.rowCount.toLocaleString()} rows • {table.columns.length} cols
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Views */}
                  {views.length > 0 && (
                    <div>
                      <div className="text-sm font-semibold text-gray-800 mb-3 flex items-center font-mono">
                        <Layers className="w-4 h-4 mr-2 text-emerald-600" />
                        Views ({views.length})
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {views.map((view) => (
                          <div 
                            key={view.id} 
                            className="p-2 bg-white rounded-lg border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => handleDataSourceClick(view.name, 'view')}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <Layers className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                              <div className="font-semibold text-gray-900 text-xs font-mono truncate group-hover:text-emerald-700">
                                {view.name}
                              </div>
                            </div>
                            <div className="text-gray-600 text-xs font-mono">
                              SQL View
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {tables.length === 0 && views.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Database className="w-8 h-8 text-emerald-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-2">No data sources found</p>
                      <p className="text-xs text-gray-500 mb-4">Upload CSV files or connect to databases</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            
            {/* Fixed button at bottom */}
            <div className="flex-shrink-0 p-4 pt-0 border-t border-emerald-100/50">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-9 text-xs border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                onClick={() => setShowDataPageModal(true)}
              >
                <Database className="w-4 h-4 mr-2" />
                Manage Data Sources
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dashboards & Templates */}
        <Card className="flex flex-col h-[calc(50vh-3rem)] border-0 shadow-lg">
          <CardHeader className="pb-3 flex-shrink-0 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-white">Dashboards</CardTitle>
                <CardDescription className="text-violet-100 text-xs">
                  Create and manage your analytics dashboards
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden bg-gradient-to-br from-white to-violet-50/30">
            <Tabs defaultValue="templates" className="h-full flex flex-col">
              <div className="px-4 pt-3 flex-shrink-0">
                <TabsList className="grid w-full grid-cols-3 h-8 bg-violet-100">
                  <TabsTrigger value="templates" className="text-xs data-[state=active]:bg-white data-[state=active]:text-violet-700">Templates</TabsTrigger>
                  <TabsTrigger value="published" className="text-xs data-[state=active]:bg-white data-[state=active]:text-violet-700">Published</TabsTrigger>
                  <TabsTrigger value="drafts" className="text-xs data-[state=active]:bg-white data-[state=active]:text-violet-700">Drafts</TabsTrigger>
                  
                </TabsList>
              </div>

              <div className="mt-4 flex-1 overflow-hidden">
                {/* Published Dashboards */}
                <TabsContent value="published" className="mt-0 h-full">
                  <ScrollArea className="h-full px-4">
                    <div className="space-y-3">
                      {dashboards.filter(d => d.isPublished).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="w-8 h-8 text-violet-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 mb-2">No published dashboards</p>
                          <p className="text-xs text-gray-500 mb-4">Create your first dashboard to get started</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs border-violet-200 hover:bg-violet-50"
                            onClick={handleCreateDashboard}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Create Dashboard
                          </Button>
                        </div>
                      ) : (
                        dashboards.filter(d => d.isPublished).map((dashboard) => (
                          <Card key={dashboard.id} className="p-3 hover:shadow-md transition-all duration-200 cursor-pointer border-violet-100 hover:border-violet-200 bg-white">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 truncate">
                                    {dashboard.name}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate mt-1">
                                    {dashboard.description}
                                  </div>
                                </div>
                                <Badge variant="default" className="text-xs ml-2 bg-green-100 text-green-700 border-green-200">
                                  <Activity className="w-2 h-2 mr-1" />
                                  Live
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {format(dashboard.updatedAt, 'MMM d')}
                                </div>
                                <div className="flex items-center">
                                  <BarChart3 className="w-3 h-3 mr-1" />
                                  {dashboard.widgets.length} widgets
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1 h-7 text-xs border-violet-200 hover:bg-violet-50"
                                  onClick={() => handleViewDashboard(dashboard.id)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1 h-7 text-xs border-violet-200 hover:bg-violet-50"
                                  onClick={() => handleDashboardSelect(dashboard)}
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Draft Dashboards */}
                <TabsContent value="drafts" className="mt-0 h-full">
                  <ScrollArea className="h-full px-4">
                    <div className="space-y-3">
                      {dashboards.filter(d => !d.isPublished).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-gray-300" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 mb-2">No draft dashboards</p>
                          <p className="text-xs text-gray-500">All your dashboards are published</p>
                        </div>
                      ) : (
                        dashboards.filter(d => !d.isPublished).map((dashboard) => (
                          <Card key={dashboard.id} className="p-3 hover:shadow-md transition-all duration-200 cursor-pointer border-violet-100 hover:border-violet-200 bg-white">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 truncate">
                                    {dashboard.name}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate mt-1">
                                    {dashboard.description}
                                  </div>
                                </div>
                                <Badge variant="secondary" className="text-xs ml-2 bg-orange-100 text-orange-700 border-orange-200">
                                  Draft
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {format(dashboard.updatedAt, 'MMM d')}
                                </div>
                                <div className="flex items-center">
                                  <BarChart3 className="w-3 h-3 mr-1" />
                                  {dashboard.widgets.length} widgets
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full h-7 text-xs border-violet-200 hover:bg-violet-50"
                                onClick={() => handleDashboardSelect(dashboard)}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Continue Editing
                              </Button>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Templates */}
                <TabsContent value="templates" className="mt-0 h-full">
                  <ScrollArea className="h-full px-4">
                    <div className="space-y-3">
                      {templates.map((template) => (
                        <Card key={template.id} className="p-3 hover:shadow-md transition-all duration-200 cursor-pointer border-violet-100 hover:border-violet-200 bg-white">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Star className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 truncate">
                                    {template.name}
                                  </div>
                                  <div className="text-xs text-wrap text-gray-500 truncate mt-1">
                                    {template.description}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="outline" className="text-xs py-0 px-2 bg-blue-50 text-blue-700 border-blue-200">
                                <Users className="w-2 h-2 mr-1" />
                                Popular
                              </Badge>
                              <Badge variant="outline" className="text-xs py-0 px-2 bg-green-50 text-green-700 border-green-200">
                                <TrendingUp className="w-2 h-2 mr-1" />
                                Analytics
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600 flex items-center">
                              <BarChart3 className="w-3 h-3 mr-1" />
                              {template.widgets.length} pre-built widgets
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-7 text-xs border-violet-200 hover:bg-violet-50"
                              onClick={() => handleUseTemplate(template)}
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              Use Template
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
        </div>
      </div>

{/* Data Source Preview Modal on home page */}
{showDataModal && selectedDataSource && (
  <Dialog open={showDataModal} onOpenChange={setShowDataModal}>
    {/*
      Key changes here:
      1. Use a fixed height `h-[90vh]` instead of `max-h-[90vh]` on the DialogContent. This gives flexbox a concrete height to calculate from, which is more reliable.
      2. Made DialogContent a flex container.
    */}
    <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col">
      {/*
        1. Added a border for better visual separation.
        2. Kept flex-shrink-0 so the header doesn't shrink.
      */}
      <DialogHeader className="p-6 border-b border-emerald-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <DialogTitle className="flex items-center space-x-2">
            {selectedDataSource.type === 'table' ? (
              <Table className="w-5 h-5 text-emerald-600" />
            ) : (
              <Layers className="w-5 h-5 text-emerald-600" />
            )}
            <span className="font-mono">
              {selectedDataSource.type === 'table' ? 'Table' : 'View'}: {selectedDataSource.name}
            </span>
          </DialogTitle>
        </div>
      </DialogHeader>
      
      {/*
        THIS IS THE MOST IMPORTANT CHANGE:
        1. `flex-1`: Makes this div take up all available vertical space.
        2. `min-h-0`: The magic class! Allows this div to shrink smaller than its content,
                      which constrains the TableWidget and enables its internal scroll.
        3. Removed `overflow-hidden` to let the child component manage its own scrolling.
      */}
      <div className="flex-1 min-h-0">
        {dataSourceWidget ? (
          <div className="h-full">
            <TableWidget widget={dataSourceWidget} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">Loading data source...</p>
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  </Dialog>
)}
    {/* DataPage Modal */}
    {showDataPageModal && (
      <Dialog open={showDataPageModal} onOpenChange={setShowDataPageModal}>
        <DialogContent className="max-w-6xl w-full max-h-[95vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <span className="font-mono">Manage Data Sources</span>
              </DialogTitle>
              
            </div>
          </DialogHeader>
          <div className="px-6 pb-6">
            <div className="h-[75vh] overflow-hidden bg-white">
              <DataPage />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}
  </div>
  );
}