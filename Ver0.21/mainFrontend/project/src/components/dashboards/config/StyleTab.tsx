import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Palette, 
  Type, 
  Layout,
  Smartphone,
  Tablet,
  Monitor,
  Plus,
  X
} from 'lucide-react';
import { Widget } from '@/types';

interface StyleTabProps {
  widget: Widget;
  onUpdate: (updates: Partial<Widget>) => void;
}

export function StyleTab({ widget, onUpdate }: StyleTabProps) {
  const updateConfig = (updates: any) => {
    onUpdate({
      config: {
        ...widget.config,
        ...updates
      }
    });
  };

  const addCustomColor = () => {
    const currentColors = widget.config.customColors || [];
    const newColors = [...currentColors, '#3B82F6'];
    updateConfig({ customColors: newColors });
  };

  const updateCustomColor = (index: number, color: string) => {
    const currentColors = widget.config.customColors || [];
    const newColors = [...currentColors];
    newColors[index] = color;
    updateConfig({ customColors: newColors });
  };

  const removeCustomColor = (index: number) => {
    const currentColors = widget.config.customColors || [];
    const newColors = currentColors.filter((_, i) => i !== index);
    updateConfig({ customColors: newColors });
  };

  return (
    <div className="space-y-6">
      {/* Colors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Palette className="w-4 h-4 mr-2" />
            Colors & Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Background Color</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  type="color"
                  value={widget.config.backgroundColor || '#ffffff'}
                  onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                  className="w-12 h-8 p-1 border rounded"
                />
                <Input
                  value={widget.config.backgroundColor || '#ffffff'}
                  onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                  placeholder="#ffffff"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Text Color</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  type="color"
                  value={widget.config.textColor || '#000000'}
                  onChange={(e) => updateConfig({ textColor: e.target.value })}
                  className="w-12 h-8 p-1 border rounded"
                />
                <Input
                  value={widget.config.textColor || '#000000'}
                  onChange={(e) => updateConfig({ textColor: e.target.value })}
                  placeholder="#000000"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {widget.type === 'chart' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Custom Colors</Label>
                <Button variant="outline" size="sm" onClick={addCustomColor}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Color
                </Button>
              </div>
              <div className="space-y-2">
                {(widget.config.customColors || []).map((color, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      type="color"
                      value={color}
                      onChange={(e) => updateCustomColor(index, e.target.value)}
                      className="w-12 h-8 p-1 border rounded"
                    />
                    <Input
                      value={color}
                      onChange={(e) => updateCustomColor(index, e.target.value)}
                      className="h-8 text-xs font-mono flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomColor(index)}
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Layout */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Layout className="w-4 h-4 mr-2" />
            Layout & Spacing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Padding</Label>
              <div className="mt-1">
                <Slider
                  value={[widget.config.padding || 16]}
                  onValueChange={([value]) => updateConfig({ padding: value })}
                  max={50}
                  min={0}
                  step={2}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {widget.config.padding || 16}px
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs">Border Radius</Label>
              <div className="mt-1">
                <Slider
                  value={[widget.config.borderRadius || 8]}
                  onValueChange={([value]) => updateConfig({ borderRadius: value })}
                  max={30}
                  min={0}
                  step={2}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {widget.config.borderRadius || 8}px
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Type className="w-4 h-4 mr-2" />
            Typography
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Font Family</Label>
              <Select 
                value={widget.config.fontFamily || 'Inter'} 
                onValueChange={(value) => updateConfig({ fontFamily: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Font Size</Label>
              <Select 
                value={widget.config.fontSize || 'medium'} 
                onValueChange={(value) => updateConfig({ fontSize: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="extra-large">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsive Design */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Smartphone className="w-4 h-4 mr-2" />
            Responsive Design
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-gray-500" />
                <Label className="text-xs">Mobile Responsive</Label>
              </div>
              <Switch
                checked={widget.config.mobileResponsive !== false}
                onCheckedChange={(checked) => updateConfig({ mobileResponsive: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tablet className="w-4 h-4 text-gray-500" />
                <Label className="text-xs">Tablet Optimized</Label>
              </div>
              <Switch
                checked={widget.config.tabletOptimized !== false}
                onCheckedChange={(checked) => updateConfig({ tabletOptimized: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4 text-gray-500" />
                <Label className="text-xs">Desktop Enhanced</Label>
              </div>
              <Switch
                checked={widget.config.desktopEnhanced !== false}
                onCheckedChange={(checked) => updateConfig({ desktopEnhanced: checked })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Breakpoints</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-gray-500">Mobile</Label>
                <Input
                  value={widget.config.breakpoints?.mobile || '768px'}
                  onChange={(e) => updateConfig({ 
                    breakpoints: { 
                      ...widget.config.breakpoints, 
                      mobile: e.target.value 
                    }
                  })}
                  className="h-8 text-xs"
                  placeholder="768px"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Tablet</Label>
                <Input
                  value={widget.config.breakpoints?.tablet || '1024px'}
                  onChange={(e) => updateConfig({ 
                    breakpoints: { 
                      ...widget.config.breakpoints, 
                      tablet: e.target.value 
                    }
                  })}
                  className="h-8 text-xs"
                  placeholder="1024px"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Desktop</Label>
                <Input
                  value={widget.config.breakpoints?.desktop || '1280px'}
                  onChange={(e) => updateConfig({ 
                    breakpoints: { 
                      ...widget.config.breakpoints, 
                      desktop: e.target.value 
                    }
                  })}
                  className="h-8 text-xs"
                  placeholder="1280px"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom CSS */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Custom CSS</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label className="text-xs">Custom Styles</Label>
            <Textarea
              value={widget.config.customCSS || ''}
              onChange={(e) => updateConfig({ customCSS: e.target.value })}
              placeholder="/* Custom CSS styles */
.widget-content {
  /* Your styles here */
}"
              className="mt-1 font-mono text-xs"
              rows={6}
            />
            <div className="text-xs text-gray-500 mt-2">
              Use the <code>.widget-content</code> class to target the widget content area.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}