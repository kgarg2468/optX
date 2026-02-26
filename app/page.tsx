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
          <Card key={stat.label} className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${stat.color.replace('text-', 'from-').replace('100', '10')}`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {stat.label}
              </CardTitle>
              <div className="rounded-full bg-white/5 p-2 transition-transform duration-300 group-hover:scale-110">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold mb-4 tracking-tight">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="group cursor-pointer transition-all duration-300 hover:bg-accent/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] hover:border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-accent/0 via-accent/0 to-white/5 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <CardContent className="flex items-start gap-4 pt-6 relative z-10">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent shadow-inner transition-transform duration-300 group-hover:scale-105 group-hover:bg-white/10">
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground/90 group-hover:text-foreground transition-colors">{action.label}</h4>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
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
                className="group flex items-center gap-4 rounded-xl p-3 transition-all duration-300 hover:bg-accent/40 border border-transparent hover:border-white/5 hover:shadow-lg"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-xs font-medium text-muted-foreground transition-colors group-hover:border-white/20 group-hover:text-white group-hover:bg-white/5">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">{item.step}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" />
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
