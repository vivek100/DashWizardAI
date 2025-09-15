import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Database, 
  Settings,
  Palette,
  Eye,
  Play
} from 'lucide-react';
import { Widget } from '@/types';
import { DataSourceTab } from './config/DataSourceTab';
import { ConfigurationTab } from './config/ConfigurationTab';
import { StyleTab } from './config/StyleTab';
import { useDataStore } from '@/store/dataStore';
import { toast } from 'sonner';

interface WidgetConfigPanelProps {
  widget: Widget;
  onUpdate: (updates: Partial<Widget>) => void;
  onClose: () => void;
}

export function WidgetConfigPanel({ widget, onUpdate, onClose }: WidgetConfigPanelProps) {
  const { executeQuery } = useDataStore();
  const [title, setTitle] = useState(widget.title);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('data');

  useEffect(() => {
    setTitle(widget.title);
  }, [widget.title]);

  const handleSave = () => {
    onUpdate({ title });
    toast.success('Widget updated successfully');
  };

  const handlePreview = async () => {
    if (!widget.config.query) {
      toast.error('Please configure a data source first');
      return;
    }

    setIsLoadingPreview(true);
    try {
      const data = await executeQuery(widget.config.query);
      setPreviewData(data.slice(0, 10));
      toast.success(`Preview loaded: ${data.length} rows`);
    } catch (error) {
      toast.error(`Preview failed: ${error.message}`);
      setPreviewData([]);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'data': return <Database className="w-3 h-3" />;
      case 'config': return <Settings className="w-3 h-3" />;
      case 'style': return <Palette className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Widget Configuration</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs capitalize">
                {widget.type}
              </Badge>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">ID: {widget.id}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={isLoadingPreview || !widget.config.query}
            >
              {isLoadingPreview ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              <span className="ml-1">Preview</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Widget Title */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div>
          <Label htmlFor="title" className="text-sm font-medium">Widget Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter widget title..."
            className="mt-1"
          />
        </div>
      </div>

      {/* Configuration Tabs */}
      <div className="flex-1 min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b border-gray-200 px-4 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-3 h-10">
              <TabsTrigger value="data" className="text-xs flex items-center space-x-1">
                {getTabIcon('data')}
                <span>Data</span>
              </TabsTrigger>
              <TabsTrigger value="config" className="text-xs flex items-center space-x-1">
                {getTabIcon('config')}
                <span>Configuration</span>
              </TabsTrigger>
              <TabsTrigger value="style" className="text-xs flex items-center space-x-1">
                {getTabIcon('style')}
                <span>Style</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <TabsContent value="data" className="mt-0">
                  <DataSourceTab widget={widget} onUpdate={onUpdate} />
                </TabsContent>

                <TabsContent value="config" className="mt-0">
                  <ConfigurationTab widget={widget} onUpdate={onUpdate} />
                </TabsContent>

                <TabsContent value="style" className="mt-0">
                  <StyleTab widget={widget} onUpdate={onUpdate} />
                </TabsContent>
              </div>
            </ScrollArea>
          </div>

          {/* Data Preview - Shown on all tabs */}
          {previewData.length > 0 && (
            <div className="border-t border-gray-200 flex-shrink-0">
              <div className="p-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      Data Preview ({previewData.length} rows)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-32">
                      <div className="min-w-max">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              {Object.keys(previewData[0] || {}).map((col) => (
                                <th key={col} className="text-left p-2 font-medium text-gray-700 border-b min-w-[80px]">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.map((row, index) => (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                {Object.values(row).map((value, colIndex) => (
                                  <td key={colIndex} className="p-2 text-gray-600 min-w-[80px]">
                                    <div className="truncate max-w-[100px]" title={String(value || '')}>
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
              </div>
            </div>
          )}
        </Tabs>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}