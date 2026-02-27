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

function generateAIInsight(node: MockCausalNode): string {
  const category = node.category;
  const insights: Record<string, string> = {
    financial: `This financial metric shifts from ${node.currentValue} to ${node.proposedValue}, a ${node.delta} change that directly impacts the bottom line. The causal model shows this is a high-leverage variable for profitability.`,
    market: `Market dynamics drive this ${node.delta} shift. The change from ${node.currentValue} to ${node.proposedValue} in ${node.label} represents a significant competitive move that cascades through downstream revenue nodes.`,
    brand: `Brand perception metrics like ${node.label} have delayed but compounding effects. The ${node.delta} improvement builds organic momentum that reduces long-term CAC and strengthens customer LTV.`,
    operations: `Operational improvements of ${node.delta} in ${node.label} create sustainable cost advantages. Moving from ${node.currentValue} to ${node.proposedValue} compounds over time through efficiency gains.`,
    metric: `This KPI tracks the combined effect of upstream changes. The ${node.delta} movement in ${node.label} reflects the aggregate impact of multiple causal drivers in the model.`,
    logic: `This logic node governs conditional effects in the causal chain. When ${node.label} changes by ${node.delta}, it triggers downstream adjustments across connected variables.`,
  };
  return insights[category] ?? insights.metric!;
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
  const aiInsight = generateAIInsight(node);

  // Viewport-bounded positioning
  const popoverWidth = 280;
  const popoverHeight = 260;
  const padding = 16;

  let x = position.x + 20;
  let y = position.y - 20;

  if (typeof window !== "undefined") {
    if (x + popoverWidth + padding > window.innerWidth) {
      x = position.x - popoverWidth - 20;
    }
    if (y + popoverHeight + padding > window.innerHeight) {
      y = window.innerHeight - popoverHeight - padding;
    }
    if (y < padding) {
      y = padding;
    }
  }

  return (
    <div
      className={cn(
        "fixed z-50 w-[280px] rounded-xl border bg-card/95 backdrop-blur-md shadow-2xl px-4 py-3 pointer-events-none",
        "border-l-[3px]",
        config.borderClass
      )}
      style={{ left: x, top: y }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Badge
          variant="outline"
          className={cn("text-[10px]", config.textClass, config.borderClass)}
        >
          {config.label}
        </Badge>
        <p className="text-xs font-semibold truncate flex-1">{node.label}</p>
      </div>

      {/* Values row */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-muted-foreground font-mono">
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

      {/* Impact */}
      <p className="text-[11px] text-muted-foreground mb-3">
        {highlightFinanceTerms(node.impact)}
      </p>

      {/* AI Insight */}
      <div className="border-t border-border/50 pt-2">
        <p className="text-[10px] font-medium text-muted-foreground mb-1">
          AI INSIGHT
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {highlightFinanceTerms(aiInsight)}
        </p>
      </div>
    </div>
  );
}
