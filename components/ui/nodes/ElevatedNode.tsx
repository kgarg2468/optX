"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";

export interface ElevatedNodeData {
    label: string;
    value: string;
    subLabel?: string;
    status?: "normal" | "warning" | "success";
}

const ElevatedNodeComponent = ({
    data,
    selected,
}: {
    data: ElevatedNodeData;
    selected?: boolean;
}) => {
    return (
        <div
            className={cn(
                "relative group min-w-[200px] px-6 py-5 rounded-3xl",
                "glass-card border-2 transition-all duration-300",
                selected
                    ? "border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                    : "border-white/10 hover:border-white/20 shadow-xl"
            )}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 border-2 border-forest-900 bg-white/50"
            />

            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                        {data.label}
                    </span>
                    {data.status === "warning" && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                    {data.status === "success" && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                </div>

                <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-light text-foreground tabular-nums tracking-tight">
                        {data.value}
                    </span>
                    {data.subLabel && (
                        <span className="text-sm font-medium text-muted-foreground">
                            {data.subLabel}
                        </span>
                    )}
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 border-2 border-forest-900 bg-white/50"
            />
        </div>
    );
};

export const ElevatedNode = memo(ElevatedNodeComponent);
