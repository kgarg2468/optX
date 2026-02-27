"use client";

import { cn } from "@/lib/utils";
import { NODE_CONFIGS } from "@/lib/utils/node-config";
import { highlightFinanceTerms } from "@/components/ui/finance-term";
import type { MockCausalNode } from "@/lib/mock/simulation-scenarios";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NodeHoverPopoverProps {
  node: MockCausalNode;
  position: { x: number; y: number };
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

export function NodeHoverPopover({ node, position }: NodeHoverPopoverProps) {
  const config = NODE_CONFIGS[node.category];
  const deltaInfo = getDeltaInfo(node.delta);
  const DeltaIcon = deltaInfo.icon;

  // Viewport-bounded positioning — expand below node, flip above if overflow
  const popoverWidth = 240;
  const popoverHeight = 120;
  const padding = 16;

  let x = position.x;
  let y = position.y;

  if (typeof window !== "undefined") {
    // Flip above if bottom overflow
    if (y + popoverHeight + padding > window.innerHeight) {
      y = position.y - popoverHeight - 40;
    }
    // Clamp left/right
    if (x + popoverWidth + padding > window.innerWidth) {
      x = window.innerWidth - popoverWidth - padding;
    }
    if (x < padding) {
      x = padding;
    }
    if (y < padding) {
      y = padding;
    }
  }

  return (
    <div
      className={cn(
        "fixed z-50 w-[240px] rounded-xl border bg-black/80 backdrop-blur-2xl shadow-2xl px-3.5 py-2.5 pointer-events-none",
        "border-white/10",
        "shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
      )}
      style={{ left: x, top: y }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1.5">
        <Badge
          variant="outline"
          className={cn("text-[9px] px-1.5 py-0", config.textClass, config.borderClass)}
        >
          {config.label}
        </Badge>
        <p className="text-xs font-semibold truncate flex-1">{node.label}</p>
      </div>

      {/* Values row */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[11px] text-muted-foreground font-mono">
          {node.currentValue}
        </span>
        <span className="text-muted-foreground text-[10px]">&rarr;</span>
        <span className="text-sm font-mono font-bold">{node.proposedValue}</span>
        <div
          className={cn(
            "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ml-auto",
            deltaInfo.className
          )}
        >
          <DeltaIcon className="h-2.5 w-2.5" />
          {node.delta}
        </div>
      </div>

      {/* Impact (1 line) */}
      <p className="text-[11px] text-muted-foreground line-clamp-1">
        {highlightFinanceTerms(node.impact)}
      </p>
    </div>
  );
}
