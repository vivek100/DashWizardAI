import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Table, 
  Target, 
  FileText, 
  Calendar,
  Type,
  TrendingUp,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react';
import { Widget } from '@/types';

interface WidgetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectWidget: (type: Widget['type']) => void;
}

const widgetTypes = [
  {
    type: 'table' as const,
    title: 'Table View',
    description: 'Display data in a sortable, paginated table format',
    icon: Table,
    color: 'bg-blue-100 text-blue-600',
    features: ['Sorting', 'Pagination', 'Filtering', 'Export']
  },
  {
    type: 'chart' as const,
    title: 'Chart',
    description: 'Visualize data with bar, line, pie, or area charts',
    icon: BarChart3,
    color: 'bg-green-100 text-green-600',
    features: ['Multiple Types', 'Interactive', 'Responsive', 'Customizable']
  },
  {
    type: 'metric' as const,
    title: 'Metric Card',
    description: 'Show key performance indicators with comparisons',
    icon: Target,
    color: 'bg-purple-100 text-purple-600',
    features: ['KPI Display', 'Trend Indicators', 'Comparisons', 'Alerts']
  },
  {
    type: 'text' as const,
    title: 'Text Block',
    description: 'Add rich text, markdown, or HTML content',
    icon: Type,
    color: 'bg-orange-100 text-orange-600',
    features: ['Rich Text', 'Markdown', 'HTML', 'Formatting']
  }
];

export function WidgetPicker({ open, onOpenChange, onSelectWidget }: WidgetPickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Add Widget
          </DialogTitle>
          <DialogDescription>
            Choose a widget type to add to your dashboard
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-4 py-4">
          {widgetTypes.map((widget) => (
            <Card 
              key={widget.type}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-300"
              onClick={() => onSelectWidget(widget.type)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start space-x-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${widget.color}`}>
                    <widget.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{widget.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {widget.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {widget.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="border-t pt-4">
          <div className="text-sm text-gray-600">
            <div className="font-medium mb-2">Coming Soon:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2 text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Calendar Heatmap</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Activity className="w-4 h-4" />
                <span>Real-time Metrics</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <TrendingUp className="w-4 h-4" />
                <span>Trend Analysis</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <PieChart className="w-4 h-4" />
                <span>Advanced Charts</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}