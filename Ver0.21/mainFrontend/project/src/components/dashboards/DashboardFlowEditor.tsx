import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow, 
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  // Controls,
  // Background,
  // MiniMap,
  ReactFlowProvider,
  NodeTypes,
  Connection,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeChange,
  EdgeChange,
  ConnectionMode,
  Panel
} from '@reactflow/core';
import { Controls } from '@reactflow/controls';
import { Background } from '@reactflow/background';
import { MiniMap } from '@reactflow/minimap';
import '@reactflow/core/dist/style.css';
import '@reactflow/controls/dist/style.css';
import '@reactflow/minimap/dist/style.css';

import { useDashboardStore } from '@/store/dashboardStore';
import { useDataStore } from '@/store/dataStore';
import { useUndoable } from '@/hooks/useUndoable';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { WidgetPicker } from './WidgetPicker';
import { WidgetConfigPanel } from './WidgetConfigPanel';
import { WidgetFlowNode } from './WidgetFlowNode';
import { 
  Save, 
  Eye, 
  Undo, 
  Redo, 
  Grid, 
  ZoomIn, 
  ZoomOut,
  ArrowLeft,
  Plus,
  Settings,
  BarChart3,
  Table,
  Target,
  Type,
  Move,
  MousePointer,
  X,
  MoreHorizontal,
  Upload
} from 'lucide-react';
import { Widget, Dashboard, WidgetNode } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Define node types
const nodeTypes: NodeTypes = {
  widget: WidgetFlowNode,
};

interface DashboardFlowEditorProps {
  // For embedded use in HomePage
  initialDashboard?: Dashboard;
  onDashboardChange?: (dashboard: Dashboard) => void;
  onBack?: () => void;
  embedded?: boolean;
  className?: string;
}

const availableWidgets = [
  {
    type: 'table' as const,
    title: 'Table View',
    description: 'Display data in sortable, paginated tables',
    icon: Table,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    type: 'chart' as const,
    title: 'Chart',
    description: 'Visualize data with various chart types',
    icon: BarChart3,
    color: 'bg-green-100 text-green-600'
  },
  {
    type: 'metric' as const,
    title: 'Metric Card',
    description: 'Show KPIs and key metrics',
    icon: Target,
    color: 'bg-purple-100 text-purple-600'
  },
  {
    type: 'text' as const,
    title: 'Text Block',
    description: 'Add rich text and content',
    icon: Type,
    color: 'bg-orange-100 text-orange-600'
  }
];

export function DashboardFlowEditor({
  initialDashboard,
  onDashboardChange,
  onBack,
  embedded = false,
  className
}: DashboardFlowEditorProps = {}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dashboards, updateDashboard, createDashboard } = useDashboardStore();
  const { initialize } = useDataStore();
  
  //const [dashboard, setDashboard] = useState<Dashboard | null>(initialDashboard || null);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [dashboardName, setDashboardName] = useState('');

  // Responsive actions state
  const [visibleActions, setVisibleActions] = useState<string[]>([]);
  const [hiddenActions, setHiddenActions] = useState<string[]>([]);
  const actionsContainerRef = useRef<HTMLDivElement>(null);
  
  // History for undo/redo
  //const [history, setHistory] = useState<Dashboard[]>([]);
  //const [historyIndex, setHistoryIndex] = useState(-1);

  // Dashbord state and history
  const {
    present: dashboard,
    set: replaceDashboard,
    undo,
    redo,
    canUndo,
    canRedo
  } = useUndoable<Dashboard>(initialDashboard!);
  
  // Track processed dashboard IDs to prevent infinite loops
  const processedDashboardRef = useRef<string | null>(null);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);





  useEffect(() => {
    initialize();

    // If embedded with initialDashboard, use that instead of URL-based logic
    if (embedded && initialDashboard) {
      replaceDashboard(initialDashboard);
      setDashboardName(initialDashboard.name);
      //setHistory([initialDashboard]);
      //setHistoryIndex(0);
      console.log('Dashboard initialized (embedded):', initialDashboard.name, 'History length:', 1);
      return;
    }
    
    // Prevent infinite loop by checking if we've already processed this dashboard ID
    if (processedDashboardRef.current === id) {
      return;
    }
    
    if (id && id !== 'new') {
      const existingDashboard = dashboards.find(d => d.id === id);
      if (existingDashboard) {
        replaceDashboard(existingDashboard);
        setDashboardName(existingDashboard.name);
        //setHistory([existingDashboard]);
        //setHistoryIndex(0);
        processedDashboardRef.current = id;
        console.log('Dashboard loaded:', existingDashboard.name, 'History length:', 1);
      }
    } else if (id === 'new') {
      // Create new dashboard only if we haven't processed this 'new' request
      const newDashboard = createDashboard('Untitled Dashboard', 'Created with AI assistance');
      replaceDashboard(newDashboard);
      setDashboardName(newDashboard.name);
      //setHistory([newDashboard]);
      //setHistoryIndex(0);
      processedDashboardRef.current = id;
      console.log('New dashboard created:', newDashboard.name, 'History length:', 1);
    }
  }, [id, dashboards, createDashboard, initialize, embedded, initialDashboard]);

  // Reset processed dashboard ref when ID changes
  useEffect(() => {
    processedDashboardRef.current = null;
  }, [id]);

  // Handle responsive actions in the top bar
  useEffect(() => {
    const actions = ['save', 'publish', 'view', 'widgets'];
    const observer = new ResizeObserver(entries => {
      const container = entries[0].target;
      const width = container.clientWidth;
      // Rough estimation of button widths
      const buttonWidths: { [key: string]: number } = { save: 80, publish: 90, view: 80, widgets: 100 };
      let totalWidth = 0;
      const visible: string[] = [];
      const hidden: string[] = [];

      for (const action of actions) {
        totalWidth += buttonWidths[action];
        if (totalWidth < width - 40) { // 40px for overflow menu trigger
          visible.push(action);
        } else {
          hidden.push(action);
        }
      }
      setVisibleActions(visible);
      setHiddenActions(hidden);
    });

    if (actionsContainerRef.current) {
      observer.observe(actionsContainerRef.current);
    }

    return () => {
      if (actionsContainerRef.current) {
        observer.unobserve(actionsContainerRef.current);
      }
    };
  }, []);


  const updateDashboardState = useCallback((updates: Partial<Dashboard>, saveHistory = true) => {
    if (!dashboard) return;
    
    console.log('updateDashboardState called with:', Object.keys(updates), 'saveHistory:', saveHistory);
    const updatedDashboard = { ...dashboard, ...updates, updatedAt: new Date() };
    replaceDashboard(updatedDashboard);
    
    // Call onDashboardChange callback if embedded
    //if (embedded && onDashboardChange) {
    //  onDashboardChange(updatedDashboard);
    //}
  }, [dashboard, embedded, onDashboardChange]);

  const handleUndo = undo;
  const handleRedo = redo;

  // Widget interaction handlers
  const handleWidgetSelect = useCallback((widget: Widget) => {
    setSelectedWidget(widget);
    setShowConfigPanel(false);
  }, []);

  const handleWidgetConfigure = useCallback((widget: Widget) => {
    setSelectedWidget(widget);
    setShowConfigPanel(true);
  }, []);

  const handleWidgetDelete = useCallback((widgetId: string) => {
    if (!dashboard) return;
    
    updateDashboardState({
      widgets: dashboard.widgets.filter(w => w.id !== widgetId)
    });
    
    if (selectedWidget?.id === widgetId) {
      setSelectedWidget(null);
      setShowConfigPanel(false);
    }
  }, [dashboard, selectedWidget, updateDashboardState]);

  const handleWidgetResize = useCallback((widgetId: string, size: { width: number; height: number }) => {
    if (!dashboard) return;
    
    const updatedWidgets = dashboard.widgets.map(w =>
      w.id === widgetId ? { ...w, size } : w
    );
    
    updateDashboardState({ widgets: updatedWidgets });
  }, [dashboard, updateDashboardState]);

  // Convert widgets to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    if (!dashboard) return [];
      
    return dashboard.widgets.map((widget) => ({
      id: widget.id,
      type: 'widget',
      position: widget.position,
      data: {
        widget,
        onSelect: handleWidgetSelect,
        onConfigure: handleWidgetConfigure,
        onDelete: handleWidgetDelete,
        onResize: handleWidgetResize,
        isSelected: selectedWidget?.id === widget.id,
        isPreviewMode
      },
      style: {
        width: widget.size.width,
        height: widget.size.height,
      },
    }));
  }, [dashboard, selectedWidget, isPreviewMode, handleWidgetSelect, handleWidgetConfigure, handleWidgetDelete, handleWidgetResize]);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update nodes when dashboard changes (but not when just positions change to avoid conflicts)
  React.useEffect(() => {
    if (dashboard) {
      setNodes(currentNodes => {
        // Only update if the widgets structure has actually changed
        if (currentNodes.length !== dashboard.widgets.length || 
            dashboard.widgets.some(widget => !currentNodes.find(node => node.id === widget.id))) {
          return dashboard.widgets.map((widget) => ({
            id: widget.id,
            type: 'widget',
            position: widget.position,
            data: {
              widget,
              onSelect: handleWidgetSelect,
              onConfigure: handleWidgetConfigure,
              onDelete: handleWidgetDelete,
              onResize: handleWidgetResize,
              isSelected: selectedWidget?.id === widget.id,
              isPreviewMode
            },
            style: {
              width: widget.size.width,
              height: widget.size.height,
            },
          }));
        }
        
        // Update only the data and selection state, preserve positions from React Flow
        return currentNodes.map(node => {
          const widget = dashboard.widgets.find(w => w.id === node.id);
          if (widget) {
            return {
              ...node,
              data: {
                ...node.data,
                widget,
                isSelected: selectedWidget?.id === widget.id,
                isPreviewMode
              },
              style: {
                width: widget.size.width,
                height: widget.size.height,
              },
            };
          }
          return node;
        });
      });
    }
  }, [dashboard?.widgets?.length, selectedWidget, isPreviewMode, setNodes, handleWidgetSelect, handleWidgetConfigure, handleWidgetDelete, handleWidgetResize]);

  // Handle widget size updates
  React.useEffect(() => {
    if (dashboard) {
      setNodes(currentNodes => 
        currentNodes.map(node => {
          const widget = dashboard.widgets.find(w => w.id === node.id);
          if (widget && (node.style?.width !== widget.size.width || node.style?.height !== widget.size.height)) {
            return {
              ...node,
              style: {
                ...node.style,
                width: widget.size.width,
                height: widget.size.height,
              },
            };
          }
          return node;
        })
      );
    }
  }, [dashboard?.widgets, setNodes]);

  // React Flow event handlers
  const onNodesChangeHandler: OnNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  const onEdgesChangeHandler: OnEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  const onNodeDragStop = useCallback((_event: any, node: any) => {
    if (!dashboard) return;
    console.log('onNodeDragStop called with:', node);
    const updatedWidgets = dashboard.widgets.map(w =>
      w.id === node.id
        ? { ...w, position: node.position }
        : w
    );
    console.log('updatedWidgets:', updatedWidgets);
    updateDashboardState({ widgets: updatedWidgets });
  }, [dashboard, updateDashboardState]);

  const onConnectHandler: OnConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, [setEdges]);

  const handleAddWidget = useCallback((widgetType: Widget['type']) => {
    if (!dashboard) return;
    
    const newWidget: Widget = {
      id: Date.now().toString(),
      type: widgetType,
      title: `New ${widgetType.charAt(0).toUpperCase() + widgetType.slice(1)}`,
      position: { x: 100, y: 100 },
      size: { 
        width: widgetType === 'metric' ? 300 : 600, 
        height: widgetType === 'metric' ? 200 : 400 
      },
      config: {}
    };
    
    updateDashboardState({
      widgets: [...dashboard.widgets, newWidget]
    });
    
    setSelectedWidget(newWidget);
    setShowWidgetPicker(false);
    setShowConfigPanel(true);
  }, [dashboard, updateDashboardState]);

  const handleSaveDashboard = useCallback(async () => {
    if (!dashboard) return;
    
    try {
      const updatedDashboard = {
        ...dashboard,
        name: dashboardName,
        updatedAt: new Date()
      };
      
      if (!embedded) {
        await updateDashboard(dashboard.id, updatedDashboard);
      }
      
      // Update local state but don't save to history (it's just a save operation)
      replaceDashboard(updatedDashboard);
      setDashboardName(updatedDashboard.name);
      
      // Call onDashboardChange callback if embedded
      if (embedded && onDashboardChange) {
        onDashboardChange(updatedDashboard);
      }
      
      toast.success('Dashboard saved successfully');
    } catch (error) {
      toast.error('Failed to save dashboard');
    }
  }, [dashboard, dashboardName, updateDashboard, embedded, onDashboardChange]);

  const handlePublishDashboard = useCallback(async () => {
    if (!dashboard) return;
    
    try {
      const publishedDashboard = {
        ...dashboard,
        name: dashboardName,
        isPublished: true,
        updatedAt: new Date()
      };
      
      if (!embedded) {
        await updateDashboard(dashboard.id, publishedDashboard);
      }
      replaceDashboard(publishedDashboard);
      
      // Call onDashboardChange callback if embedded
      if (embedded && onDashboardChange) {
        onDashboardChange(publishedDashboard);
      }
      
      toast.success('Dashboard published successfully');
    } catch (error) {
      toast.error('Failed to publish dashboard');
    }
  }, [dashboard, dashboardName, updateDashboard, embedded, onDashboardChange]);

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center space-x-4">
          {(embedded && onBack) ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : !embedded ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboards')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : null}
          <Separator orientation="vertical" className="h-6" />
          <Input
            value={dashboardName}
            onChange={(e) => setDashboardName(e.target.value)}
            className="text-lg font-semibold border-none shadow-none p-0 h-auto bg-transparent"
            placeholder="Dashboard name..."
          />
          <Badge variant={dashboard.isPublished ? "default" : "secondary"}>
            {dashboard.isPublished ? 'Published' : 'Draft'}
          </Badge>
        </div>

        <div className="flex items-center space-x-2 w-full">
          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={!canRedo}
          >
            <Redo className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          {/* View Controls */}
          <Button
            variant={showGrid ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={isPreviewMode ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div ref={actionsContainerRef} className="flex items-center space-x-2 flex-1 justify-end min-w-0">
            <div className="flex items-center space-x-2">
              {visibleActions.includes('view') && (
                <Button variant="ghost" size="icon" className="p-2" onClick={() => setIsPreviewMode(!isPreviewMode)}>
                  <Eye className="w-5 h-5" />
                </Button>
              )}
              {visibleActions.includes('widgets') && (
                <Button variant="outline" className="p-2 h-9" onClick={() => setShowWidgetPicker(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Widgets
                </Button>
              )}
              {visibleActions.includes('save') && (
                <Button variant="outline" className="p-2 h-9" onClick={handleSaveDashboard}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              )}
              {visibleActions.includes('publish') && (
                <Button className="p-2 h-9 bg-black text-white" onClick={handlePublishDashboard}>
                  <Upload className="w-4 h-4 mr-2" />
                  Publish
                </Button>
              )}
            </div>

            {hiddenActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="p-2">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {hiddenActions.includes('save') && <DropdownMenuItem onClick={handleSaveDashboard}><Save className="w-4 h-4 mr-2" />Save</DropdownMenuItem>}
                  {hiddenActions.includes('publish') && <DropdownMenuItem onClick={handlePublishDashboard}><Upload className="w-4 h-4 mr-2" />Publish</DropdownMenuItem>}
                  {hiddenActions.includes('view') && <DropdownMenuItem onClick={() => setIsPreviewMode(!isPreviewMode)}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>}
                  {hiddenActions.includes('widgets') && <DropdownMenuItem onClick={() => setShowWidgetPicker(true)}><Plus className="w-4 h-4 mr-2" />Widgets</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Quick Widget Picker */}
        {!isPreviewMode && (
          <div className="w-16 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="p-3 space-y-3 overflow-hidden flex flex-col items-center">
              <div className="flex items-center justify-center mb-4">
                <button
                  className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center hover:bg-blue-200 transition"
                  onClick={() => setShowWidgetPicker(true)}
                  aria-label="Add widget"
                >
                  <Plus className="w-5 h-5 text-blue-600" />
                </button>
              </div>
              {/* Quick add for common widgets */}
              {availableWidgets.map((widget, index) => (
                <button
                  key={widget.type}
                  className={cn(
                    "group relative flex items-center justify-center cursor-pointer widget-picker-item w-10 h-10 rounded-lg mb-2 hover:scale-110 hover:shadow-md transition",
                    widget.color
                  )}
                  style={{
                    animationDelay: `${index * 80}ms`,
                    animationFillMode: 'forwards'
                  }}
                  onClick={() => handleAddWidget(widget.type)}
                  aria-label={`Add ${widget.title}`}
                >
                  <widget.icon className="w-6 h-6" />
                  {/* Tooltip */}
                  <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {widget.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main React Flow Canvas */}
        <div ref={reactFlowWrapper} className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeHandler}
            onEdgesChange={onEdgesChangeHandler}
            onNodeDragStop={onNodeDragStop}
            onConnect={onConnectHandler}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            attributionPosition="bottom-left"
            nodesDraggable={!isPreviewMode}
            nodesConnectable={!isPreviewMode}
            elementsSelectable={!isPreviewMode}
            className={cn(
              "bg-gray-50"
            )}
            noWheelClassName='noWheel'
            snapToGrid={true}
            snapGrid={[20, 20]}
            onNodeContextMenu={(event, node) => {
              event.preventDefault();
              // find the widget object by node.id
              const widget = dashboard?.widgets.find(w => w.id === node.id);
              if (widget) {
                handleWidgetConfigure(widget);
              }
            }}
          >
            <Background
              variant={showGrid ? "dots" as any : "lines" as any}
              gap={20}
              size={1}
              color="#e5e7eb"
            />
            <Controls showInteractive={!isPreviewMode} />
            <MiniMap
              nodeStrokeColor={(n) => {
                if (n.type === 'widget') return '#1e40af';
                return '#eee';
              }}
              nodeColor={(n) => {
                if (n.type === 'widget') return '#fff';
                return '#eee';
              }}
              nodeBorderRadius={2}
            />
            
            {/* Empty state */}
            {dashboard.widgets.length === 0 && (
              <Panel position="top-center">
                <div className="text-center pointer-events-none">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Start building your dashboard
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Click on widgets from the sidebar to add them
                  </p>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Right Sidebar - Widget Configuration */}
        {showConfigPanel && selectedWidget && !isPreviewMode && (
          <div className="w-96 bg-white border-l border-gray-200 flex-shrink-0">
            <WidgetConfigPanel
              widget={selectedWidget}
              onUpdate={(updates) => {
                if (!dashboard) return;
                const updatedWidgets = dashboard.widgets.map(w =>
                  w.id === selectedWidget.id ? { ...w, ...updates } : w
                );
                updateDashboardState({ widgets: updatedWidgets });
                setSelectedWidget({ ...selectedWidget, ...updates });
              }}
              onClose={() => {
                setShowConfigPanel(false);
                setSelectedWidget(null);
              }}
            />
          </div>
        )}
      </div>

      {/* Widget Picker Modal */}
      <WidgetPicker
        open={showWidgetPicker}
        onOpenChange={setShowWidgetPicker}
        onSelectWidget={handleAddWidget}
      />
    </div>
  );
}

// Wrap with ReactFlowProvider for proper context
export function DashboardFlowEditorWrapper(props: DashboardFlowEditorProps) {
  return (
    <ReactFlowProvider>
      <DashboardFlowEditor {...props} />
    </ReactFlowProvider>
  );
} 