import React, { useState, useEffect } from 'react';
import { useDataStore } from '@/store/dataStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon,
  Filter,
  Settings,
  Target,
  BarChart3,
  Table as TableIcon,
  Type,
  ChevronDown,
  X,
  Link,
  Eye,
  Play
} from 'lucide-react';
import { Widget, Filter as FilterType, ComputedField, VlookupTable } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ConfigurationTabProps {
  widget: Widget;
  onUpdate: (updates: Partial<Widget>) => void;
}

export function ConfigurationTab({ widget, onUpdate }: ConfigurationTabProps) {
  const { tables, executeQuery } = useDataStore();
  const [filters, setFilters] = useState<FilterType[]>(widget.config.filters || []);
  const [computedFields, setComputedFields] = useState<ComputedField[]>(widget.config.computedFields || []);
  const [vlookupTables, setVlookupTables] = useState<VlookupTable[]>(widget.config.vlookupTables || []);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    loadAvailableColumns();
  }, [widget.config.dataSource, widget.config.query]);

  const loadAvailableColumns = async () => {
    try {
      if (widget.config.query) {
        const result = await executeQuery(`${widget.config.query} LIMIT 1`);
        if (result.length > 0) {
          setAvailableColumns(Object.keys(result[0]));
        }
      } else if (widget.config.dataSource) {
        const table = tables.find(t => t.name === widget.config.dataSource);
        if (table) {
          setAvailableColumns(table.columns);
        }
      }
    } catch (error) {
      console.error('Failed to load columns:', error);
    }
  };

  const updateConfig = (updates: any) => {
    onUpdate({
      config: {
        ...widget.config,
        ...updates
      }
    });
  };

  const addFilter = () => {
    const newFilter: FilterType = {
      column: '',
      operator: 'equals',
      value: ''
    };
    const updatedFilters = [...filters, newFilter];
    setFilters(updatedFilters);
    updateConfig({ filters: updatedFilters });
    updateQueryWithFiltersAndComputed(updatedFilters, computedFields, vlookupTables);
  };

  const updateFilter = (index: number, updates: Partial<FilterType>) => {
    const updatedFilters = filters.map((filter, i) =>
      i === index ? { ...filter, ...updates } : filter
    );
    setFilters(updatedFilters);
    updateConfig({ filters: updatedFilters });
    updateQueryWithFiltersAndComputed(updatedFilters, computedFields, vlookupTables);
  };

  const removeFilter = (index: number) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    setFilters(updatedFilters);
    updateConfig({ filters: updatedFilters });
    updateQueryWithFiltersAndComputed(updatedFilters, computedFields, vlookupTables);
  };

  const addComputedField = () => {
    const newField: ComputedField = {
      name: '',
      formula: '',
      type: 'number'
    };
    const updatedFields = [...computedFields, newField];
    setComputedFields(updatedFields);
    updateConfig({ computedFields: updatedFields });
    updateQueryWithFiltersAndComputed(filters, updatedFields, vlookupTables);
  };

  const updateComputedField = (index: number, updates: Partial<ComputedField>) => {
    const updatedFields = computedFields.map((field, i) =>
      i === index ? { ...field, ...updates } : field
    );
    setComputedFields(updatedFields);
    updateConfig({ computedFields: updatedFields });
    updateQueryWithFiltersAndComputed(filters, updatedFields, vlookupTables);
  };

  const removeComputedField = (index: number) => {
    const updatedFields = computedFields.filter((_, i) => i !== index);
    setComputedFields(updatedFields);
    updateConfig({ computedFields: updatedFields });
    updateQueryWithFiltersAndComputed(filters, updatedFields, vlookupTables);
  };

  const addVlookupTable = () => {
    const newVlookup: VlookupTable = {
      id: Date.now().toString(),
      sourceTable: widget.config.dataSource || '',
      targetTable: '',
      sourceColumn: '',
      targetColumn: '',
      returnColumn: '',
      alias: ''
    };
    const updatedTables = [...vlookupTables, newVlookup];
    setVlookupTables(updatedTables);
    updateConfig({ vlookupTables: updatedTables });
    updateQueryWithFiltersAndComputed(filters, computedFields, updatedTables);
  };

  const updateVlookupTable = (index: number, updates: Partial<VlookupTable>) => {
    const updatedTables = vlookupTables.map((table, i) =>
      i === index ? { ...table, ...updates } : table
    );
    setVlookupTables(updatedTables);
    updateConfig({ vlookupTables: updatedTables });
    updateQueryWithFiltersAndComputed(filters, computedFields, updatedTables);
  };

  const removeVlookupTable = (index: number) => {
    const updatedTables = vlookupTables.filter((_, i) => i !== index);
    setVlookupTables(updatedTables);
    updateConfig({ vlookupTables: updatedTables });
    updateQueryWithFiltersAndComputed(filters, computedFields, updatedTables);
  };

  const updateQueryWithFiltersAndComputed = (
    currentFilters: FilterType[], 
    currentComputedFields: ComputedField[], 
    currentVlookups: VlookupTable[]
  ) => {
    if (!widget.config.dataSource) return;

    let baseQuery = `SELECT `;
    
    // Add original columns
    const originalColumns = availableColumns.map(col => `"${widget.config.dataSource}"."${col}"`);
    
    // Add computed fields
    const computedColumns = currentComputedFields
      .filter(field => field.name && field.formula)
      .map(field => `(${field.formula}) AS "${field.name}"`);
    
    // Add VLOOKUP columns
    const vlookupColumns = currentVlookups
      .filter(vlookup => vlookup.targetTable && vlookup.returnColumn)
      .map(vlookup => `"${vlookup.targetTable}"."${vlookup.returnColumn}" AS "${vlookup.alias || vlookup.returnColumn}"`);
    
    const allColumns = [...originalColumns, ...computedColumns, ...vlookupColumns];
    baseQuery += allColumns.length > 0 ? allColumns.join(', ') : '*';
    
    baseQuery += ` FROM "${widget.config.dataSource}"`;
    
    // Add JOINs for VLOOKUP
    currentVlookups.forEach(vlookup => {
      if (vlookup.targetTable && vlookup.sourceColumn && vlookup.targetColumn) {
        baseQuery += ` LEFT JOIN "${vlookup.targetTable}" ON "${widget.config.dataSource}"."${vlookup.sourceColumn}" = "${vlookup.targetTable}"."${vlookup.targetColumn}"`;
      }
    });
    
    // Add WHERE clause for filters
    const whereConditions = currentFilters
      .filter(filter => filter.column && filter.value)
      .map(filter => {
        const column = `"${widget.config.dataSource}"."${filter.column}"`;
        switch (filter.operator) {
          case 'equals':
            return `${column} = '${filter.value}'`;
          case 'contains':
            return `${column} LIKE '%${filter.value}%'`;
          case 'greater':
            return `${column} > ${filter.value}`;
          case 'less':
            return `${column} < ${filter.value}`;
          case 'in':
            const values = String(filter.value).split(',').map(v => `'${v.trim()}'`).join(',');
            return `${column} IN (${values})`;
          default:
            return `${column} = '${filter.value}'`;
        }
      });
    
    if (whereConditions.length > 0) {
      baseQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    baseQuery += ' LIMIT 100';
    
    updateConfig({ query: baseQuery });
  };

  const handlePreview = async () => {
    if (!widget.config.query && !widget.config.dataSource) {
      toast.error('Please configure a data source first');
      return;
    }

    setIsLoadingPreview(true);
    try {
      let query = widget.config.query;
      if (!query && widget.config.dataSource) {
        query = `SELECT * FROM "${widget.config.dataSource}" LIMIT 10`;
      }

      if (query) {
        const data = await executeQuery(query);
        setPreviewData(data.slice(0, 10));
        toast.success(`Preview loaded: ${data.length} rows`);
      }
    } catch (error) {
      toast.error(`Preview failed: ${error.message}`);
      setPreviewData([]);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const renderWidgetSpecificConfig = () => {
    switch (widget.type) {
      case 'chart':
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Chart Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Chart Type</Label>
                  <Select 
                    value={widget.config.chartType || 'bar'} 
                    onValueChange={(value) => updateConfig({ chartType: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Color Scheme</Label>
                  <Select 
                    value={widget.config.colorScheme || 'default'} 
                    onValueChange={(value) => updateConfig({ colorScheme: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">X-Axis Column</Label>
                  <Select 
                    value={widget.config.xColumn || ''} 
                    onValueChange={(value) => updateConfig({ xColumn: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Y-Axis Column</Label>
                  <Select 
                    value={widget.config.yColumn || ''} 
                    onValueChange={(value) => updateConfig({ yColumn: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.filter(col => {
                        // Only show numeric columns for Y-axis
                        return true; // Simplified for now
                      }).map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Value Format</Label>
                  <Select 
                    value={widget.config.format || 'number'} 
                    onValueChange={(value) => updateConfig({ format: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="currency">Currency</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Labels</Label>
                  <Switch
                    checked={widget.config.showLabels !== false}
                    onCheckedChange={(checked) => updateConfig({ showLabels: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Legend</Label>
                  <Switch
                    checked={widget.config.showLegend !== false}
                    onCheckedChange={(checked) => updateConfig({ showLegend: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'metric':
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Metric Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Metric Column</Label>
                  <Select 
                    value={widget.config.metricColumn || ''} 
                    onValueChange={(value) => updateConfig({ metricColumn: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*">Count All (*)</SelectItem>
                      {availableColumns.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Aggregation</Label>
                  <Select 
                    value={widget.config.aggregationType || 'count'} 
                    onValueChange={(value) => updateConfig({ aggregationType: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="count">Count</SelectItem>
                      <SelectItem value="sum">Sum</SelectItem>
                      <SelectItem value="avg">Average</SelectItem>
                      <SelectItem value="min">Minimum</SelectItem>
                      <SelectItem value="max">Maximum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Format</Label>
                  <Select 
                    value={widget.config.format || 'number'} 
                    onValueChange={(value) => updateConfig({ format: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="currency">Currency</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Target Value</Label>
                  <Input
                    type="number"
                    value={widget.config.targetValue || ''}
                    onChange={(e) => updateConfig({ targetValue: Number(e.target.value) })}
                    placeholder="Optional target"
                    className="h-8"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Trend</Label>
                  <Switch
                    checked={widget.config.showTrend !== false}
                    onCheckedChange={(checked) => updateConfig({ showTrend: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'table':
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <TableIcon className="w-4 h-4 mr-2" />
                Table Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Page Size</Label>
                  <Select 
                    value={String(widget.config.pageSize || 10)} 
                    onValueChange={(value) => updateConfig({ pageSize: Number(value) })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 rows</SelectItem>
                      <SelectItem value="10">10 rows</SelectItem>
                      <SelectItem value="25">25 rows</SelectItem>
                      <SelectItem value="50">50 rows</SelectItem>
                      <SelectItem value="100">100 rows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Sortable</Label>
                  <Switch
                    checked={widget.config.sortable !== false}
                    onCheckedChange={(checked) => updateConfig({ sortable: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Searchable</Label>
                  <Switch
                    checked={widget.config.searchable !== false}
                    onCheckedChange={(checked) => updateConfig({ searchable: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Exportable</Label>
                  <Switch
                    checked={widget.config.exportable !== false}
                    onCheckedChange={(checked) => updateConfig({ exportable: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Row Numbers</Label>
                  <Switch
                    checked={widget.config.showRowNumbers || false}
                    onCheckedChange={(checked) => updateConfig({ showRowNumbers: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Alternate Row Colors</Label>
                  <Switch
                    checked={widget.config.alternateRowColors !== false}
                    onCheckedChange={(checked) => updateConfig({ alternateRowColors: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'text':
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Type className="w-4 h-4 mr-2" />
                Text Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Content</Label>
                <Input
                  value={widget.config.content || ''}
                  onChange={(e) => updateConfig({ content: e.target.value })}
                  placeholder="Enter text content"
                  className="h-8"
                />
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Widget-Specific Configuration */}
      {renderWidgetSpecificConfig()}

      {/* VLOOKUP */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center">
              <Link className="w-4 h-4 mr-2" />
              Data Joins (VLOOKUP)
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addVlookupTable}>
              <Plus className="w-3 h-3 mr-1" />
              Add Join
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vlookupTables.map((vlookup, index) => (
              <Card key={vlookup.id} className="p-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Join {index + 1}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVlookupTable(index)}
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Target Table</Label>
                      <Select
                        value={vlookup.targetTable}
                        onValueChange={(value) => updateVlookupTable(index, { targetTable: value })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select table" />
                        </SelectTrigger>
                        <SelectContent>
                          {tables.map((table) => (
                            <SelectItem key={table.id} value={table.name}>{table.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Return Column</Label>
                      <Input
                        value={vlookup.returnColumn}
                        onChange={(e) => updateVlookupTable(index, { returnColumn: e.target.value })}
                        placeholder="column_name"
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Source Column</Label>
                      <Select
                        value={vlookup.sourceColumn}
                        onValueChange={(value) => updateVlookupTable(index, { sourceColumn: value })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableColumns.map((col) => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Target Column</Label>
                      <Input
                        value={vlookup.targetColumn}
                        onChange={(e) => updateVlookupTable(index, { targetColumn: e.target.value })}
                        placeholder="foreign_key"
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Alias (optional)</Label>
                    <Input
                      value={vlookup.alias}
                      onChange={(e) => updateVlookupTable(index, { alias: e.target.value })}
                      placeholder="display_name"
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              </Card>
            ))}
            
            {vlookupTables.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <Link className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No data joins configured</p>
                <p className="text-xs">Add joins to combine data from multiple tables</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Computed Fields */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Computed Fields
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addComputedField}>
              <Plus className="w-3 h-3 mr-1" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {computedFields.map((field, index) => (
              <Card key={index} className="p-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Computed Field {index + 1}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeComputedField(index)}
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Field Name</Label>
                      <Input
                        value={field.name}
                        onChange={(e) => updateComputedField(index, { name: e.target.value })}
                        placeholder="field_name"
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) => updateComputedField(index, { type: value as any })}
                      >
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Formula</Label>
                    <Input
                      value={field.formula}
                      onChange={(e) => updateComputedField(index, { formula: e.target.value })}
                      placeholder="revenue * 0.1"
                      className="text-xs h-8 font-mono"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Use column names and operators: +, -, *, /, CASE WHEN, etc.
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            {computedFields.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <Settings className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No computed fields</p>
                <p className="text-xs">Add calculated columns to your data</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addFilter}>
              <Plus className="w-3 h-3 mr-1" />
              Add Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filters.map((filter, index) => (
              <FilterRow
                key={index}
                filter={filter}
                availableColumns={availableColumns}
                onUpdate={(updates) => updateFilter(index, updates)}
                onRemove={() => removeFilter(index)}
              />
            ))}
            
            {filters.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <Filter className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No filters configured</p>
                <p className="text-xs">Add filters to refine your data</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Preview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Data Preview
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={isLoadingPreview}
            >
              {isLoadingPreview ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              <span className="ml-1">Preview</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {previewData.length > 0 ? (
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
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <Eye className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No preview data</p>
                <p className="text-xs">Click Preview to see your data</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface FilterRowProps {
  filter: FilterType;
  availableColumns: string[];
  onUpdate: (updates: Partial<FilterType>) => void;
  onRemove: () => void;
}

function FilterRow({ filter, availableColumns, onUpdate, onRemove }: FilterRowProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [multiSelectValues, setMultiSelectValues] = useState<string[]>([]);

  const isDateFilter = filter.operator === 'date_range';
  const isMultiSelect = filter.operator === 'in';

  return (
    <Card className="p-3">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Filter</Label>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="w-3 h-3 text-red-500" />
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Column</Label>
            <Select
              value={filter.column}
              onValueChange={(value) => onUpdate({ column: value })}
            >
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {availableColumns.map((col) => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-xs">Operator</Label>
            <Select
              value={filter.operator}
              onValueChange={(value) => onUpdate({ operator: value as any })}
            >
              <SelectTrigger className="text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="greater">Greater Than</SelectItem>
                <SelectItem value="less">Less Than</SelectItem>
                <SelectItem value="in">In (Multi-select)</SelectItem>
                <SelectItem value="date_range">Date Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-xs">Value</Label>
            {isDateFilter ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-8 text-xs justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range || {});
                      onUpdate({ 
                        value: range ? `${range.from?.toISOString()} - ${range.to?.toISOString()}` : ''
                      });
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            ) : isMultiSelect ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-8 text-xs justify-between"
                  >
                    <span>
                      {multiSelectValues.length > 0 
                        ? `${multiSelectValues.length} selected`
                        : "Select values"
                      }
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3">
                  <div className="space-y-2">
                    <div className="text-xs font-medium">Select Values</div>
                    {/* This would be populated with actual column values */}
                    {['Value 1', 'Value 2', 'Value 3'].map((value) => (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={value}
                          checked={multiSelectValues.includes(value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              const newValues = [...multiSelectValues, value];
                              setMultiSelectValues(newValues);
                              onUpdate({ value: newValues.join(',') });
                            } else {
                              const newValues = multiSelectValues.filter(v => v !== value);
                              setMultiSelectValues(newValues);
                              onUpdate({ value: newValues.join(',') });
                            }
                          }}
                        />
                        <Label htmlFor={value} className="text-xs">{value}</Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Input
                value={String(filter.value)}
                onChange={(e) => onUpdate({ value: e.target.value })}
                placeholder="value"
                className="text-xs h-8"
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}