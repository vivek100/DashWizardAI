import React, { useMemo } from 'react';
import { 
  AIComponent, WidgetComponentData, DashboardComponentData, 
  SQLResultComponentData, UploadPromptComponentData, ErrorComponentData,
  Widget
} from '@/types';
import { ChartWidget } from '@/components/dashboards/widgets/ChartWidget';
import { TableWidget } from '@/components/dashboards/widgets/TableWidget';
import { MetricWidget } from '@/components/dashboards/widgets/MetricWidget';
import { TextWidget } from '@/components/dashboards/widgets/TextWidget';
import { DashboardViewer } from '@/components/dashboards/DashboardViewer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, AlertCircle, Wrench, CheckCircle, BarChart3, 
  TableIcon, TrendingUp, FileText, Database, Download, 
  Eye, Save, Plus, Code, Play
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { ScrollBar } from '../ui/scroll-area';
import { Table, TableRow, TableBody, TableHeader, TableHead, TableCell } from '../ui/table';

interface AIComponentRendererProps {
  component: AIComponent;
  onComponentAction: (action: string, componentId: string, data?: unknown) => void;
  collapsedToolResults: { [key: string]: boolean };
  setCollapsedToolResults: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
}

function AIComponentRenderer({ 
  component, 
  onComponentAction, 
  collapsedToolResults, 
  setCollapsedToolResults 
}: AIComponentRendererProps) {
  try {
    switch (component.type) {
      case 'widget': {
        const widgetData = component.data as WidgetComponentData;

        // Memoize the widget config to stabilize identity across re-renders
        const stableConfig = useMemo(
          () => widgetData.widget.config,
          [JSON.stringify(widgetData.widget.config)]
        );
        const stableWidget = useMemo(
          () => ({ ...widgetData.widget, config: stableConfig }),
          [stableConfig]
        );

        return (
          <div className="border rounded-lg p-4 bg-gray-50 mt-3 w-full overflow-hidden">
            <div className="flex justify-between items-center mb-3 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {stableWidget.type === 'chart' && <BarChart3 className="w-4 h-4 flex-shrink-0" />}
                {stableWidget.type === 'metric' && <TrendingUp className="w-4 h-4 flex-shrink-0" />}
                {stableWidget.type === 'table' && <TableIcon className="w-4 h-4 flex-shrink-0" />}
                {stableWidget.type === 'text' && <FileText className="w-4 h-4 flex-shrink-0" />}
                <h4 className="font-medium truncate">Widget Preview</h4>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onComponentAction('add_to_dashboard', component.id, { widget: stableWidget })}
                  className="whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
            <div className="bg-white rounded border overflow-auto custom-scrollbar" style={{ height: '280px', maxWidth: '100%' }}>
              <div style={{ minWidth: '300px', width: '100%', height: '100%' }}>
                {stableWidget.type === 'chart' && <ChartWidget widget={stableWidget} />}
                {stableWidget.type === 'metric' && <MetricWidget widget={stableWidget} />}
                {stableWidget.type === 'table' && <TableWidget widget={stableWidget} />}
                {stableWidget.type === 'text' && <TextWidget widget={stableWidget} />}
              </div>
            </div>
            {widgetData.showSQL && stableWidget.config.query && (
              <div className="mt-3 p-3 bg-gray-900 text-green-400 rounded text-sm font-mono overflow-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="w-3 h-3 flex-shrink-0" />
                  <span className="text-xs font-sans">SQL Query</span>
                </div>
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {stableWidget.config.query}
                </pre>
              </div>
            )}
          </div>
        );
      }

      case 'dashboard': {
        const dashboardData = component.data as DashboardComponentData;
        // Memoize the dashboard object to stabilize identity
        const stableDashboard = useMemo(
          () => dashboardData.dashboard,
          [JSON.stringify(dashboardData.dashboard)]
        );
        return (
          <div className="border rounded-lg p-4 bg-gray-50 mt-3 w-full overflow-hidden max-w-full overflow-hidden">
            <div className="flex flex-wrap justify-between items-start sm:items-center mb-3 gap-2">
              {/* title + badge */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Database className="w-4 h-4 flex-shrink-0" />
                <h4 className="font-medium truncate">Dashboard Preview</h4>
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {dashboardData.dashboard.widgets.length} widgets
                </Badge>
              </div>

              {/* buttons */}
              <div className="flex gap-2 flex-shrink-0">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onComponentAction('open_editor', component.id, dashboardData)}
                  className="whitespace-nowrap"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button 
                  size="sm"
                  onClick={() => onComponentAction('save_dashboard', component.id, dashboardData)}
                  className="whitespace-nowrap"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>

            <div className="bg-white rounded border overflow-auto custom-scrollbar w-full max-w-full" style={{ height: '400px' }}>
              <div className="h-full overflow-auto custom-scrollbar">
                <DashboardViewer dashboard={stableDashboard} embedded={true} />
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600 space-y-1">
              <p className="break-words text-sm"><strong>Name:</strong> {dashboardData.dashboard.name}</p>
              {dashboardData.dashboard.description && (
                <p className="break-words text-sm"><strong>Description:</strong> {dashboardData.dashboard.description}</p>
              )}
            </div>
          </div>
        );
      }

      case 'sql_result': {
        const sqlData = component.data as SQLResultComponentData;
        return (
          <div className="border rounded-lg p-4 bg-gray-50 mt-3 w-full overflow-hidden">
            <div className="flex justify-between items-center mb-3 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Play className="w-4 h-4 flex-shrink-0" />
                <h4 className="font-medium truncate">Query Results</h4>
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {sqlData.result.length} rows
                </Badge>
                {sqlData.executionTime && (
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {Math.round(sqlData.executionTime)}ms
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    const widget: Widget = {
                      id: `widget-${Date.now()}`,
                      type: 'table',
                      title: 'Query Results',
                      position: { x: 0, y: 0 },
                      size: { width: 600, height: 400 },
                      config: { query: sqlData.query, pageSize: 10 }
                    };
                    onComponentAction('add_to_dashboard', component.id, { widget });
                  }}
                  className="whitespace-nowrap"
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Widget
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onComponentAction('export_csv', component.id, sqlData)}
                  className="whitespace-nowrap"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
            <div className="mb-3 p-3 bg-gray-900 text-green-400 rounded text-sm font-mono overflow-auto">
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-3 h-3 flex-shrink-0" />
                <span className="text-xs font-sans">SQL Query</span>
              </div>
              <pre className="text-xs whitespace-pre-wrap break-all">
                {sqlData.query}
              </pre>
            </div>
            <div className="bg-white rounded border overflow-auto" style={{ maxHeight: '300px', maxWidth: '100%' }}>
              {sqlData.result.length > 0 ? (
                <table className="w-full text-sm min-w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      {Object.keys(sqlData.result[0]).map(key => (
                        <th key={key} className="px-3 py-2 text-left font-medium border-b whitespace-nowrap">{key}</th>
                      ))}  
                    </tr>
                  </thead>
                  <tbody>
                    {sqlData.result.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {Object.values(row).map((v, idx) => (
                          <td key={idx} className="px-3 py-2 border-b whitespace-nowrap">{typeof v === 'number' ? v.toLocaleString() : String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-center text-gray-500">No results found</div>
              )}
            </div>
          </div>
        );
      }

      case 'upload_prompt': {
        const uploadData = component.data as UploadPromptComponentData;
        return (
          <div className="border rounded-lg p-4 bg-gray-50 mt-3 w-full max-w-sm mx-auto overflow-hidden">
            <div className="text-center space-y-3">
              <Upload className="w-10 h-10 mx-auto text-gray-400" />
              <div>
                <h4 className="font-medium mb-2 text-sm truncate">Upload CSV File</h4>
                <p className="text-xs text-gray-600 break-words">{uploadData.message}</p>
              </div>
              <Button 
                onClick={() => onComponentAction('upload_csv', component.id)}
                className="gap-2 text-xs h-8 px-3 w-full"
                size="sm"
              >
                <Upload className="w-3 h-3" />
                Choose CSV File
              </Button>
              <p className="text-xs text-gray-500 break-words">
                Accepted formats: {uploadData.acceptedTypes.join(', ')}
              </p>
            </div>
          </div>
        );
      }

      case 'error': {
        const errorData = component.data as ErrorComponentData;
        return (
          <div className="border rounded-lg p-4 bg-red-50 border-red-200 mt-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-red-800 mb-1">Error</h4>
                <p className="text-sm text-red-700 mb-3">{errorData.error}</p>
                {errorData.code && (
                  <Badge variant="destructive" className="text-xs mb-3">
                    {errorData.code}
                  </Badge>
                )}
                {errorData.suggestions && errorData.suggestions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-red-800">Suggestions:</p>
                    <ul className="text-xs text-red-700 space-y-1">
                      {errorData.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-red-400">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'tool_call': {   
        const toolCallData = component.data as { name: string; args: any };
        return (
          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200 mt-3">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm text-blue-800">Tool Call: {toolCallData.name}</h4>
            </div>
            <div className="bg-gray-900 text-blue-200 rounded p-3 text-sm font-mono">
              <pre className="text-xs whitespace-pre-wrap break-all">
                {JSON.stringify(toolCallData.args, null, 2)}
              </pre>
            </div>
          </div>
        );
    }

    case 'tool_result':
      const toolResultData = component.data as { name: string; result: any };
      // Ensure the component's collapsed state is initialized to true
      const isCollapsed = collapsedToolResults[component.id] ?? true;
    
      return (
        <div 
          className="border rounded-lg p-4 bg-gray-50 mt-3 cursor-pointer select-none"
          onClick={() => {
            setCollapsedToolResults(prev => {
              // Initialize to true if undefined, then toggle
              const currentState = prev[component.id] ?? true;
              return {
                ...prev,
                [component.id]: !currentState
              };
            });
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <h4 className="text-sm">Tool Result: {toolResultData.name}</h4>
            <span className="ml-auto text-sm text-gray-500">
              {isCollapsed ? 'Show' : 'Hide'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="bg-white rounded border p-3 text-sm whitespace-pre-wrap break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  pre: ({ node, ...props }) => (
                    <pre
                      {...props}
                      className="whitespace-pre-wrap break-all p-2 bg-gray-900 text-blue-200 rounded"
                    />
                  ),
                  table: ({ node, ...props }) => (
                    <div className="my-4">
                      <ScrollArea className="w-full custom-scrollbar">
                        <div className="min-w-[200px]">
                          <Table {...props} />
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    </div>
                  ),
                  thead: ({ node, ...props }) => <TableHeader {...props} />,
                  tbody: ({ node, ...props }) => <TableBody {...props} />,
                  tr: ({ node, ...props }) => <TableRow {...props} />,
                  th: ({ node, ...props }) => (
                    <TableHead className="min-w-[50px] max-w-[300px] break-words font-semibold text-gray-900 p-4" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <TableCell className="min-w-[50px] max-w-[300px] break-words font-mono text-xs text-gray-700 p-4" {...props} />
                  ),
                  h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mb-3" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mb-2" {...props} />,
                  h4: ({ node, ...props }) => <h4 className="text-base font-semibold mb-2" {...props} />,
                  h5: ({ node, ...props }) => <h5 className="text-sm font-semibold mb-1" {...props} />,
                  h6: ({ node, ...props }) => <h6 className="text-sm font-medium mb-1" {...props} />,
                  p: ({ node, ...props }) => <p className="text-sm leading-relaxed break-words mb-2" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-6 text-sm leading-relaxed mb-2" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-6 text-sm leading-relaxed mb-2" {...props} />,
                  li: ({ node, ...props }) => <li className="ml-4 text-sm leading-relaxed mb-1">{props.children}</li>,
                  code: ({ node, inline, className, children, ...props }) => {
                    // inline code vs code-block
                    if (inline) {
                      return (
                        <code
                               {...props}
                               className="bg-gray-600 text-white px-1 rounded break-all whitespace-pre-wrap text-xs"
                               >
                               {children}
                             </code>
                           );
                    }
                    // code-block (inside our <pre> override)
                    return (
                      <code {...props} className="block text-xs whitespace-pre-wrap break-all">
                        {children}
                      </code>
                    );
                  },
                  strong: ({ node, ...props }) => <strong className="font-semibold text-sm" {...props} />,
                  em: ({ node, ...props }) => <em className="italic text-sm" {...props} />,
                }}
              >
                {toolResultData.result}
              </ReactMarkdown>
            </div>
          )}
        </div>
      ); 
      default:
        return null;
    }
  } catch (error) {
    console.error('Error rendering component:', error);
    return (
      <div className="border rounded-lg p-4 bg-red-50 border-red-200 mt-3">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Error rendering component</span>
        </div>
      </div>
    );
  }
}

export default React.memo(
  AIComponentRenderer,
  (prev, next) => 
    prev.component.id === next.component.id &&
    JSON.stringify(prev.component.data) === JSON.stringify(next.component.data) &&
    prev.collapsedToolResults[prev.component.id] === next.collapsedToolResults[next.component.id]
); 