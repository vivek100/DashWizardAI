import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDashboardStore } from '@/store/dashboardStore';
import { useDataStore } from '@/store/dataStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { WidgetPicker } from './WidgetPicker';
import { WidgetRenderer } from './WidgetRenderer';
import { WidgetConfigPanel } from './WidgetConfigPanel';
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
import { Widget, Dashboard } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DragState {
  isDragging: boolean;
  draggedWidget: Widget | null;
  offset: { x: number; y: number };
  startPosition: { x: number; y: number };
}

interface ResizeState {
  isResizing: boolean;
  resizedWidget: Widget | null;
  resizeHandle: string;
  startSize: { width: number; height: number };
  startPosition: { x: number; y: number };
}

interface CanvasState {
  pan: { x: number; y: number };
  isPanning: boolean;
  lastPanPosition: { x: number; y: number };
}
interface DashboardEditorProps {
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

export function DashboardEditor({
  initialDashboard,
  onDashboardChange,
  onBack,
  embedded = false,
  className
}: DashboardEditorProps = {}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dashboards, updateDashboard, createDashboard } = useDashboardStore();
  const { initialize } = useDataStore();
  
  const [dashboard, setDashboard] = useState<Dashboard | null>(initialDashboard || null);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [dashboardName, setDashboardName] = useState('');

  // Responsive actions state
  const [visibleActions, setVisibleActions] = useState<string[]>([]);
  const [hiddenActions, setHiddenActions] = useState<string[]>([]);
  const actionsContainerRef = useRef<HTMLDivElement>(null);
  
  // Canvas state for panning and zooming
  const [canvasState, setCanvasState] = useState<CanvasState>({
    pan: { x: 0, y: 0 },
    isPanning: false,
    lastPanPosition: { x: 0, y: 0 }
  });
  
  // Drag and drop state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedWidget: null,
    offset: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 }
  });
  
  // Resize state
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    resizedWidget: null,
    resizeHandle: '',
    startSize: { width: 0, height: 0 },
    startPosition: { x: 0, y: 0 }
  });
  
  // History for undo/redo
  const [history, setHistory] = useState<Dashboard[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Track processed dashboard IDs to prevent infinite loops
  const processedDashboardRef = useRef<string | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const GRID_SIZE = 20;
  
  // State for widget picker expansion (no hover)
  const [isWidgetPickerCollapsed, setIsWidgetPickerCollapsed] = useState(true);

  useEffect(() => {
    initialize();

    // If embedded with initialDashboard, use that instead of URL-based logic
    if (embedded && initialDashboard) {
      setDashboard(initialDashboard);
      setDashboardName(initialDashboard.name);
      setHistory([initialDashboard]);
      setHistoryIndex(0);
      return;
    }
    
    // Prevent infinite loop by checking if we've already processed this dashboard ID
    if (processedDashboardRef.current === id) {
      return;
    }
    
    if (id && id !== 'new') {
      const existingDashboard = dashboards.find(d => d.id === id);
      if (existingDashboard) {
        setDashboard(existingDashboard);
        setDashboardName(existingDashboard.name);
        setHistory([existingDashboard]);
        setHistoryIndex(0);
        processedDashboardRef.current = id;
      }
    } else if (id === 'new') {
      // Create new dashboard only if we haven't processed this 'new' request
      const newDashboard = createDashboard('Untitled Dashboard', 'Created with AI assistance');
      setDashboard(newDashboard);
      setDashboardName(newDashboard.name);
      setHistory([newDashboard]);
      setHistoryIndex(0);
      processedDashboardRef.current = id;
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

  const saveToHistory = useCallback((newDashboard: Dashboard) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newDashboard);
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const updateDashboardState = useCallback((updates: Partial<Dashboard>) => {
    if (!dashboard) return;
    
    const updatedDashboard = { ...dashboard, ...updates, updatedAt: new Date() };
    setDashboard(updatedDashboard);
    saveToHistory(updatedDashboard);
    
    // Call onDashboardChange callback if embedded
    if (embedded && onDashboardChange) {
      onDashboardChange(updatedDashboard);
    }
  }, [dashboard, saveToHistory, embedded, onDashboardChange]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevDashboard = history[historyIndex - 1];
      setDashboard(prevDashboard);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextDashboard = history[historyIndex + 1];
      setDashboard(nextDashboard);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  const snapToGrid = useCallback((value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  // Canvas panning handlers
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current && !dragState.isDragging && !resizeState.isResizing) {
      setCanvasState(prev => ({
        ...prev,
        isPanning: true,
        lastPanPosition: { x: e.clientX, y: e.clientY }
      }));
    }
  }, [dragState.isDragging, resizeState.isResizing]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (canvasState.isPanning) {
      const deltaX = e.clientX - canvasState.lastPanPosition.x;
      const deltaY = e.clientY - canvasState.lastPanPosition.y;
      
      setCanvasState(prev => ({
        ...prev,
        pan: {
          x: prev.pan.x + deltaX,
          y: prev.pan.y + deltaY
        },
        lastPanPosition: { x: e.clientX, y: e.clientY }
      }));
    }
  }, [canvasState.isPanning, canvasState.lastPanPosition]);

  const handleCanvasMouseUp = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      isPanning: false
    }));
  }, []);

  // Zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, widget: Widget, action: 'drag' | 'resize', handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clientX = (e.clientX - rect.left - canvasState.pan.x) / zoom;
    const clientY = (e.clientY - rect.top - canvasState.pan.y) / zoom;
    
    if (action === 'drag') {
      setDragState({
        isDragging: true,
        draggedWidget: widget,
        offset: {
          x: clientX - widget.position.x,
          y: clientY - widget.position.y
        },
        startPosition: { x: clientX, y: clientY }
      });
    } else if (action === 'resize' && handle) {
      setResizeState({
        isResizing: true,
        resizedWidget: widget,
        resizeHandle: handle,
        startSize: { ...widget.size },
        startPosition: { x: clientX, y: clientY }
      });
    }
    
    // Set selected widget and open config panel
    setSelectedWidget(widget);
    setShowConfigPanel(true);
  }, [zoom, canvasState.pan]);

  // Add handler for widget click (separate from drag)
  const handleWidgetClick = useCallback((e: React.MouseEvent, widget: Widget) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only handle click if we're not dragging or resizing
    if (!dragState.isDragging && !resizeState.isResizing) {
      setSelectedWidget(widget);
      setShowConfigPanel(true);
    }
  }, [dragState.isDragging, resizeState.isResizing]);

  // Enhanced canvas click to close config panel when clicking empty space
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedWidget(null);
      setShowConfigPanel(false);
    }
  }, []);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dashboard) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clientX = (e.clientX - rect.left - canvasState.pan.x) / zoom;
    const clientY = (e.clientY - rect.top - canvasState.pan.y) / zoom;
    
    if (dragState.isDragging && dragState.draggedWidget) {
      const newX = snapToGrid(clientX - dragState.offset.x);
      const newY = snapToGrid(clientY - dragState.offset.y);
      
      const updatedWidgets = dashboard.widgets.map(w =>
        w.id === dragState.draggedWidget!.id
          ? { ...w, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
          : w
      );
      
      setDashboard({ ...dashboard, widgets: updatedWidgets });
    }
    
    if (resizeState.isResizing && resizeState.resizedWidget) {
      const deltaX = clientX - resizeState.startPosition.x;
      const deltaY = clientY - resizeState.startPosition.y;
      
      let newWidth = resizeState.startSize.width;
      let newHeight = resizeState.startSize.height;
      
      if (resizeState.resizeHandle.includes('right')) {
        newWidth = Math.max(200, snapToGrid(resizeState.startSize.width + deltaX));
      }
      if (resizeState.resizeHandle.includes('bottom')) {
        newHeight = Math.max(150, snapToGrid(resizeState.startSize.height + deltaY));
      }
      if (resizeState.resizeHandle.includes('left')) {
        newWidth = Math.max(200, snapToGrid(resizeState.startSize.width - deltaX));
      }
      if (resizeState.resizeHandle.includes('top')) {
        newHeight = Math.max(150, snapToGrid(resizeState.startSize.height - deltaY));
      }
      
      const updatedWidgets = dashboard.widgets.map(w =>
        w.id === resizeState.resizedWidget!.id
          ? { ...w, size: { width: newWidth, height: newHeight } }
          : w
      );
      
      setDashboard({ ...dashboard, widgets: updatedWidgets });
    }

    // Handle canvas panning
    handleCanvasMouseMove(e);
  }, [dashboard, dragState, resizeState, snapToGrid, zoom, canvasState.pan, handleCanvasMouseMove]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging || resizeState.isResizing) {
      if (dashboard) {
        saveToHistory(dashboard);
      }
    }
    
    setDragState({
      isDragging: false,
      draggedWidget: null,
      offset: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 }
    });
    
    setResizeState({
      isResizing: false,
      resizedWidget: null,
      resizeHandle: '',
      startSize: { width: 0, height: 0 },
      startPosition: { x: 0, y: 0 }
    });

    handleCanvasMouseUp();
  }, [dashboard, dragState.isDragging, resizeState.isResizing, saveToHistory, handleCanvasMouseUp]);

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

  const handleDeleteWidget = useCallback((widgetId: string) => {
    if (!dashboard) return;
    
    updateDashboardState({
      widgets: dashboard.widgets.filter(w => w.id !== widgetId)
    });
    
    if (selectedWidget?.id === widgetId) {
      setSelectedWidget(null);
      setShowConfigPanel(false);
    }
  }, [dashboard, selectedWidget, updateDashboardState]);

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
      setDashboard(updatedDashboard);
      
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
      setDashboard(publishedDashboard);
      
      // Call onDashboardChange callback if embedded
      if (embedded && onDashboardChange) {
        onDashboardChange(publishedDashboard);
      }
      
      toast.success('Dashboard published successfully');
    } catch (error) {
      toast.error('Failed to publish dashboard');
    }
  }, [dashboard, dashboardName, updateDashboard, embedded, onDashboardChange]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const resetCanvasView = useCallback(() => {
    setZoom(1);
    setCanvasState(prev => ({ ...prev, pan: { x: 0, y: 0 } }));
  }, []);

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
            disabled={historyIndex <= 0}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          {/* Zoom Controls */}
          <Button variant="ghost" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={resetCanvasView}>
            <MousePointer className="w-4 h-4" />
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
        {/* Left Sidebar - Hover-based Widget Picker */}
        {!isPreviewMode && (
          <div 
            className={cn(
              "bg-white border-r border-gray-200 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out relative z-20",
              isWidgetPickerCollapsed ? "w-16" : "w-80"
            )}
          >
            {/* Collapsed sidebar: direct add for common widgets, expand for advanced */}
            {isWidgetPickerCollapsed ? (
              <div className="p-3 space-y-3 overflow-hidden flex flex-col items-center">
                {/* + icon to expand */}
                <div className="flex items-center justify-center mb-4">
                  <button
                    className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center hover:bg-blue-200 transition"
                    onClick={() => setIsWidgetPickerCollapsed(false)}
                    aria-label="Expand widget picker"
                  >
                    <Plus className="w-5 h-5 text-blue-600" />
                  </button>
                </div>
                {/* Direct add for Table, Chart, Metric, Text */}
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
            ) : (
              // Expanded state - full widget picker
              <div className="h-full flex flex-col animate-slide-in-left">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Available Widgets</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsWidgetPickerCollapsed(true)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 px-4">Click widgets to add them to your dashboard</p>
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-3">
                    {availableWidgets.map((widget, index) => (
                      <Card
                        key={widget.type}
                        className={cn(
                          "cursor-pointer widget-hover-transition hover:shadow-md hover:border-blue-300"
                        )}
                        style={{
                          animationDelay: `${200 + index * 100}ms`,
                          animationFillMode: 'forwards'
                        }}
                        onClick={() => handleAddWidget(widget.type)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              widget.color
                            )}>
                              <widget.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">
                                {widget.title}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {widget.description}
                              </div>
                            </div>
                            <Plus className="w-4 h-4 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
        {/* Main Canvas */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
          style={{ cursor: canvasState.isPanning ? 'grabbing' : 'grab' }}
        >
          <div
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{
              transform: `translate(${canvasState.pan.x}px, ${canvasState.pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              backgroundImage: showGrid && !isPreviewMode
                ? `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`
                : 'none',
              backgroundSize: showGrid && !isPreviewMode ? `${GRID_SIZE}px ${GRID_SIZE}px` : 'auto',
              minWidth: '200%',
              minHeight: '200%'
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onClick={handleCanvasClick}
          >
            {dashboard.widgets.map((widget) => (
              <div
                key={widget.id}
                className={cn(
                  "absolute border-2 transition-all duration-200",
                  selectedWidget?.id === widget.id && !isPreviewMode
                    ? "border-blue-500 shadow-lg"
                    : "border-transparent hover:border-gray-300",
                  dragState.draggedWidget?.id === widget.id && "cursor-grabbing",
                  !isPreviewMode && "cursor-grab"
                )}
                style={{
                  left: widget.position.x,
                  top: widget.position.y,
                  width: widget.size.width,
                  height: widget.size.height,
                  zIndex: selectedWidget?.id === widget.id ? 10 : 1
                }}
                onMouseDown={(e) => !isPreviewMode && handleMouseDown(e, widget, 'drag')}
                onClick={(e) => !isPreviewMode && handleWidgetClick(e, widget)}
              >
                <WidgetRenderer
                  widget={widget}
                  isSelected={selectedWidget?.id === widget.id}
                  isPreviewMode={isPreviewMode}
                  onDelete={() => handleDeleteWidget(widget.id)}
                />
                
                {/* Resize Handles */}
                {selectedWidget?.id === widget.id && !isPreviewMode && (
                  <>
                    {/* Corner handles */}
                    <div
                      className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-nw-resize -top-1 -left-1"
                      onMouseDown={(e) => handleMouseDown(e, widget, 'resize', 'top-left')}
                    />
                    <div
                      className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-ne-resize -top-1 -right-1"
                      onMouseDown={(e) => handleMouseDown(e, widget, 'resize', 'top-right')}
                    />
                    <div
                      className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-sw-resize -bottom-1 -left-1"
                      onMouseDown={(e) => handleMouseDown(e, widget, 'resize', 'bottom-left')}
                    />
                    <div
                      className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-se-resize -bottom-1 -right-1"
                      onMouseDown={(e) => handleMouseDown(e, widget, 'resize', 'bottom-right')}
                    />
                    
                    {/* Edge handles */}
                    <div
                      className="absolute w-full h-1 cursor-n-resize -top-1 left-0"
                      onMouseDown={(e) => handleMouseDown(e, widget, 'resize', 'top')}
                    />
                    <div
                      className="absolute w-full h-1 cursor-s-resize -bottom-1 left-0"
                      onMouseDown={(e) => handleMouseDown(e, widget, 'resize', 'bottom')}
                    />
                    <div
                      className="absolute w-1 h-full cursor-w-resize -left-1 top-0"
                      onMouseDown={(e) => handleMouseDown(e, widget, 'resize', 'left')}
                    />
                    <div
                      className="absolute w-1 h-full cursor-e-resize -right-1 top-0"
                      onMouseDown={(e) => handleMouseDown(e, widget, 'resize', 'right')}
                    />
                  </>
                )}
              </div>
            ))}
            
            {/* Empty state */}
            {dashboard.widgets.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
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
              </div>
            )}
          </div>
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