import React, { useState, useEffect } from 'react';
import { useDataStore } from '@/store/dataStore';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Play, 
  Save, 
  Database, 
  Table, 
  Eye,
  Plus,
  FileText,
  Download,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export function SQLEditor() {
  const { 
    currentQuery, 
    queryResult, 
    isQueryLoading,
    tables,
    views,
    setCurrentQuery,
    executeQuery,
    saveView,
    getTableSchema,
    getTableData
  } = useDataStore();

  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableSchema, setTableSchema] = useState<Array<{name: string, type: string}>>([]);
  const [viewName, setViewName] = useState('');
  const [showSaveView, setShowSaveView] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tablesExpanded, setTablesExpanded] = useState(true);
  const [viewsExpanded, setViewsExpanded] = useState(true);

  useEffect(() => {
    if (selectedTable) {
      loadTableSchema(selectedTable);
    }
  }, [selectedTable]);

  const loadTableSchema = async (tableName: string) => {
    try {
      const schema = await getTableSchema(tableName);
      setTableSchema(schema);
    } catch (error) {
      console.error('Failed to load table schema:', error);
    }
  };

  const handleExecuteQuery = async () => {
    if (!currentQuery.trim()) {
      toast.error('Please enter a SQL query');
      return;
    }

    try {
      await executeQuery(currentQuery);
      toast.success('Query executed successfully');
    } catch (error) {
      toast.error(`Query failed: ${error.message}`);
    }
  };

  const handleSaveView = async () => {
    if (!viewName.trim()) {
      toast.error('Please enter a view name');
      return;
    }

    if (!currentQuery.trim()) {
      toast.error('Please enter a SQL query');
      return;
    }

    try {
      await saveView(viewName, currentQuery);
      toast.success('View saved successfully');
      setViewName('');
      setShowSaveView(false);
    } catch (error) {
      toast.error(`Failed to save view: ${error.message}`);
    }
  };

  const insertTableName = (tableName: string) => {
    const newQuery = currentQuery + (currentQuery ? ' ' : '') + `"${tableName}"`;
    setCurrentQuery(newQuery);
  };

  const loadSampleQuery = (tableName: string) => {
    setCurrentQuery(`SELECT * FROM "${tableName}" LIMIT 10;`);
  };

  const exportResults = () => {
    if (queryResult.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csv = [
      Object.keys(queryResult[0]).join(','),
      ...queryResult.map(row => 
        Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Collapsible Sidebar */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-12'} flex-shrink-0`}>
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-sm flex items-center transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                <Database className="w-4 h-4 mr-2" />
                Database Schema
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="h-8 w-8 p-0"
              >
                {sidebarOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          
          {sidebarOpen && (
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="p-4 space-y-4">
                  {/* Tables */}
                  <Collapsible open={tablesExpanded} onOpenChange={setTablesExpanded}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded">
                      <div className="text-xs font-medium text-gray-700 flex items-center">
                        <Table className="w-3 h-3 mr-1" />
                        Tables ({tables.length})
                      </div>
                      {tablesExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 mt-2">
                      {tables.map((table) => (
                        <div key={table.id} className="group">
                          <div 
                            className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer hover:bg-gray-100 ${
                              selectedTable === table.name ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                            }`}
                            onClick={() => setSelectedTable(table.name)}
                          >
                            <span className="font-medium">{table.name}</span>
                            <Badge variant="outline" className="text-xs py-0 px-1">
                              {table.rowCount}
                            </Badge>
                          </div>
                          <div className="ml-4 space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs w-full justify-start"
                              onClick={() => insertTableName(table.name)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Insert
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs w-full justify-start"
                              onClick={() => loadSampleQuery(table.name)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Preview
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Views */}
                  {views.length > 0 && (
                    <>
                      <Separator />
                      <Collapsible open={viewsExpanded} onOpenChange={setViewsExpanded}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded">
                          <div className="text-xs font-medium text-gray-700 flex items-center">
                            <FileText className="w-3 h-3 mr-1" />
                            Views ({views.length})
                          </div>
                          {viewsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-1 mt-2">
                          {views.map((view) => (
                            <div key={view.id} className="group">
                              <div 
                                className="flex items-center justify-between p-2 rounded text-xs cursor-pointer hover:bg-gray-100 text-gray-600"
                                onClick={() => setCurrentQuery(view.query)}
                              >
                                <span className="font-medium">{view.name}</span>
                              </div>
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    </>
                  )}

                  {/* Schema for selected table */}
                  {selectedTable && tableSchema.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-2">
                          Schema: {selectedTable}
                        </div>
                        <div className="space-y-1">
                          {tableSchema.map((column, index) => (
                            <div key={index} className="flex justify-between items-center p-1 text-xs">
                              <span className="font-medium text-gray-600">{column.name}</span>
                              <Badge variant="secondary" className="text-xs py-0 px-1">
                                {column.type}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Main Content - SQL Editor & Results */}
      <div className="flex-1 space-y-4 min-w-0">
        {/* SQL Editor */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">SQL Editor</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveView(true)}
                  disabled={!currentQuery.trim()}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save as View
                </Button>
                <Button
                  onClick={handleExecuteQuery}
                  disabled={!currentQuery.trim() || isQueryLoading}
                  size="sm"
                >
                  <Play className="w-4 h-4 mr-1" />
                  {isQueryLoading ? 'Executing...' : 'Execute'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-48 border-t">
              <Editor
                height="192px"
                defaultLanguage="sql"
                value={currentQuery}
                onChange={(value) => setCurrentQuery(value || '')}
                theme="vs"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on'
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save View Dialog */}
        {showSaveView && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-900">Save as View</div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Input
                      placeholder="Enter view name..."
                      value={viewName}
                      onChange={(e) => setViewName(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleSaveView}>
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowSaveView(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Query Results */}
        <Card className="flex-1 min-h-0">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Query Results
                {queryResult.length > 0 && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {queryResult.length} rows
                  </Badge>
                )}
              </CardTitle>
              {queryResult.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportResults}>
                  <Download className="w-4 h-4 mr-1" />
                  Export CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0">
            {queryResult.length > 0 ? (
              <div className="border-t h-full">
                <ScrollArea className="h-full">
                  <div className="min-w-max">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-50 z-10">
                        <tr className="border-b">
                          {Object.keys(queryResult[0]).map((col, index) => (
                            <th key={index} className="text-left p-3 font-medium text-gray-900 min-w-[120px] whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b hover:bg-gray-50">
                            {Object.values(row).map((value, colIndex) => (
                              <td key={colIndex} className="p-3 text-gray-600 min-w-[120px] whitespace-nowrap">
                                <div className="max-w-[200px] truncate" title={String(value || '')}>
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
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">Execute a query to see results</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}