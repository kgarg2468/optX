"use client";

import { use } from "react";
import { ArrowLeft, Download, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/report">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Simulation Report
            </h2>
            <p className="text-muted-foreground text-sm">Report ID: {id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat with Report
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="financial">
        <TabsList>
          <TabsTrigger value="financial">Financial Report</TabsTrigger>
          <TabsTrigger value="narrative">AI Narrative</TabsTrigger>
          <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
        </TabsList>
        <TabsContent value="financial" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <h3 className="font-semibold mb-1">Financial Report</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                P&L projections, cash flow forecasts, risk matrices, sensitivity
                tables, and scenario comparisons will be displayed here with
                interactive charts.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="narrative" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <h3 className="font-semibold mb-1">AI Narrative Report</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Claude-generated consultant-style writeup with executive summary,
                key findings, risk assessment, and recommendations.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="accuracy" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <h3 className="font-semibold mb-1">Backtesting & Accuracy</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Walk-forward validation results, Brier scores, calibration plots,
                and ensemble disagreement metrics.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
