import React, { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Database, 
  Eye, 
  Info,
  Table,
  FileText,
  Play
} from 'lucide-react';
import { Widget } from '@/types';
import { toast } from 'sonner';

interface DataSourceTabProps {
  widget: Widget;
  onUpdate: (updates: Partial<Widget>) => void;
}

export function DataSourceTab({ widget, onUpdate }: DataSourceTabProps) {
  const { tables, views, executeQuery } = useDataStore();
  const [customQuery, setCustomQuery] = useState(widget.config.query || '');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handlePreview = async () => {
    if (!customQuery.trim()) {
      toast.error('Please enter a query to preview');
      return;
    }

    setIsLoadingPreview(true);
    try {
      const data = await executeQuery(customQuery);
      setPreviewData(data.slice(0, 10)); // Show first 10 rows
      toast.success(`Preview loaded: ${data.length} rows`);
    } catch (error) {
      toast.error(`Preview failed: ${error.message}`);
      setPreviewData([]);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const loadTableQuery = (tableName: string) => {
    const newQuery = `SELECT * FROM "${tableName}" LIMIT 100;`;
    setCustomQuery(newQuery);
    onUpdate({
      config: {
        ...widget.config,
        dataSource: tableName,
        query: newQuery
      }
    });
  };

  const loadViewQuery = (viewName: string, query: string) => {
    setCustomQuery(query);
    onUpdate({
      config: {
        ...widget.config,
        dataSource: viewName,
        query: query
      }
    });
  };

  const handleQueryChange = (query: string) => {
    setCustomQuery(query);
    onUpdate({
      config: {
        ...widget.config,
        query: query
      }
    });
  };

  const getTableSchema = (tableName: string) => {
    const table = tables.find(t => t.name === tableName);
    return table ? table.columns : [];
  };

  return (
    <div className="space-y-4">
      {/* Data Sources */}
      <div>
        <Label className="text-sm font-medium">Data Sources</Label>
        <div className="mt-2 space-y-3">
          {/* Tables */}
          <div>
            <div className="text-xs font-medium text-gray-700 mb-2 flex items-center">
              <Table className="w-3 h-3 mr-1" />
              Tables ({tables.length})
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {tables.map((table) => (
                <TooltipProvider key={table.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => loadTableQuery(table.name)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{table.name}</div>
                          <div className="text-xs text-gray-500">
                            {table.rowCount.toLocaleString()} rows • {table.columns.length} columns
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs ml-2">
                          {table.type.toUpperCase()}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <div className="space-y-2">
                        <div className="font-medium">{table.name}</div>
                        <div className="text-xs text-gray-600">
                          <div className="font-medium mb-1">Columns:</div>
                          <div className="grid grid-cols-2 gap-1">
                            {getTableSchema(table.name).slice(0, 8).map((col, idx) => (
                              <div key={idx} className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                                {col}
                              </div>
                            ))}
                            {getTableSchema(table.name).length > 8 && (
                              <div className="text-xs text-gray-500">
                                +{getTableSchema(table.name).length - 8} more
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>

          {/* Views */}
          {views.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                <FileText className="w-3 h-3 mr-1" />
                Views ({views.length})
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {views.map((view) => (
                  <TooltipProvider key={view.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="flex items-center justify-between p-2 bg-gray-50 rounded border cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => loadViewQuery(view.name, view.query)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{view.name}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {view.description || 'SQL View'}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs ml-2">
                            VIEW
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-md">
                        <div className="space-y-2">
                          <div className="font-medium">{view.name}</div>
                          <div className="text-xs text-gray-600">
                            <div className="font-medium mb-1">Query:</div>
                            <div className="bg-gray-100 p-2 rounded font-mono text-xs">
                              {view.query.length > 100 
                                ? `${view.query.substring(0, 100)}...` 
                                : view.query
                              }
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom SQL Query */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="query" className="text-sm font-medium">Custom SQL Query</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={isLoadingPreview || !customQuery.trim()}
          >
            {isLoadingPreview ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            <span className="ml-1">Preview</span>
          </Button>
        </div>
        <Textarea
          id="query"
          value={customQuery}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="SELECT * FROM your_table LIMIT 100;"
          className="font-mono text-sm"
          rows={6}
        />
        <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
          <Info className="w-3 h-3" />
          <span>Use double quotes for table/column names with spaces or special characters</span>
        </div>
      </div>

      {/* Preview Results */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Data Preview ({previewData.length} rows)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-48">
              <div className="min-w-max">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {Object.keys(previewData[0] || {}).map((col) => (
                        <th key={col} className="text-left p-2 font-medium text-gray-700 border-b min-w-[100px]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        {Object.values(row).map((value, colIndex) => (
                          <td key={colIndex} className="p-2 text-gray-600 min-w-[100px]">
                            <div className="truncate max-w-[150px]" title={String(value || '')}>
                              {String(value || '')}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}