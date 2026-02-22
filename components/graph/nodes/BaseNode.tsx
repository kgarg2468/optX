"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { NODE_CONFIGS } from "@/lib/utils/node-config";
import type { GraphNodeData } from "@/lib/types";

type BaseNodeProps = NodeProps & {
  data: GraphNodeData;
};

function BaseNodeComponent({ data, selected }: BaseNodeProps) {
  const config = NODE_CONFIGS[data.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "min-w-[160px] rounded-lg border-2 px-3 py-2 shadow-sm transition-shadow",
        config.bgClass,
        config.borderClass,
        selected && "shadow-md ring-2 ring-ring"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-muted-foreground"
      />
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded",
            config.bgClass
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", config.textClass)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium truncate">{data.label}</p>
          {data.value !== undefined && (
            <p className="text-[10px] text-muted-foreground">
              {data.value}
              {data.unit ? ` ${data.unit}` : ""}
            </p>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-muted-foreground"
      />
    </div>
  );
}

export const BaseNode = memo(BaseNodeComponent);
