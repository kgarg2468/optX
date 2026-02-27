"use client";

import { use, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { REPORT_STORE } from "@/lib/mock/report-data";
import type { ReportMetric, PLRow, RiskItem, Milestone } from "@/lib/mock/report-data";
import { highlightFinanceTerms } from "@/components/ui/finance-term";
import {
  ReportDetailPanel,
  type ReportDetailItem,
} from "@/components/report/ReportDetailPanel";

export default function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const report = REPORT_STORE.get(id);

  const [selectedItems, setSelectedItems] = useState<ReportDetailItem[]>([]);

  const addItem = useCallback((item: ReportDetailItem) => {
    setSelectedItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const dismissItem = useCallback((itemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Report not found</p>
        <Button variant="outline" onClick={() => router.push("/simulate")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Simulation
        </Button>
      </div>
    );
  }

  const { header, metrics, plTable, riskAssessment, roadmap } = report;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 -ml-2"
              onClick={() => router.push("/simulate")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Exploration
            </Button>

            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  {header.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {header.businessName} &middot; {header.date}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  {header.tag}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    header.confidence >= 85
                      ? "border-emerald-500/30 text-emerald-400"
                      : header.confidence >= 70
                        ? "border-amber-500/30 text-amber-400"
                        : "border-rose-500/30 text-rose-400"
                  )}
                >
                  {header.confidence}% Confidence
                </Badge>
                <Button variant="outline" size="sm" className="h-8">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Metric cards row */}
          <div>
            <h2 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Key Metrics
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {metrics.map((metric) => (
                <MetricCard
                  key={metric.id}
                  metric={metric}
                  isSelected={selectedItems.some((i) => i.id === metric.id)}
                  onClick={() =>
                    addItem({
                      type: "Metric",
                      id: metric.id,
                      title: metric.label,
                      current: metric.current,
                      projected: metric.projected,
                      aiDetail: metric.aiDetail,
                    })
                  }
                />
              ))}
            </div>
          </div>

          {/* P&L Table */}
          <div>
            <h2 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Projected P&L Impact
            </h2>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <th className="text-left px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase">
                      Line Item
                    </th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase">
                      Current
                    </th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase">
                      Projected
                    </th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plTable.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() =>
                        addItem({
                          type: "P&L Line Item",
                          id: row.id,
                          title: row.lineItem,
                          current: row.current,
                          projected: row.projected,
                          aiDetail: row.aiDetail,
                        })
                      }
                      className={cn(
                        "border-b border-border/30 cursor-pointer transition-colors hover:bg-muted/20",
                        selectedItems.some((i) => i.id === row.id) && "bg-muted/30"
                      )}
                    >
                      <td className="px-4 py-2.5 text-xs font-medium">
                        {highlightFinanceTerms(row.lineItem)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono text-right">
                        {row.current}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-mono font-semibold text-right">
                        {row.projected}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2.5 text-xs font-mono font-medium text-right",
                          row.positive ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {row.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk Assessment */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Risk Assessment
              </h2>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  riskAssessment.overallLevel === "Low" &&
                    "border-emerald-500/30 text-emerald-400",
                  riskAssessment.overallLevel === "Medium" &&
                    "border-amber-500/30 text-amber-400",
                  riskAssessment.overallLevel === "High" &&
                    "border-rose-500/30 text-rose-400"
                )}
              >
                {riskAssessment.overallLevel} Overall Risk
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {riskAssessment.items.map((risk) => (
                <RiskCard
                  key={risk.id}
                  risk={risk}
                  isSelected={selectedItems.some((i) => i.id === risk.id)}
                  onClick={() =>
                    addItem({
                      type: "Risk Factor",
                      id: risk.id,
                      title: risk.title,
                      aiDetail: risk.aiDetail,
                      severity: risk.severity,
                    })
                  }
                />
              ))}
            </div>
          </div>

          {/* Implementation Roadmap */}
          <div className="pb-8">
            <h2 className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">
              Implementation Roadmap
            </h2>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-5 left-0 right-0 h-px bg-border/50" />

              <div className="grid grid-cols-4 gap-4">
                {roadmap.map((milestone, i) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    index={i}
                    isSelected={selectedItems.some(
                      (item) => item.id === milestone.id
                    )}
                    onClick={() =>
                      addItem({
                        type: "Milestone",
                        id: milestone.id,
                        title: `${milestone.month}: ${milestone.title}`,
                        aiDetail: milestone.aiDetail,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div
        className={cn(
          "shrink-0 transition-all duration-200",
          selectedItems.length > 0 ? "w-80" : "w-0"
        )}
      >
        {selectedItems.length > 0 && (
          <ReportDetailPanel items={selectedItems} onDismiss={dismissItem} />
        )}
      </div>
    </div>
  );
}

// ── Metric Card ────────────────────────────────────────────────

function MetricCard({
  metric,
  isSelected,
  onClick,
}: {
  metric: ReportMetric;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg border border-border/50 bg-card/50 p-3 cursor-pointer transition-all hover:bg-muted/20 hover:border-border",
        isSelected && "ring-1 ring-primary/50 bg-muted/30"
      )}
    >
      <p className="text-[10px] text-muted-foreground mb-1">{metric.label}</p>
      <p className="text-lg font-bold font-mono">{metric.projected}</p>
      <div className="flex items-center gap-1 mt-1">
        {metric.positive ? (
          <TrendingUp className="h-3 w-3 text-emerald-400" />
        ) : (
          <TrendingDown className="h-3 w-3 text-rose-400" />
        )}
        <span
          className={cn(
            "text-[10px] font-medium",
            metric.positive ? "text-emerald-400" : "text-rose-400"
          )}
        >
          {metric.delta}
        </span>
      </div>
    </div>
  );
}

// ── Risk Card ──────────────────────────────────────────────────

function RiskCard({
  risk,
  isSelected,
  onClick,
}: {
  risk: RiskItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg border border-border/50 bg-card/50 p-3 cursor-pointer transition-all hover:bg-muted/20 hover:border-border",
        isSelected && "ring-1 ring-primary/50 bg-muted/30"
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold">{risk.title}</p>
        <Badge
          variant="outline"
          className={cn(
            "text-[9px]",
            risk.severity === "Low" && "border-emerald-500/30 text-emerald-400",
            risk.severity === "Medium" && "border-amber-500/30 text-amber-400",
            risk.severity === "High" && "border-rose-500/30 text-rose-400"
          )}
        >
          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
          {risk.severity}
        </Badge>
      </div>
      <p className="text-[11px] text-muted-foreground line-clamp-2">
        {highlightFinanceTerms(risk.description)}
      </p>
    </div>
  );
}

// ── Milestone Card ─────────────────────────────────────────────

function MilestoneCard({
  milestone,
  index,
  isSelected,
  onClick,
}: {
  milestone: Milestone;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer transition-all",
        isSelected && "scale-[1.02]"
      )}
    >
      {/* Timeline dot */}
      <div className="flex justify-center mb-3">
        <div
          className={cn(
            "h-3 w-3 rounded-full border-2 z-10",
            isSelected
              ? "bg-primary border-primary"
              : "bg-card border-border"
          )}
        />
      </div>

      <div
        className={cn(
          "rounded-lg border border-border/50 bg-card/50 p-3 hover:bg-muted/20 hover:border-border transition-all",
          isSelected && "ring-1 ring-primary/50 bg-muted/30"
        )}
      >
        <p className="text-[10px] font-medium text-muted-foreground mb-1">
          {milestone.month}
        </p>
        <p className="text-xs font-semibold mb-1 line-clamp-1">
          {milestone.title}
        </p>
        <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">
          {milestone.description}
        </p>
        <Badge variant="secondary" className="text-[9px]">
          {milestone.impactMetric}
        </Badge>
      </div>
    </div>
  );
}
