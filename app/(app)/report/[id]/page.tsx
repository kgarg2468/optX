"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Pin,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LUMINA_REPORT_ROWS } from "@/lib/seed/lumina-seed";
import { generateMockReport } from "@/lib/mock/report-data";
import type { ReportMetric, RiskItem, Milestone, MockReportData } from "@/lib/mock/report-data";
import { highlightFinanceTerms } from "@/components/ui/finance-term";
import {
  ReportDetailPanel,
  type ReportDetailItem,
} from "@/components/report/ReportDetailPanel";
import { useProjectStore } from "@/lib/store/project-store";

const CHART_COLORS = [
  "border-l-emerald-400",
  "border-l-lime-400",
  "border-l-amber-400",
  "border-l-sky-400",
  "border-l-rose-400",
];

export default function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { activeProjectId } = useProjectStore();
  const [report, setReport] = useState<MockReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load report data
  useEffect(() => {
    setIsLoading(true);

    // Check Lumina seed data first (instant)
    const luminaReport = LUMINA_REPORT_ROWS.find((r) => r.id === id);
    if (luminaReport && luminaReport.scenario_detail) {
      // Use the mock report generator for rich UI data
      const mockReport = generateMockReport(luminaReport.scenario_detail as Parameters<typeof generateMockReport>[0], id);
      setReport(mockReport);
      setIsLoading(false);
      return;
    }

    // Fetch from API
    fetch(`/api/dashboard/report?reportId=${id}`)
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success && payload.data) {
          const data = payload.data;
          // Build a MockReportData-compatible object from API data
          const narrative = data.narrative || {};
          const sd = data.scenario_detail;
          const mockReport: MockReportData = {
            id: data.id,
            header: {
              title: sd?.title || "Simulation Report",
              businessName: "Report",
              date: new Date(data.created_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              tag: sd?.tag || "AI Generated",
              confidence: sd?.confidence || 80,
            },
            metrics: (sd?.keyMetrics || []).map((m: { label: string; value: string; delta: string; positive: boolean }, i: number) => ({
              id: `m-${i}`,
              label: m.label,
              current: "—",
              projected: m.value,
              delta: m.delta,
              positive: m.positive,
              aiDetail: `${m.label} projected at ${m.value} (${m.delta} change).`,
            })),
            plTable: [],
            riskAssessment: {
              overallLevel: sd?.riskLevel || "Medium",
              confidenceScore: sd?.confidence || 80,
              items: (data.financial?.riskMatrix || []).map((r: { risk: string; mitigation: string; likelihood: number }, i: number) => ({
                id: `risk-${i}`,
                title: r.risk,
                severity: r.likelihood >= 4 ? "High" : r.likelihood >= 3 ? "Medium" : "Low",
                description: r.mitigation,
                aiDetail: r.mitigation,
              })),
            },
            roadmap: (narrative.recommendations || []).map((rec: string, i: number) => ({
              id: `road-${i}`,
              month: `Month ${i + 1}`,
              title: rec.slice(0, 60) + (rec.length > 60 ? "..." : ""),
              description: rec,
              impactMetric: sd?.revenueImpact || "TBD",
              aiDetail: rec,
            })),
          };
          setReport(mockReport);
        }
      })
      .catch(() => { })
      .finally(() => setIsLoading(false));
  }, [id]);

  const [analysisItems, setAnalysisItems] = useState<ReportDetailItem[]>([]);
  const [pinnedItems, setPinnedItems] = useState<ReportDetailItem[]>([]);

  const toggleAnalysisItem = useCallback((item: ReportDetailItem) => {
    setAnalysisItems((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item]
    );
  }, []);

  const dismissAnalysisItem = useCallback((itemId: string) => {
    setAnalysisItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const pinItem = useCallback((item: ReportDetailItem) => {
    setPinnedItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const unpinItem = useCallback((itemId: string) => {
    setPinnedItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Report not found</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/simulate")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Simulation
        </Button>
      </div>
    );
  }

  const { header, metrics, plTable, riskAssessment, roadmap } = report;
  const isPanelOpen = analysisItems.length > 0 || pinnedItems.length > 0;

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
              onClick={() => router.push("/dashboard/simulate")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Exploration
            </Button>

            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h1 className="font-playfair text-3xl font-medium tracking-tight">
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
                  isPreviewed={analysisItems.some((i) => i.id === metric.id)}
                  isPinned={pinnedItems.some((i) => i.id === metric.id)}
                  onClick={() =>
                    toggleAnalysisItem({
                      type: "Metric",
                      id: metric.id,
                      title: metric.label,
                      current: metric.current,
                      projected: metric.projected,
                      aiDetail: metric.aiDetail,
                    })
                  }
                  onPin={() =>
                    pinItem({
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
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {plTable.map((row) => {
                    const isPreviewed = analysisItems.some((i) => i.id === row.id);
                    const isPinned = pinnedItems.some((i) => i.id === row.id);

                    return (
                      <tr
                        key={row.id}
                        onClick={() =>
                          toggleAnalysisItem({
                            type: "P&L Line Item",
                            id: row.id,
                            title: row.lineItem,
                            current: row.current,
                            projected: row.projected,
                            aiDetail: row.aiDetail,
                          })
                        }
                        className={cn(
                          "group border-b border-border/30 transition-colors hover:bg-white/[0.04] cursor-pointer",
                          isPreviewed && "bg-white/[0.06]",
                          isPinned && "bg-amber-500/5 group-hover:bg-amber-500/10"
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
                        <td className="pr-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              pinItem({
                                type: "P&L Line Item",
                                id: row.id,
                                title: row.lineItem,
                                current: row.current,
                                projected: row.projected,
                                aiDetail: row.aiDetail,
                              });
                            }}
                            className={cn(
                              "h-6 w-6 flex items-center justify-center rounded-full transition-all",
                              isPinned
                                ? "text-amber-400 bg-amber-500/20 opacity-100"
                                : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground hover:bg-white/[0.1]"
                            )}
                            title="Pin to Context"
                          >
                            <Pin className={cn("h-3 w-3", isPinned && "fill-amber-400")} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
                  isPreviewed={analysisItems.some((i) => i.id === risk.id)}
                  isPinned={pinnedItems.some((i) => i.id === risk.id)}
                  onClick={() =>
                    toggleAnalysisItem({
                      type: "Risk Factor",
                      id: risk.id,
                      title: risk.title,
                      aiDetail: risk.aiDetail,
                      severity: risk.severity,
                    })
                  }
                  onPin={() =>
                    pinItem({
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

          {/* Implementation Roadmap — Vertical Timeline */}
          <div className="pb-8">
            <h2 className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">
              Implementation Roadmap
            </h2>
            <div className="relative pl-8">
              {/* Gradient line */}
              <div className="absolute left-[11px] top-0 bottom-0 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent" />

              <div className="space-y-4">
                {roadmap.map((milestone, i) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    index={i}
                    isPreviewed={analysisItems.some((i) => i.id === milestone.id)}
                    isPinned={pinnedItems.some((item) => item.id === milestone.id)}
                    onClick={() =>
                      toggleAnalysisItem({
                        type: "Milestone",
                        id: milestone.id,
                        title: `${milestone.month}: ${milestone.title}`,
                        aiDetail: milestone.aiDetail,
                      })
                    }
                    onPin={() =>
                      pinItem({
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
          "shrink-0 transition-all duration-300",
          isPanelOpen ? "w-[340px]" : "w-0"
        )}
      >
        {isPanelOpen && (
          <ReportDetailPanel
            analysisItems={analysisItems}
            pinnedItems={pinnedItems}
            onDismissAnalysis={dismissAnalysisItem}
            onDismissPinned={unpinItem}
            onPinAnalysis={pinItem}
          />
        )}
      </div>
    </div>
  );
}

// ── Metric Card ────────────────────────────────────────────────

function MetricCard({
  metric,
  isPreviewed,
  isPinned,
  onClick,
  onPin,
}: {
  metric: ReportMetric;
  isPreviewed: boolean;
  isPinned: boolean;
  onClick: () => void;
  onPin: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative glass-card rounded-xl p-3 transition-all cursor-pointer hover:bg-white/[0.08]",
        isPreviewed && "bg-white/[0.08] ring-1 ring-white/20",
        isPinned && "ring-1 ring-amber-500/50 bg-amber-500/5"
      )}
    >
      {/* Pin button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPin();
        }}
        className={cn(
          "absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-full transition-all border",
          isPinned
            ? "bg-amber-500/20 border-amber-500/30 text-amber-400 opacity-100"
            : "opacity-0 group-hover:opacity-100 bg-white/[0.03] border-white/10 text-muted-foreground hover:bg-white/[0.1] hover:text-foreground"
        )}
        title="Pin to Context"
      >
        <Pin className={cn("h-3 w-3", isPinned && "fill-amber-400")} />
      </button>

      <p className="text-[10px] text-muted-foreground mb-1 pr-6">{metric.label}</p>
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
  isPreviewed,
  isPinned,
  onClick,
  onPin,
}: {
  risk: RiskItem;
  isPreviewed: boolean;
  isPinned: boolean;
  onClick: () => void;
  onPin: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative glass-card rounded-xl p-3 transition-all cursor-pointer hover:bg-white/[0.08]",
        isPreviewed && "bg-white/[0.08] ring-1 ring-white/20",
        isPinned && "ring-1 ring-amber-500/50 bg-amber-500/5"
      )}
    >
      {/* Pin button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPin();
        }}
        className={cn(
          "absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-full transition-all border",
          isPinned
            ? "bg-amber-500/20 border-amber-500/30 text-amber-400 opacity-100"
            : "opacity-0 group-hover:opacity-100 bg-white/[0.03] border-white/10 text-muted-foreground hover:bg-white/[0.1] hover:text-foreground"
        )}
        title="Pin to Context"
      >
        <Pin className={cn("h-3 w-3", isPinned && "fill-amber-400")} />
      </button>

      <div className="flex items-center justify-between mb-1.5 pr-8">
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
      <p className="text-[11px] text-muted-foreground line-clamp-2 pr-2">
        {highlightFinanceTerms(risk.description)}
      </p>
    </div>
  );
}

// ── Milestone Card — Vertical Timeline ──────────────────────────

function MilestoneCard({
  milestone,
  index,
  isPreviewed,
  isPinned,
  onClick,
  onPin,
}: {
  milestone: Milestone;
  index: number;
  isPreviewed: boolean;
  isPinned: boolean;
  onClick: () => void;
  onPin: () => void;
}) {
  const colorIndex = index % CHART_COLORS.length;

  return (
    <div className="relative group">
      {/* Timeline dot */}
      <div
        className={cn(
          "absolute -left-[21px] top-4 h-3 w-3 rounded-full border-2 z-10 transition-all",
          isPreviewed || isPinned
            ? "bg-primary border-primary shadow-[0_0_12px_rgba(255,255,255,0.2)]"
            : "bg-card border-border"
        )}
      />

      {/* Card */}
      <div
        onClick={onClick}
        className={cn(
          "glass-card rounded-xl p-4 transition-all hover:bg-white/[0.08] border-l-[3px] cursor-pointer",
          CHART_COLORS[colorIndex],
          isPreviewed && "bg-white/[0.08] ring-1 ring-white/20",
          isPinned && "ring-1 ring-amber-500/50 bg-amber-500/5"
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <Badge variant="secondary" className="text-[9px]">
            {milestone.month}
          </Badge>
          {/* Pin button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            className={cn(
              "h-6 w-6 flex items-center justify-center rounded-full transition-all border",
              isPinned
                ? "bg-amber-500/20 border-amber-500/30 text-amber-400 opacity-100"
                : "opacity-0 group-hover:opacity-100 bg-white/[0.03] border-white/10 text-muted-foreground hover:bg-white/[0.1] hover:text-foreground"
            )}
            title="Pin to Context"
          >
            <Pin className={cn("h-3 w-3", isPinned && "fill-amber-400")} />
          </button>
        </div>
        <p className="text-sm font-semibold mb-1.5">{milestone.title}</p>
        <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
          {milestone.description}
        </p>
        <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30">
          {milestone.impactMetric}
        </Badge>
      </div>
    </div>
  );
}
