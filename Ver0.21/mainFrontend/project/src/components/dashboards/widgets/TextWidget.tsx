import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, X, Type } from 'lucide-react';
import { Widget } from '@/types';

interface TextWidgetProps {
  widget: Widget;
}

export function TextWidget({ widget }: TextWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(widget.config.content || 'Click edit to add content...');

  const handleSave = () => {
    // In a real implementation, this would update the widget config
    setIsEditing(false);
  };

  const handleCancel = () => {
    setContent(widget.config.content || 'Click edit to add content...');
    setIsEditing(false);
  };

  const containerStyle = {
    backgroundColor: widget.config.backgroundColor || '#ffffff',
    color: widget.config.textColor || '#000000',
    borderRadius: `${widget.config.borderRadius || 8}px`,
    padding: `${widget.config.padding || 16}px`
  };

  if (isEditing) {
    return (
      <div className="h-full" style={containerStyle}>
        <style>
          {widget.config.customCSS && `
            .widget-content {
              ${widget.config.customCSS}
            }
          `}
        </style>
        <div className="h-full flex flex-col widget-content overflow-auto custom-scrollbar noWheel">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Type className="w-4 h-4" />
              <span className="text-sm font-medium">Edit Content</span>
            </div>
            <div className="flex items-center space-x-1">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="w-3 h-3" />
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your content here... Supports plain text and basic HTML."
            className="flex-1 resize-none text-sm custom-scrollbar"
          />
          
          <div className="mt-3 text-xs text-gray-500 flex-shrink-0">
            <div className="font-medium mb-1">Supported formatting:</div>
            <div className="space-y-1">
              <div><code>&lt;b&gt;Bold text&lt;/b&gt;</code></div>
              <div><code>&lt;i&gt;Italic text&lt;/i&gt;</code></div>
              <div><code>&lt;a href="url"&gt;Link&lt;/a&gt;</code></div>
              <div><code>&lt;br&gt;</code> for line breaks</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative group" style={containerStyle}>
      <style>
        {widget.config.customCSS && `
          .widget-content {
            ${widget.config.customCSS}
          }
        `}
      </style>
      <div className="h-full overflow-auto widget-content custom-scrollbar">
        <div 
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setIsEditing(true)}
      >
        <Edit className="w-3 h-3" />
      </Button>
    </div>
  );
}