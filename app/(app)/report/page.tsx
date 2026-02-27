"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Clock, ArrowRight, FolderKanban, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/lib/store/project-store";
import Link from "next/link";

interface ReportListItem {
  id: string;
  scenario_detail?: {
    title: string;
    tag: string;
    confidence: number;
    riskLevel: string;
    revenueImpact: string;
  };
  narrative?: {
    executiveSummary: string;
    keyFindings: string[];
  };
  created_at?: string;
  business_id: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const { activeProjectId, projects } = useProjectStore();
  const activeProject = activeProjectId
    ? projects.find((p) => p.id === activeProjectId)
    : null;
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load reports when active project changes
  useEffect(() => {
    if (!activeProjectId) {
      setReports([]);
      return;
    }

    setIsLoading(true);
    fetch(`/api/report?businessId=${activeProjectId}`)
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success && Array.isArray(payload.data)) {
          setReports(payload.data);
        }
      })
      .catch(() => { })
      .finally(() => setIsLoading(false));
  }, [activeProjectId]);

  // No project selected
  if (!activeProjectId || !activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-playfair text-3xl font-medium tracking-tight">Reports</h2>
          <p className="text-muted-foreground mt-1">
            View AI-generated financial reports from your simulations.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05] mb-3">
              <FolderKanban className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No Project Selected</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Select a project to view its reports.
            </p>
            <Link href="/data" className="mt-4">
              <Button className="bg-lime-400 text-forest-950 hover:bg-lime-300">
                Go to Projects
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-playfair text-3xl font-medium tracking-tight">Reports</h2>
        <p className="text-muted-foreground mt-1">
          AI-generated financial reports for{" "}
          <span className="text-foreground font-medium">{activeProject.name}</span>
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent mb-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No Reports Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Reports are generated from simulations. Go to the simulation page,
              explore a scenario, and click &quot;Generate Report&quot;.
            </p>
            <Link href="/simulate" className="mt-4">
              <Button variant="outline">Go to Simulation</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => {
            const sd = report.scenario_detail;
            const confidence = sd?.confidence ?? 80;
            const title = sd?.title ?? "Simulation Report";
            const tag = sd?.tag ?? "Report";

            return (
              <div
                key={report.id}
                className={cn(
                  "group glass-card card-hover rounded-xl p-5 cursor-pointer"
                )}
                onClick={() => router.push(`/report/${report.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.03] border border-white/8">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px]",
                      confidence >= 85
                        ? "border-emerald-500/30 text-emerald-400"
                        : confidence >= 70
                          ? "border-amber-500/30 text-amber-400"
                          : "border-rose-500/30 text-rose-400"
                    )}
                  >
                    {confidence}%
                  </Badge>
                </div>

                <h3 className="text-sm font-semibold mb-1 line-clamp-1">
                  {title}
                </h3>
                <p className="text-[11px] text-muted-foreground mb-3">
                  {activeProject.name} &middot; {tag}
                </p>

                {/* Key findings preview */}
                {report.narrative?.keyFindings?.length ? (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {report.narrative.keyFindings.slice(0, 2).map((f, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono text-muted-foreground bg-muted/30 rounded px-1.5 py-0.5 line-clamp-1"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                ) : null}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 p-0 text-muted-foreground group-hover:text-foreground"
                >
                  View Report
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
