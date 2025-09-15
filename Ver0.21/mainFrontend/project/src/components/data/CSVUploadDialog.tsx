import React, { useState, useCallback } from 'react';
import { useDataStore } from '@/store/dataStore';
import { backendAPI } from '@/lib/backendAPI';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, Database, AlertCircle, CheckCircle, Info, FileSpreadsheet, CloudUpload, Settings } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';

interface CSVUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTable?: { id: string; name: string } | null;
  onSuccess?: (tableName: string, rowCount: number) => void;
}

export function CSVUploadDialog({ open, onOpenChange, existingTable, onSuccess }: CSVUploadDialogProps) {
  const { addDataSource, updateDataSource, uploadCSVToBackend, backendConnected } = useDataStore();
  const [file, setFile] = useState<File | null>(null);
  const [tableName, setTableName] = useState(existingTable?.name || '');
  const [description, setDescription] = useState('');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<'upload' | 'configure'>('upload');
  const [useBackend, setUseBackend] = useState(true);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      preview: 10, // Preview first 10 rows
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error(`CSV parsing error: ${results.errors[0].message}`);
          setIsProcessing(false);
          return;
        }

        const data = results.data as Record<string, any>[];
        const cols = Object.keys(data[0] || {});
        
        setCsvData(data);
        setColumns(cols);
        setStep('configure');
        setIsProcessing(false);

        if (!tableName && !existingTable) {
          const fileName = selectedFile.name.replace('.csv', '').replace(/[^a-zA-Z0-9_]/g, '_');
          setTableName(fileName);
        }
      },
      error: (error) => {
        toast.error(`Failed to parse CSV: ${error.message}`);
        setIsProcessing(false);
      }
    });
  }, [tableName, existingTable]);

  const handleSave = async () => {
    if (!file || !tableName.trim()) {
      toast.error('Please provide a table name');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      if (useBackend && backendConnected) {
        // Upload to backend
        await uploadCSVToBackend(file, tableName);
        setUploadProgress(100);
        toast.success('CSV uploaded to backend successfully');
      } else {
        // Use local storage
        const fileContent = await file.text();
        
        if (existingTable) {
          await updateDataSource(existingTable.id, {
            name: tableName,
            csvContent: fileContent,
            columns,
            rowCount: csvData.length
          });
          toast.success('Data source updated successfully');
        } else {
          await addDataSource({
            name: tableName,
            type: 'csv',
            csvContent: fileContent,
            columns,
            rowCount: csvData.length
          });
          toast.success('Data source created successfully');
        }
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(tableName, csvData.length);
      }

      onOpenChange(false);
      resetDialog();
    } catch (error) {
      toast.error(`Failed to save data source: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setTableName(existingTable?.name || '');
    setDescription('');
    setCsvData([]);
    setColumns([]);
    setStep('upload');
    setIsProcessing(false);
    setUploadProgress(0);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetDialog();
  };

  const inferColumnType = (value: any): string => {
    if (value === null || value === undefined || value === '') return 'TEXT';
    
    const str = String(value).trim();
    if (!isNaN(Number(str)) && str !== '') {
      return str.includes('.') ? 'REAL' : 'INTEGER';
    }
    
    const date = new Date(str);
    if (!isNaN(date.getTime()) && str.match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/)) {
      return 'DATE';
    }
    
    return 'TEXT';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center text-2xl">
            <CloudUpload className="w-6 h-6 mr-3 text-blue-600" />
            {existingTable ? 'Replace Data Source' : 'Upload CSV Data'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {existingTable 
              ? 'Upload a new CSV file to replace the existing data in the backend database'
              : 'Upload a CSV file to create a new data source in the backend database'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 'upload' && (
            <div className="h-full flex items-center justify-center p-8">
              <div className="w-full max-w-2xl space-y-8">
                {/* Backend Connection Status */}
                <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${backendConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium">Backend Connection</span>
                      </div>
                      <Badge variant={backendConnected ? "default" : "destructive"}>
                        {backendConnected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {backendConnected 
                        ? "Your CSV will be uploaded to the backend DuckDB database"
                        : "Backend not available. Data will be stored locally only."
                      }
                    </p>
                  </CardContent>
                </Card>

                {/* Upload Area */}
                <div className="relative">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center hover:border-blue-400 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-gray-50 to-white">
                    <div className="space-y-6">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-10 h-10 text-blue-600" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-semibold text-gray-900">Drop your CSV file here</h3>
                        <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
                          or click to browse. Supports CSV files up to 10MB. 
                          The first row should contain column headers.
                        </p>
                      </div>
                      <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-1" />
                          CSV Format
                        </div>
                        <div className="flex items-center">
                          <Database className="w-4 h-4 mr-1" />
                          Auto Analysis
                        </div>
                      </div>
                    </div>
                    
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      disabled={isProcessing}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {isProcessing && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-blue-800 font-medium">Processing file...</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {step === 'configure' && (
          <ScrollArea className="h-full">
            <div className=" flex flex-col space-y-6">
              {/* Success indicator and configuration */}
              <div className="flex-shrink-0 space-y-6">
                {/* Success Banner */}
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800 text-lg">File processed successfully!</h3>
                      <p className="text-green-600">{file?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">
                      {csvData.length.toLocaleString()} rows
                    </Badge>
                    <div className="text-sm text-green-600 mt-1">
                      {columns.length} columns
                    </div>
                  </div>
                </div>

                {/* Configuration Form */}
                <Card className="border-2 border-blue-100 bg-blue-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Settings className="w-5 h-5 mr-2 text-blue-600" />
                      Table Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="tableName" className="text-sm font-medium text-gray-700">
                          Table Name *
                        </Label>
                        <Input
                          id="tableName"
                          value={tableName}
                          onChange={(e) => setTableName(e.target.value)}
                          placeholder="Enter a descriptive table name"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500">
                          Use lowercase letters, numbers, and underscores only
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          File Information
                        </Label>
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Size:</span>
                            <span className="font-medium">{file ? `${(file.size / 1024).toFixed(1)} KB` : 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-gray-600">Format:</span>
                            <span className="font-medium">CSV</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                        Description (Optional)
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what this data contains, its source, or any important notes..."
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        rows={3}
                      />
                      <p className="text-xs text-gray-500">
                        This helps with data documentation and discovery
                      </p>
                    </div>

                    {/* Upload Progress */}
                    {isProcessing && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700">Uploading to backend...</span>
                          <span className="text-blue-600">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Tabs for detailed view */}
              <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="schema" className="h-full flex flex-col">
                  <TabsList className="flex-shrink-0 grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger value="schema" className="flex items-center data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Schema Analysis
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Data Preview
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="schema" className="flex-1 mt-6">
                    {/* CHANGED: Added flex flex-col to Card */}
                    <Card className="h-full border-2 border-gray-100 flex flex-col">
                      <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardTitle className="flex items-center text-lg">
                          <FileSpreadsheet className="w-5 h-5 mr-2 text-blue-600" />
                          Column Schema Analysis
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          Automatically detected data types and sample values
                        </p>
                      </CardHeader>
                      {/* CHANGED: Added flex-1 and overflow-hidden to CardContent */}
                      <CardContent className="p-0 flex-1 overflow-hidden">
                        {/* CHANGED: Replaced fixed height with h-full */}
                        <ScrollArea className="h-full">
                          <div className="p-6 space-y-4">
                            {columns.map((col, index) => {
                              const sampleValue = csvData.find(row => row[col] !== null && row[col] !== '')?.col;
                              const type = inferColumnType(sampleValue);
                              const sampleData = csvData.slice(0, 5).map(row => row[col]).filter(val => val !== null && val !== '');
                              
                              return (
                                <div key={index} className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                                      </div>
                                      <span className="font-semibold text-gray-900">{col}</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs font-medium">
                                      {type}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    <div className="font-medium mb-2 text-gray-700">Sample values:</div>
                                    <div className="grid grid-cols-1 gap-2">
                                      {sampleData.slice(0, 3).map((val, i) => (
                                        <div key={i} className="bg-gray-50 px-3 py-2 rounded-md border-l-4 border-blue-200 text-gray-700 font-mono text-xs">
                                          {String(val).substring(0, 60)}
                                          {String(val).length > 60 ? '...' : ''}
                                        </div>
                                      ))}
                                      {sampleData.length > 3 && (
                                        <div className="text-xs text-gray-500 italic">
                                          +{sampleData.length - 3} more values
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="preview" className="flex-1 mt-6">
                    {/* CHANGED: Added flex flex-col to Card */}
                    <Card className="h-full border-2 border-gray-100 flex flex-col">
                      <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-emerald-50">
                        <CardTitle className="flex items-center text-lg">
                          <FileText className="w-5 h-5 mr-2 text-green-600" />
                          Data Preview
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          First 10 rows of your data
                        </p>
                      </CardHeader>
                      {/* CHANGED: Added flex-1 and overflow-hidden to CardContent */}
                      <CardContent className="p-0 flex-1 overflow-hidden">
                        {/* CHANGED: Added h-full to the wrapper div */}
                        <div className="h-full border-t">
                          {/* CHANGED: Using ScrollArea with both vertical and horizontal scrollbars */}
                          <ScrollArea className="h-full">
                            <div className="min-w-max">
                              <Table>
                                <TableHeader className="sticky top-0 bg-gray-50 z-10">
                                  <TableRow className="border-b">
                                    {columns.map((col, index) => (
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
                                  {csvData.slice(0, 10).map((row, rowIndex) => (
                                    <TableRow key={rowIndex} className="border-b hover:bg-gray-50 transition-colors">
                                      {columns.map((col, colIndex) => (
                                        <TableCell key={colIndex} className="p-4 text-gray-700 min-w-[150px] max-w-[300px]">
                                          <div className="break-words leading-relaxed font-mono text-xs" title={String(row[col] || '')}>
                                            {String(row[col] || '')}
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
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ScrollArea>
          )}
        </div>

        {/* Footer with actions */}
        <div className="flex-shrink-0 flex justify-between items-center pt-6 border-t border-gray-200 bg-gray-50/50 -mx-6 px-6 pb-6">
          <div className="flex items-center space-x-3">
            {step === 'configure' && (
              <Button 
                variant="outline" 
                onClick={() => setStep('upload')}
                className="border-gray-300 hover:bg-gray-50"
              >
                ← Back to Upload
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            {step === 'configure' && (
              <Button 
                onClick={handleSave}
                disabled={!tableName.trim() || isProcessing}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CloudUpload className="w-4 h-4" />
                    <span>{existingTable ? 'Replace Data' : 'Upload to Database'}</span>
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}