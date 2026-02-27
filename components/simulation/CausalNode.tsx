"use client";

import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { NODE_CONFIGS } from "@/lib/utils/node-config";
import type { GraphNodeType } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus, Pin } from "lucide-react";

export interface CausalNodeData {
  label: string;
  category: GraphNodeType;
  currentValue: string;
  proposedValue: string;
  delta: string;
  id?: string;
  isPinned?: boolean;
  onTogglePin?: (nodeId: string) => void;
  [key: string]: unknown;
}

function getDeltaInfo(delta: string) {
  if (delta.startsWith("+") || delta.toLowerCase() === "new" || delta.toLowerCase() === "upgrade") {
    return { icon: TrendingUp, className: "text-emerald-400 bg-emerald-400/10" };
  }
  if (delta.startsWith("-")) {
    return { icon: TrendingDown, className: "text-rose-400 bg-rose-400/10" };
  }
  return { icon: Minus, className: "text-muted-foreground bg-muted/50" };
}

function CausalNodeComponent({ data, selected }: NodeProps & { data: CausalNodeData }) {
  const config = NODE_CONFIGS[data.category];
  const Icon = config.icon;
  const deltaInfo = getDeltaInfo(data.delta);
  const DeltaIcon = deltaInfo.icon;

  const handlePinClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (data.id && data.onTogglePin) {
        data.onTogglePin(data.id);
      }
    },
    [data.id, data.onTogglePin]
  );

  return (
    <div
      className={cn(
        "group relative min-w-[220px] max-w-[280px] rounded-xl border bg-card/95 backdrop-blur-sm px-4 py-3.5 shadow-lg transition-all duration-200",
        `border-l-[3px]`,
        config.borderClass,
        selected && "ring-2 ring-offset-1 ring-offset-background shadow-xl",
        selected && `ring-[hsl(var(--${config.color}))]`
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground"
      />

      {/* Pin button */}
      <button
        onClick={handlePinClick}
        className={cn(
          "absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-full transition-all duration-150",
          data.isPinned
            ? "bg-amber-500/20 text-amber-400 opacity-100"
            : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <Pin
          className={cn("h-3.5 w-3.5", data.isPinned && "fill-amber-400")}
        />
      </button>

      {/* Header: icon + label */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
            config.bgClass
          )}
        >
          <Icon className={cn("h-4 w-4", config.textClass)} />
        </div>
        <p className="text-sm font-bold truncate text-foreground">{data.label}</p>
      </div>

      {/* Values */}
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-base font-mono font-bold text-foreground">
          {data.proposedValue}
        </span>
        <div className={cn("flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-medium", deltaInfo.className)}>
          <DeltaIcon className="h-3 w-3" />
          {data.delta}
        </div>
      </div>

      {/* Current value (faded) */}
      <p className="text-[11px] text-muted-foreground mt-1.5">
        was {data.currentValue}
      </p>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground"
      />
    </div>
  );
}

export const CausalNode = memo(CausalNodeComponent);
