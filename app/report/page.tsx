"use client";

import { FileText, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground mt-1">
          View AI-generated financial reports from your simulations.
        </p>
      </div>

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
    </div>
  );
}
