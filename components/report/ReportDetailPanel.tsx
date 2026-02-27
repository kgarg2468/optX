"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { highlightFinanceTerms } from "@/components/ui/finance-term";

export interface ReportDetailItem {
  type: string;
  id: string;
  title: string;
  current?: string;
  projected?: string;
  aiDetail: string;
  severity?: "Low" | "Medium" | "High";
}

interface ReportDetailPanelProps {
  items: ReportDetailItem[];
  onDismiss: (id: string) => void;
}

export function ReportDetailPanel({ items, onDismiss }: ReportDetailPanelProps) {
  return (
    <div className="flex h-full flex-col border-l border-border/50 bg-card/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <h3 className="text-sm font-semibold">
          AI Analysis
          {items.length > 0 && (
            <span className="ml-2 text-[10px] text-muted-foreground font-normal">
              {items.length} selected
            </span>
          )}
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">
            Click any metric, row, or milestone to see AI analysis
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">
                    {item.type}
                  </p>
                  <p className="text-xs font-semibold">{item.title}</p>
                </div>
                <button
                  onClick={() => onDismiss(item.id)}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {item.current && item.projected && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-mono">{item.current}</span>
                  <span className="text-muted-foreground">&rarr;</span>
                  <span className="font-mono font-semibold">{item.projected}</span>
                </div>
              )}

              {item.severity && (
                <span
                  className={cn(
                    "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                    item.severity === "Low" && "bg-emerald-500/10 text-emerald-400",
                    item.severity === "Medium" && "bg-amber-500/10 text-amber-400",
                    item.severity === "High" && "bg-rose-500/10 text-rose-400"
                  )}
                >
                  {item.severity} Severity
                </span>
              )}

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {highlightFinanceTerms(item.aiDetail)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
