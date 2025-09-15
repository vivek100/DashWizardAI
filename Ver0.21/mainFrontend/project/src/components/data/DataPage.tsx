import React, { useState, useEffect } from 'react';
import { useDataStore } from '@/store/dataStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CSVUploadDialog } from './CSVUploadDialog';
import { SQLEditor } from './SQLEditor';
import { 
  Upload, 
  Database, 
  FileText, 
  Calendar,
  Trash2,
  Eye,
  RefreshCw,
  Code,
  X,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function DataPage({ isModal = false }) {
  const { 
    tables,
    views,
    removeDataSource,
    removeView,
    initialize,
    setCurrentQuery,
    getTableData,
    executeQuery
  } = useDataStore();
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [replaceTable, setReplaceTable] = useState<{ id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState('data');
  const [viewDataDialog, setViewDataDialog] = useState<{ open: boolean; data: any[]; title: string }>({
    open: false,
    data: [],
    title: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    initialize();
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768 || isModal);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [initialize, isModal]);

  // Calculate grid columns based on screen size
  const getGridCols = () => {
    if (isSmallScreen) return 'grid-cols-1';
    if (window.innerWidth < 1024) return 'grid-cols-2';
    if (window.innerWidth < 1280) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  const filteredTables = tables.filter(t => 
    t.type === 'csv' && 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredViews = views.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemoveTable = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the table "${name}"? This action cannot be undone.`)) {
      try {
        await removeDataSource(id);
        toast.success('Table deleted successfully');
      } catch (error) {
        toast.error(`Failed to delete table: ${error.message}`);
      }
    }
  };

  const handleRemoveView = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the view "${name}"?`)) {
      try {
        await removeView(id);
        toast.success('View deleted successfully');
      } catch (error) {
        toast.error(`Failed to delete view: ${error.message}`);
      }
    }
  };

  const handleReplaceData = (table: { id: string; name: string }) => {
    setReplaceTable(table);
    setUploadDialogOpen(true);
  };

  const handleEditView = (view: { id: string; name: string; query: string }) => {
    setCurrentQuery(view.query);
    setActiveTab('editor');
  };

  const handleViewTableData = async (tableName: string) => {
    try {
      const data = await getTableData(tableName, 100);
      setViewDataDialog({
        open: true,
        data,
        title: `Table: ${tableName}`
      });
    } catch (error) {
      toast.error(`Failed to load table data: ${error.message}`);
    }
  };

  const handleViewQueryData = async (viewName: string, query: string) => {
    try {
      const data = await executeQuery(query);
      setViewDataDialog({
        open: true,
        data,
        title: `View: ${viewName}`
      });
    } catch (error) {
      toast.error(`Failed to execute view query: ${error.message}`);
    }
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setReplaceTable(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Sources</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your data tables, views, and run SQL queries
          </p>
        </div>
        <Button 
          onClick={() => setUploadDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload CSV
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid ${isSmallScreen ? 'grid-cols-1' : 'grid-cols-2'} ${isSmallScreen ? 'w-full' : ''}`}>
          <TabsTrigger value="data">Data Sources</TabsTrigger>
          <TabsTrigger value="editor">SQL Editor</TabsTrigger>
        </TabsList>

        {/* Data Sources Tab */}
        <TabsContent value="data" className="space-y-6">
          <ScrollArea className="h-[calc(100vh-200px)]"> {/* Tab-level scroll */}
            {/* Search Bar */}
            <div className="relative sticky top-0 bg-white z-10 px-1 pb-4">
              <div className="relative h-10">      {/* fixed height */}
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"
                />
                <Input
                  type="text"
                  placeholder="Search tables and views..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 h-full"  
                />
              </div>
            </div>



            {/* CSV Tables */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">CSV Tables</h3>
                <Badge variant="outline" className="text-xs">
                  {filteredTables.length} tables
                </Badge>
              </div>
              
              {filteredTables.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Database className="w-8 h-8 text-gray-400" />
                    </div>
                    <CardTitle className="text-lg mb-2">
                      {searchQuery ? 'No matching tables found' : 'No CSV tables found'}
                    </CardTitle>
                    <CardDescription className="mb-4">
                      {searchQuery 
                        ? 'Try adjusting your search term'
                        : 'Upload a CSV file to create your first data table'
                      }
                    </CardDescription>
                    {!searchQuery && (
                      <Button onClick={() => setUploadDialogOpen(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload CSV
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className={`grid gap-4 ${getGridCols()}`}>
                  {filteredTables.map((table) => (
                    <Card key={table.id} className="hover:shadow-md transition-shadow flex flex-col">
                      <CardHeader className="pb-2">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Database className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base break-words line-clamp-2">
                              {table.name}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {table.rowCount.toLocaleString()} rows • {table.columns.length} columns
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-between pt-2">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              CSV
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewTableData(table.name)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleReplaceData(table)}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveTable(table.id, table.name)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-2">Columns</div>
                            <div className="flex flex-wrap gap-1">
                              {table.columns.slice(0, 8).map((column) => (
                                <Badge key={column} variant="secondary" className="text-xs py-1 px-2">
                                  {column}
                                </Badge>
                              ))}
                              {table.columns.length > 8 && (
                                <Badge variant="secondary" className="text-xs py-1 px-2">
                                  +{table.columns.length - 8} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Updated {format(table.updatedAt, 'MMM d, yyyy')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* SQL Views */}
            {filteredViews.length > 0 && (
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">SQL Views</h3>
                  <Badge variant="outline" className="text-xs">
                    {filteredViews.length} views
                  </Badge>
                </div>
                
                <div className={`grid gap-4 ${getGridCols()}`}>
                  {filteredViews.map((view) => (
                    <Card key={view.id} className="hover:shadow-md transition-shadow flex flex-col">
                      <CardHeader className="pb-2">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base break-words line-clamp-2">
                              {view.name}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              SQL View
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-between pt-2">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              VIEW
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewQueryData(view.name, view.query)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditView(view)}
                              >
                                <Code className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveView(view.id, view.name)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs font-mono bg-gray-50 p-3 rounded border text-gray-600">
                            {view.query.length > 150 
                              ? `${view.query.substring(0, 150)}...` 
                              : view.query
                            }
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Created {format(view.createdAt, 'MMM d, yyyy')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* SQL Editor Tab */}
        <TabsContent value="editor">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <SQLEditor />
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* CSV Upload Dialog */}
      <CSVUploadDialog 
        open={uploadDialogOpen}
        onOpenChange={handleCloseUploadDialog}
        existingTable={replaceTable}
      />

      {/* Data View Dialog */}
      <Dialog open={viewDataDialog.open} onOpenChange={(open) => setViewDataDialog(prev => ({ ...prev, open }))}>
        <DialogContent className={`max-w-6xl h-[80vh] flex flex-col ${isSmallScreen ? 'p-2' : ''}`}>
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  {viewDataDialog.title}
                </DialogTitle>
                <DialogDescription>
                  {viewDataDialog.data.length} rows
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewDataDialog(prev => ({ ...prev, open: false }))}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden border-t">
            {viewDataDialog.data.length > 0 ? (
              <ScrollArea className="h-full">
                <div className="min-w-max">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gray-50 z-10">
                      <TableRow className="border-b">
                        {Object.keys(viewDataDialog.data[0]).map((col, index) => (
                          <TableHead key={index} className="text-left p-4 font-semibold text-gray-900 min-w-[150px] max-w-[300px] bg-gray-50">
                            <div className="flex items-start space-x-2">
                              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                                {index + 1}
                              </span>
                              <span className="break-words leading-relaxed">{col}</span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewDataDialog.data.map((row, rowIndex) => (
                        <TableRow key={rowIndex} className="border-b hover:bg-gray-50 transition-colors">
                          {Object.values(row).map((value, colIndex) => (
                            <TableCell key={colIndex} className="p-4 text-gray-700 min-w-[150px] max-w-[300px]">
                              <div className="break-words leading-relaxed font-mono text-xs" title={String(value || '')}>
                                {String(value || '')}
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No data available</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}