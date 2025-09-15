import React, { useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@reactflow/core';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/core/dist/style.css';
import '@reactflow/node-resizer/dist/style.css';
import { WidgetRenderer } from './WidgetRenderer';
import { Widget, WidgetNode } from '@/types';

interface WidgetFlowNodeProps extends NodeProps<WidgetNode['data']> {
  isConnectable?: boolean;
}

export function WidgetFlowNode({ id, data, selected, isConnectable = false, dragging }: WidgetFlowNodeProps) {
  const { widget, onSelect, onConfigure, onDelete, onResize, isSelected, isPreviewMode } = data;
  const { setNodes } = useReactFlow();

  const handleSelect = useCallback(() => {
    if (!isPreviewMode && onSelect) onSelect(widget);
  }, [isPreviewMode, onSelect, widget]);

  const handleConfigure = useCallback(() => {
    if (!isPreviewMode && onConfigure) onConfigure(widget);
  }, [isPreviewMode, onConfigure, widget]);

  const handleDelete = useCallback(() => {
    if (!isPreviewMode && onDelete) onDelete(widget.id);
  }, [isPreviewMode, onDelete, widget.id]);

  const handleResize = useCallback(
    (width: number, height: number) => {
      // 1) update React Flow node immediately
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                    data: {
                  ...node.data,
                  widget: { ...node.data.widget, size: { width, height } },
                },
                    style: { ...node.style, width, height },
                  }
            : node
        )
      );

      // 2) persist into dashboard state (via DashboardFlowEditor’s handleWidgetResize)
      if (onResize) {
        onResize(id, { width, height });
      }
    },
    [id, setNodes, onResize]
  );

  const interactionMode = isPreviewMode ? 'scroll' : dragging ? 'drag' : 'select';

  return (
    <div
      style={{ width: widget.size.width, height: widget.size.height, position: 'relative' }}
      className={isSelected && !isPreviewMode ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
    >
      {/* Hidden handles for future connections */}
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="opacity-0" />

      {/* Widget content */}
      <WidgetRenderer
        widget={widget}
        isSelected={isSelected}
        isPreviewMode={isPreviewMode}
        onDelete={handleDelete}
        onConfigure={handleConfigure}
        onSelect={handleSelect}
        interactionMode={interactionMode as any}
      />

      {/* React Flow NodeResizer */}
      {!isPreviewMode && isSelected && (
        <NodeResizer
          minWidth={200}
          minHeight={150}
          isVisible={true}
          onResize={(_, params) => handleResize(params.width, params.height)}
        />
      )}
    </div>
  );
}
