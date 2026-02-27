"use client";

import { Star, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { highlightFinanceTerms } from "@/components/ui/finance-term";
import type { MockScenarioCard } from "@/lib/mock/simulation-scenarios";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
} from "recharts";

interface ScenarioCardProps {
  scenario: MockScenarioCard;
  onExplore: (id: string) => void;
}

export function ScenarioCard({ scenario, onExplore }: ScenarioCardProps) {
  const {
    id,
    title,
    tag,
    description,
    recommended,
    confidence,
    keyMetrics,
    sparkline,
    timeToImpact,
    riskLevel,
  } = scenario;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl",
        recommended
          ? "border-emerald-500/40 shadow-emerald-500/10 shadow-lg"
          : "border-border/50 hover:border-border"
      )}
    >
      {/* Recommended glow */}
      {recommended && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-1">
          <Badge
            variant={recommended ? "default" : "secondary"}
            className={cn(
              "text-[10px] font-medium",
              recommended && "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
            )}
          >
            {recommended && <Star className="h-3 w-3 mr-1 fill-current" />}
            {tag}
          </Badge>
          <span className="text-[10px] text-muted-foreground">{timeToImpact}</span>
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-xs line-clamp-2">
          {highlightFinanceTerms(description)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-2">
          {keyMetrics.map((metric) => (
            <div key={metric.label} className="rounded-lg bg-muted/50 p-2 text-center">
              <p className="text-[10px] text-muted-foreground mb-0.5">{metric.label}</p>
              <p className="text-sm font-semibold">{metric.value}</p>
              <p
                className={cn(
                  "text-[10px] font-medium",
                  metric.positive ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {metric.delta}
              </p>
            </div>
          ))}
        </div>

        {/* Sparkline */}
        <div className="h-12 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline}>
              <YAxis domain={["dataMin - 10", "dataMax + 10"]} hide />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={recommended ? "hsl(160, 60%, 45%)" : "hsl(var(--muted-foreground))"}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence + Risk */}
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">Confidence</span>
              <span className="text-[10px] font-medium">{confidence}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  confidence >= 90
                    ? "bg-emerald-500"
                    : confidence >= 75
                      ? "bg-amber-500"
                      : "bg-rose-500"
                )}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              riskLevel === "Low" && "border-emerald-500/30 text-emerald-400",
              riskLevel === "Medium" && "border-amber-500/30 text-amber-400",
              riskLevel === "High" && "border-rose-500/30 text-rose-400"
            )}
          >
            {riskLevel} Risk
          </Badge>
        </div>

        {/* Explore Button */}
        <Button
          onClick={() => onExplore(id)}
          className={cn(
            "w-full",
            recommended
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "variant-outline"
          )}
          variant={recommended ? "default" : "outline"}
        >
          Explore Scenario
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
