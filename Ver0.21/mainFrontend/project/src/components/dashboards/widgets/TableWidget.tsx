import React, { useState, useEffect } from 'react';
import { useDataStore } from '@/store/dataStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Hash
} from 'lucide-react';
import { Widget } from '@/types';
import { cn } from '@/lib/utils';

interface TableWidgetProps {
  widget: Widget;
}

export function TableWidget({ widget }: TableWidgetProps) {
  const { executeQuery } = useDataStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = widget.config.pageSize || 10;
  const sortable = widget.config.sortable !== false;
  const searchable = widget.config.searchable !== false;
  const exportable = widget.config.exportable !== false;
  const showRowNumbers = widget.config.showRowNumbers || false;
  const alternateRowColors = widget.config.alternateRowColors !== false;

  useEffect(() => {
    loadData();
  }, [widget.config.query, widget.config.dataSource, widget.config]);

  const loadData = async () => {
    if (!widget.config.query && !widget.config.dataSource) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = widget.config.query;
      if (!query && widget.config.dataSource) {
        query = `SELECT * FROM "${widget.config.dataSource}" LIMIT 1000`;
      }

      if (query) {
        const result = await executeQuery(query);
        setData(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (!sortable) return;
    
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedAndFilteredData = () => {
    let filteredData = data;

    // Apply search filter
    if (searchTerm && searchable) {
      filteredData = data.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortColumn && sortable) {
      filteredData = [...filteredData].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filteredData;
  };

  const getPaginatedData = () => {
    const filteredData = getSortedAndFilteredData();
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  };

  const getTotalPages = () => {
    return Math.ceil(getSortedAndFilteredData().length / pageSize);
  };

  const exportData = () => {
    if (!exportable) return;
    
    const csvContent = [
      Object.keys(data[0] || {}).join(','),
      ...getSortedAndFilteredData().map(row =>
        Object.values(row).map(val =>
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${widget.title.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p className="text-sm font-medium">Error loading data</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-sm">No data available</p>
          <p className="text-xs">Configure a data source to display table data</p>
        </div>
      </div>
    );
  }

  const columns = Object.keys(data[0] || {});
  const paginatedData = getPaginatedData();
  const totalPages = getTotalPages();
  const filteredCount = getSortedAndFilteredData().length;

  const containerStyle = {
    backgroundColor: widget.config.backgroundColor || '#ffffff',
    color: widget.config.textColor || '#000000',
    borderRadius: `${widget.config.borderRadius || 8}px`,
    padding: `${widget.config.padding || 16}px`
  };

  return (
    <div className="h-full" style={containerStyle}>
      <div className="h-full flex flex-col widget-content">
        {/* Header with search and export */}
        <div className="flex items-center justify-between p-3 border-b flex-shrink-0">
          <div className="flex items-center space-x-2">
            {searchable && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8 h-8 w-48 text-sm"
                />
              </div>
            )}
            <Badge variant="outline" className="text-xs">
              {filteredCount} {filteredCount === 1 ? 'row' : 'rows'}
            </Badge>
          </div>
          
          {exportable && (
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full noWheel">
            <Table className="relative">
              <TableHeader className="sticky top-0 z-10 bg-background border-b">
                <TableRow>
                  {showRowNumbers && (
                    <TableHead className="text-left p-4 font-semibold text-gray-900 min-w-[150px] max-w-[300px] bg-background">
                      <div className="flex items-start space-x-2">
                        <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                          <Hash className="w-3 h-3" />
                        </span>
                        <span className="break-words leading-relaxed">Row</span>
                      </div>
                    </TableHead>
                  )}
                  {columns.map((column, index) => (
                    <TableHead
                      key={column}
                      className={cn(
                        "text-left p-4 font-semibold text-gray-900 min-w-[150px] max-w-[300px] bg-background",
                        sortable && "cursor-pointer hover:bg-muted/50 transition-colors"
                      )}
                      onClick={() => sortable && handleSort(column)}
                    >
                      <div className="flex items-start space-x-2">
                        <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="break-words leading-relaxed">{column}</span>
                        {sortable && (
                          <>
                            {sortColumn === column ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="w-3 h-3" />
                              ) : (
                                <ArrowDown className="w-3 h-3" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-50" />
                            )}
                          </>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
                <TableBody>
                  {paginatedData.map((row, rowIndex) => (
                    <TableRow 
                      key={rowIndex} 
                      className={cn(
                        "border-b hover:bg-gray-50 transition-colors",
                        alternateRowColors && rowIndex % 2 === 1 && "bg-gray-25"
                      )}
                    >
                      {showRowNumbers && (
                        <TableCell className="p-4 text-gray-700 min-w-[150px] max-w-[300px]">
                          <div className="break-words leading-relaxed font-mono text-xs" title={String((currentPage - 1) * pageSize + rowIndex + 1)}>
                            {(currentPage - 1) * pageSize + rowIndex + 1}
                          </div>
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell 
                          key={column} 
                          className="p-4 text-gray-700 min-w-[150px] max-w-[300px]"
                        >
                          <div className="break-words leading-relaxed font-mono text-xs" title={String(row[column] || '')}>
                            {formatCellValue(row[column])}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t flex-shrink-0">
            <div className="text-xs text-gray-600">
              Page {currentPage} of {totalPages}
              {filteredCount !== data.length && (
                <span className="ml-2">({filteredCount} filtered from {data.length})</span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}