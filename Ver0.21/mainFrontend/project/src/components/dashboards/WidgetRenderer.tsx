import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableWidget } from './widgets/TableWidget';
import { ChartWidget } from './widgets/ChartWidget';
import { MetricWidget } from './widgets/MetricWidget';
import { TextWidget } from './widgets/TextWidget';
import { Settings, Trash2, Eye } from 'lucide-react';
import { Widget } from '@/types';
import { cn } from '@/lib/utils';

interface WidgetRendererProps {
  widget: Widget;
  isSelected: boolean;
  isPreviewMode: boolean;
  onDelete: () => void;
  onConfigure?: () => void;
  onSelect?: () => void;
  interactionMode?: 'select' | 'drag' | 'resize' | 'configure' | 'scroll';
}

export function WidgetRenderer({ 
  widget, 
  isSelected, 
  isPreviewMode, 
  onDelete, 
  onConfigure,
  onSelect,
  interactionMode = 'select'
}: WidgetRendererProps) {
  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'table':
        return <TableWidget widget={widget} />;
      case 'chart':
        return <ChartWidget widget={widget} />;
      case 'metric':
        return <MetricWidget widget={widget} />;
      case 'text':
        return <TextWidget widget={widget} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-sm font-medium">Unknown Widget Type</div>
              <div className="text-xs">{widget.type}</div>
            </div>
          </div>
        );
    }
  };

  const handleWidgetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Only trigger select if we're not in a specific interaction mode
    if (interactionMode === 'select' && onSelect) {
      onSelect(widget);
    }
  };

  const handleConfigClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onConfigure) {
      onConfigure(widget);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <Card 
      className={cn(
        "h-full shadow-sm transition-all duration-200",
        isSelected && !isPreviewMode && "ring-2 ring-blue-500 ring-offset-2",
        interactionMode === 'drag' && "cursor-grab active:cursor-grabbing",
        interactionMode === 'resize' && "cursor-nw-resize",
        interactionMode === 'select' && "cursor-pointer"
      )}
      onClick={handleWidgetClick}
    >
      {!isPreviewMode && (
        <CardHeader className="pb-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            {/* Left side: title + badge */}
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <CardTitle className="text-sm font-medium truncate">
                {widget.title}
              </CardTitle>
              <Badge variant="outline" className="text-xs capitalize">
                {widget.type}
              </Badge>
            </div>

            {/* Right side: actions always stay visible */}
            {isSelected && (
              <div className="flex items-center space-x-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-blue-50"
                  onClick={handleConfigClick}
                  title="Configure widget"
                >
                  <Settings className="w-3 h-3 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-red-50"
                  onClick={handleDeleteClick}
                  title="Delete widget"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className={cn(
        "h-full",
        !isPreviewMode && "pt-0"
      )}>
        <div 
          className={cn(
            "h-full",
            !isPreviewMode && "h-[calc(100%-60px)]"
          )}
          data-nodrag={widget.type === 'table' || interactionMode === 'scroll'}
          onMouseDown={(e) => {
            // For table widgets, prevent drag when interacting with content
            if (widget.type === 'table' || interactionMode === 'scroll') {
              e.stopPropagation();
            }
          }}
          onWheel={(e) => {
            // Allow scrolling within widgets without triggering canvas zoom
            e.stopPropagation();
          }}
          style={{ 
            // Ensure scrollable content doesn't trigger node dragging
            pointerEvents: widget.type === 'table' ? 'auto' : undefined 
          }}
        >
          {renderWidgetContent()}
        </div>
      </CardContent>
    </Card>
  );
}