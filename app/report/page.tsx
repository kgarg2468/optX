"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { REPORT_STORE, type MockReportData } from "@/lib/mock/report-data";

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<MockReportData[]>([]);

  useEffect(() => {
    setReports(Array.from(REPORT_STORE.values()));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-playfair text-3xl font-medium tracking-tight">Reports</h2>
        <p className="text-muted-foreground mt-1">
          View AI-generated financial reports from your simulations.
        </p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent mb-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No Reports Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Reports are generated after running simulations. Add your business
              data and run a simulation to see your first report.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
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
                    report.header.confidence >= 85
                      ? "border-emerald-500/30 text-emerald-400"
                      : report.header.confidence >= 70
                        ? "border-amber-500/30 text-amber-400"
                        : "border-rose-500/30 text-rose-400"
                  )}
                >
                  {report.header.confidence}%
                </Badge>
              </div>

              <h3 className="text-sm font-semibold mb-1 line-clamp-1">
                {report.header.title}
              </h3>
              <p className="text-[11px] text-muted-foreground mb-3">
                {report.header.businessName} &middot; {report.header.date}
              </p>

              {/* Key metrics preview */}
              <div className="flex flex-wrap gap-2 mb-4">
                {report.metrics.slice(0, 3).map((m) => (
                  <span
                    key={m.id}
                    className="text-[10px] font-mono text-muted-foreground bg-muted/30 rounded px-1.5 py-0.5"
                  >
                    {m.label}: {m.projected}
                  </span>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 p-0 text-muted-foreground group-hover:text-foreground"
              >
                View Report
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
