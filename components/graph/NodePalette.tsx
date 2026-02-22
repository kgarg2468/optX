"use client";

import { NODE_TYPE_LIST } from "@/lib/utils/node-config";
import type { GraphNodeType } from "@/lib/types";

interface NodePaletteProps {
  onDragStart?: (type: GraphNodeType) => void;
}

export function NodePalette({ onDragStart }: NodePaletteProps) {
  const handleDragStart =
    (type: GraphNodeType) => (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData("application/reactflow-type", type);
      e.dataTransfer.effectAllowed = "move";
      onDragStart?.(type);
    };

  return (
    <div className="flex h-full w-56 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium">Nodes</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Drag onto canvas
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {NODE_TYPE_LIST.map(({ type, label, description, icon: Icon, bgClass, borderClass, textClass }) => (
          <div
            key={type}
            draggable
            onDragStart={handleDragStart(type)}
            className={`flex items-center gap-3 rounded-lg border-2 px-3 py-2.5 cursor-grab active:cursor-grabbing transition-colors hover:shadow-sm ${bgClass} ${borderClass}`}
          >
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${bgClass}`}>
              <Icon className={`h-3.5 w-3.5 ${textClass}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium">{label}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
