"use client";

import Link from "next/link";
import {
  Database,
  Play,
  FileText,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const quickActions = [
  {
    href: "/data",
    label: "Add Business Data",
    description: "Upload financial data or fill in the guided form",
    icon: Database,
    color: "text-chart-1",
  },
  {
    href: "/simulate",
    label: "Run Simulation",
    description: "Run Monte Carlo simulations on your data",
    icon: Play,
    color: "text-chart-2",
  },
  {
    href: "/report",
    label: "View Reports",
    description: "See AI-generated financial reports",
    icon: FileText,
    color: "text-chart-3",
  },
];

const stats = [
  {
    label: "Data Sources",
    value: "0",
    description: "No data uploaded yet",
    icon: Database,
    color: "text-chart-1",
  },
  {
    label: "Simulations",
    value: "0",
    description: "Run your first simulation",
    icon: BarChart3,
    color: "text-chart-2",
  },
  {
    label: "Scenarios",
    value: "0",
    description: "Create what-if scenarios",
    icon: TrendingUp,
    color: "text-chart-4",
  },
  {
    label: "Risk Alerts",
    value: "0",
    description: "No alerts",
    icon: AlertTriangle,
    color: "text-chart-5",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome to OptX
        </h2>
        <p className="text-muted-foreground mt-1">
          AI-powered business simulation and optimization. Get started by adding
          your business data.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="group cursor-pointer transition-colors hover:bg-accent/50">
                <CardContent className="flex items-start gap-4 pt-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{action.label}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting Started Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Getting Started</CardTitle>
          <CardDescription className="text-sm text-white">
            Complete these steps to run your first AI-powered simulation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">0 / 4</span>
            </div>
            <Progress value={0} />
          </div>
          <div className="space-y-3">
            {[
              {
                step: "Add your business data",
                description: "Upload financials or use the guided form",
                href: "/data",
              },
              {
                step: "Configure simulation",
                description: "Set parameters and time horizon",
                href: "/simulate",
              },
              {
                step: "Run your first simulation",
                description: "AI agents analyze your business",
                href: "/simulate",
              },
              {
                step: "Review results",
                description: "Interactive report with AI insights",
                href: "/report",
              },
            ].map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs text-muted-foreground">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.step}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity - empty state */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Simulations</CardTitle>
              <CardDescription>
                Your simulation history will appear here
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/simulate">
                <Plus className="mr-2 h-3 w-3" />
                New Simulation
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent mb-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No simulations yet. Add your business data to get started.
            </p>
            <Button variant="link" size="sm" className="mt-2" asChild>
              <Link href="/data">Add data to begin</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
