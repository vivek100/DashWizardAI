import { Widget } from '@/types';

export function findAvailablePosition(widgets: Widget[], newWidget: Widget) {
  const gridSize = 20;
  let x = 0;
  let y = 0;
  
  const isPositionOccupied = (testX: number, testY: number) => {
    return widgets.some(widget => {
      const widgetRight = widget.position.x + widget.size.width;
      const widgetBottom = widget.position.y + widget.size.height;
      const newRight = testX + newWidget.size.width;
      const newBottom = testY + newWidget.size.height;
      
      return !(testX >= widgetRight || newRight <= widget.position.x || 
              testY >= widgetBottom || newBottom <= widget.position.y);
    });
  };

  while (isPositionOccupied(x, y)) {
    x += gridSize;
    if (x > 800) {
      x = 0;
      y += gridSize;
    }
  }

  return { x, y };
} 