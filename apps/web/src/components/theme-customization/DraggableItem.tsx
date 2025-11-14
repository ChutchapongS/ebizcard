'use client';

import { useDraggable } from '@dnd-kit/core';

interface DraggableItemProps {
  type: 'text' | 'textarea' | 'logo' | 'picture' | 'social' | 'icon' | 'qrcode';
  label: string;
  icon: string;
  field?: string;
}

export function DraggableItem({ type, label, icon, field }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `draggable-${type}`,
    data: {
      type,
      field
    }
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:bg-gray-50 hover:border-gray-300 transition-colors"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="font-medium text-gray-900 text-xs">{label}</div>
        {field && (
          <div className="text-xs text-gray-500">Binds to: {field}</div>
        )}
      </div>
    </div>
  );
}
