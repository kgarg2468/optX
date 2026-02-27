"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { NODE_CONFIGS } from "@/lib/utils/node-config";
import type { GraphNodeType } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface CausalNodeData {
  label: string;
  category: GraphNodeType;
  currentValue: string;
  proposedValue: string;
  delta: string;
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

  return (
    <div
      className={cn(
        "min-w-[180px] max-w-[220px] rounded-xl border bg-card/95 backdrop-blur-sm px-3 py-2.5 shadow-lg transition-all duration-200",
        `border-l-[3px]`,
        config.borderClass,
        selected && "ring-2 ring-offset-1 ring-offset-background shadow-xl",
        selected && `ring-[hsl(var(--${config.color}))]`
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-muted-foreground"
      />

      {/* Header: icon + label */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded",
            config.bgClass
          )}
        >
          <Icon className={cn("h-3 w-3", config.textClass)} />
        </div>
        <p className="text-xs font-semibold truncate text-foreground">{data.label}</p>
      </div>

      {/* Values */}
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-mono font-bold text-foreground">
          {data.proposedValue}
        </span>
        <div className={cn("flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium", deltaInfo.className)}>
          <DeltaIcon className="h-2.5 w-2.5" />
          {data.delta}
        </div>
      </div>

      {/* Current value (faded) */}
      <p className="text-[10px] text-muted-foreground mt-1">
        was {data.currentValue}
      </p>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-muted-foreground"
      />
    </div>
  );
}

export const CausalNode = memo(CausalNodeComponent);
