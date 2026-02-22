import {
  DollarSign,
  TrendingUp,
  Star,
  Settings,
  GitBranch,
  BarChart,
  type LucideIcon,
} from "lucide-react";
import type { GraphNodeType } from "@/lib/types";

export interface NodeTypeConfig {
  label: string;
  description: string;
  icon: LucideIcon;
  color: string; // Tailwind border/bg class suffix
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export const NODE_CONFIGS: Record<GraphNodeType, NodeTypeConfig> = {
  financial: {
    label: "Financial",
    description: "Revenue, costs, margins",
    icon: DollarSign,
    color: "chart-2",
    bgClass: "bg-chart-2/10",
    borderClass: "border-chart-2",
    textClass: "text-chart-2",
  },
  market: {
    label: "Market",
    description: "Demand, pricing, competition",
    icon: TrendingUp,
    color: "chart-1",
    bgClass: "bg-chart-1/10",
    borderClass: "border-chart-1",
    textClass: "text-chart-1",
  },
  brand: {
    label: "Brand",
    description: "Perception, loyalty, awareness",
    icon: Star,
    color: "chart-4",
    bgClass: "bg-chart-4/10",
    borderClass: "border-chart-4",
    textClass: "text-chart-4",
  },
  operations: {
    label: "Operations",
    description: "Supply chain, staffing, capacity",
    icon: Settings,
    color: "chart-5",
    bgClass: "bg-chart-5/10",
    borderClass: "border-chart-5",
    textClass: "text-chart-5",
  },
  logic: {
    label: "Logic",
    description: "Conditions, thresholds, rules",
    icon: GitBranch,
    color: "muted-foreground",
    bgClass: "bg-muted/50",
    borderClass: "border-muted-foreground",
    textClass: "text-muted-foreground",
  },
  metric: {
    label: "Metric",
    description: "KPIs, outputs, targets",
    icon: BarChart,
    color: "chart-3",
    bgClass: "bg-chart-3/10",
    borderClass: "border-chart-3",
    textClass: "text-chart-3",
  },
};

export const NODE_TYPE_LIST = Object.entries(NODE_CONFIGS).map(
  ([type, config]) => ({
    type: type as GraphNodeType,
    ...config,
  })
);
