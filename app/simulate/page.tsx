"use client";

import { useEffect, useState } from "react";
import {
  Play,
  Wand2,
  Network,
  Plus,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useScenarioStore } from "@/lib/store/scenario-store";
import { useSimulationStore } from "@/lib/store/simulation-store";
import { useProjectStore } from "@/lib/store/project-store";
import { ScenarioWizard } from "@/components/wizard/ScenarioWizard";
import { ProjectListView } from "@/components/projects/ProjectListView";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import type { SimulationStatus } from "@/lib/types";
import {
  formatCompact,
  formatCurrency,
  formatPercent,
  formatVarName,
} from "@/lib/utils/format";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type UnknownRecord = Record<string, unknown>;

type DisplayProjectionPoint = {
  month: string;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
};

type DisplayMonteCarlo = {
  variable: string;
  mean: number;
  median: number;
  std: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  distribution: number[];
  timeSeriesProjection: DisplayProjectionPoint[];
};

type DisplaySensitivity = {
  variable: string;
  sobolIndex: number;
  totalSobolIndex: number;
  morrisScreening: number;
  rank: number;
};

type DisplayBayesianEdge = {
  from: string;
  to: string;
  strength: number;
  description: string;
};

type DisplayBacktestPoint = {
  period: string;
  predicted: number;
  actual: number;
  p5: number;
  p95: number;
};

type DisplayBacktest = {
  accuracy: number;
  brierScore: number;
  ensembleDisagreement: number;
  walkForwardResults: DisplayBacktestPoint[];
};

type ExecutiveSparkPoint = {
  month: string;
  baseline: number;
};

type DisplayAgentFinding = {
  summary: string;
  confidence: number;
  details: string;
};

type DisplayDebateCritique = {
  fromAgent: string;
  toAgent: string;
  critique: string;
  response: string;
};

type DisplayDebateRound = {
  round: number;
  critiques: DisplayDebateCritique[];
};

type DisplayAgentAnalysis = {
  recommendations: string[];
  convergenceScore: number;
  unifiedFindings: DisplayAgentFinding[];
  debateRounds: DisplayDebateRound[];
};

type ExecutiveSummaryProps = {
  headline: string;
  expectedMonth12Revenue: number;
  primaryRiskDriver: DisplaySensitivity | null;
  modelAccuracy: number;
  aggregateProjection: ExecutiveSparkPoint[];
};

function ExecutiveSimulationSummary({
  headline,
  expectedMonth12Revenue,
  primaryRiskDriver,
  modelAccuracy,
  aggregateProjection,
}: ExecutiveSummaryProps) {
  const accuracyTone = getAccuracyTone(modelAccuracy);

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Auto-Generated Simulation Summary</CardTitle>
        <CardDescription>{headline}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">
                Expected Month 12 Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {formatCurrency(expectedMonth12Revenue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">
                Primary Risk Driver
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {primaryRiskDriver ? formatVarName(primaryRiskDriver.variable) : "N/A"}
              </p>
              {primaryRiskDriver ? (
                <p className="text-xs text-muted-foreground">
                  Sobol: {formatDecimal(primaryRiskDriver.totalSobolIndex, 3)}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">
                Model Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-semibold">{formatPercent(modelAccuracy)}</p>
              <Badge className={accuracyTone}>
                {getAccuracyTier(modelAccuracy) === "high"
                  ? "High"
                  : getAccuracyTier(modelAccuracy) === "moderate"
                    ? "Moderate"
                    : "Low"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-md border border-border/70 bg-card p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Aggregate Baseline Projection
          </p>
          {aggregateProjection.length > 0 ? (
            <div className="h-20 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aggregateProjection}>
                  <Tooltip
                    formatter={(value) => [formatCurrency(toNumber(value)), "Baseline"]}
                    labelFormatter={(label) => toStringValue(label)}
                  />
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Projection data unavailable.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_PROGRESS_FALLBACK: Record<SimulationStatus, number> = {
  idle: 0,
  preparing: 10,
  running_monte_carlo: 28,
  running_bayesian: 45,
  running_sensitivity: 62,
  running_backtest: 78,
  running_agents: 92,
  complete: 100,
  error: 100,
};

const STATUS_LABELS: Record<SimulationStatus, string> = {
  idle: "Idle",
  preparing: "Preparing",
  running_monte_carlo: "Running Monte Carlo",
  running_bayesian: "Running Bayesian Network",
  running_sensitivity: "Running Sensitivity Analysis",
  running_backtest: "Running Backtest",
  running_agents: "Running Agent Analysis",
  complete: "Complete",
  error: "Error",
};

function asRecord(value: unknown): UnknownRecord {
  return (value && typeof value === "object" ? value : {}) as UnknownRecord;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toStringValue(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function toNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toNumber(item, Number.NaN))
    .filter((item) => Number.isFinite(item));
}

function getHistogramBins(values: number[], binCount = 18): { bin: string; count: number }[] {
  if (!values.length) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];

  if (min === max) {
    return [{ bin: min.toFixed(2), count: values.length }];
  }

  const width = (max - min) / binCount;
  const counts = new Array(binCount).fill(0);

  values.forEach((value) => {
    const raw = Math.floor((value - min) / width);
    const idx = Math.min(binCount - 1, Math.max(0, raw));
    counts[idx] += 1;
  });

  return counts.map((count, idx) => {
    const start = min + idx * width;
    const end = start + width;
    return {
      bin: `${formatCompact(start)}-${formatCompact(end)}`,
      count,
    };
  });
}

function formatDecimal(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "0.00";
}

function getProjectionPoints(input: unknown): DisplayProjectionPoint[] {
  if (!Array.isArray(input)) return [];

  return input.map((item, index) => {
    const point = asRecord(item);
    const monthNum = Math.max(1, Math.trunc(toNumber(point.month, index + 1)));
    const p50 = toNumber(point.p50 ?? point.median);
    const p5Raw = toNumber(point.p5, p50);
    const p95Raw = toNumber(point.p95, p50);
    const p25Raw = toNumber(point.p25, p50);
    const p75Raw = toNumber(point.p75, p50);

    return {
      month: `Month ${monthNum}`,
      p5: Math.min(p5Raw, p95Raw),
      p25: Math.min(p25Raw, p75Raw),
      p50,
      p75: Math.max(p25Raw, p75Raw),
      p95: Math.max(p5Raw, p95Raw),
    };
  });
}

function getVariablePolarity(variable: string): "revenue" | "expense" | "other" {
  const name = variable.toLowerCase();
  if (
    name.includes("revenue") ||
    name.includes("sales") ||
    name.includes("income")
  ) {
    return "revenue";
  }
  if (
    name.includes("expense") ||
    name.includes("cost") ||
    name.includes("rent") ||
    name.includes("debt") ||
    name.includes("payroll") ||
    name.includes("salary")
  ) {
    return "expense";
  }
  return "other";
}

function getMetricToneClasses(
  variable: string,
  value: number
): { card: string; value: string } {
  const polarity = getVariablePolarity(variable);
  if (polarity === "other") {
    return {
      card: "border-border bg-card",
      value: "text-foreground",
    };
  }

  const favorable =
    (polarity === "revenue" && value >= 0) ||
    (polarity === "expense" && value < 0);

  if (favorable) {
    return {
      card: "border-emerald-300/60 bg-emerald-50/50 dark:border-emerald-800/40 dark:bg-emerald-950/20",
      value: "text-emerald-700 dark:text-emerald-300",
    };
  }

  return {
    card: "border-rose-300/60 bg-rose-50/50 dark:border-rose-800/40 dark:bg-rose-950/20",
    value: "text-rose-700 dark:text-rose-300",
  };
}

function toImpactColor(value: number, maxValue: number): string {
  if (!Number.isFinite(value) || maxValue <= 0) return "hsl(8 65% 45%)";
  const ratio = Math.max(0, Math.min(1, Math.abs(value) / maxValue));
  const hue = 8 + ratio * 132; // red -> green
  return `hsl(${hue} 72% 42%)`;
}

function formatStrengthPercent(value: number): string {
  const normalized = Math.abs(value) <= 1 ? value * 100 : value;
  const sign = normalized > 0 ? "+" : normalized < 0 ? "-" : "";
  return `${sign}${Math.abs(normalized).toFixed(0)}%`;
}

function getAccuracyTone(accuracy: number): string {
  const normalized = Math.abs(accuracy) <= 1 ? accuracy : accuracy / 100;
  if (normalized > 0.8) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (normalized > 0.5) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-rose-100 text-rose-700 border-rose-200";
}

function getAccuracyTier(accuracy: number): "high" | "moderate" | "low" {
  const normalized = Math.abs(accuracy) <= 1 ? accuracy : accuracy / 100;
  if (normalized > 0.8) return "high";
  if (normalized > 0.5) return "moderate";
  return "low";
}

function buildAggregateBaselineProjection(
  results: DisplayMonteCarlo[]
): ExecutiveSparkPoint[] {
  const withProjection = results.filter(
    (item) => item.timeSeriesProjection.length > 0
  );
  if (withProjection.length === 0) return [];

  const maxMonths = Math.max(
    ...withProjection.map((item) => item.timeSeriesProjection.length)
  );

  return Array.from({ length: maxMonths }, (_, idx) => {
    const points = withProjection
      .map((item) => item.timeSeriesProjection[idx]?.p50)
      .filter((value): value is number => Number.isFinite(value));
    const baseline =
      points.length > 0
        ? points.reduce((sum, value) => sum + value, 0) / points.length
        : 0;

    return {
      month: `Month ${idx + 1}`,
      baseline,
    };
  });
}

function getExecutiveHeadline(accuracy: number, expectedRevenue: number): string {
  const tier = getAccuracyTier(accuracy);
  if (tier === "high" && expectedRevenue >= 0) {
    return "Simulation Complete. High confidence in revenue targets.";
  }
  if (tier === "high") {
    return "Simulation Complete. High-confidence model output with stable projections.";
  }
  if (tier === "moderate") {
    return "Simulation Complete. Moderate confidence; monitor key risk drivers.";
  }
  return "Simulation Complete. Elevated risk detected; prioritize mitigation planning.";
}

function getMonteCarloResults(rawResult: unknown): DisplayMonteCarlo[] {
  const result = asRecord(rawResult);
  const raw = Array.isArray(result.monteCarlo)
    ? result.monteCarlo
    : Array.isArray(result.monte_carlo)
      ? result.monte_carlo
      : [];

  return raw.map((item, index) => {
    const entry = asRecord(item);
    const percentiles = asRecord(entry.percentiles);
    const distribution = toNumberArray(entry.distribution);
    const rawSamples = toNumberArray(entry.raw_samples ?? entry.rawSamples);
    const projection = getProjectionPoints(
      entry.timeSeriesProjection ?? entry.time_series_projection
    );

    return {
      variable: toStringValue(entry.variable, `Variable ${index + 1}`),
      mean: toNumber(entry.mean),
      median: toNumber(entry.median),
      std: toNumber(entry.std),
      p5: toNumber(percentiles["5"] ?? percentiles.p5),
      p25: toNumber(percentiles["25"] ?? percentiles.p25),
      p50: toNumber(percentiles["50"] ?? percentiles.p50),
      p75: toNumber(percentiles["75"] ?? percentiles.p75),
      p95: toNumber(percentiles["95"] ?? percentiles.p95),
      distribution: distribution.length ? distribution : rawSamples,
      timeSeriesProjection: projection,
    };
  });
}

function getSensitivityResults(rawResult: unknown): DisplaySensitivity[] {
  const result = asRecord(rawResult);
  const raw = Array.isArray(result.sensitivity) ? result.sensitivity : [];

  return raw
    .map((item, index) => {
      const entry = asRecord(item);
      return {
        variable: toStringValue(entry.variable, `Variable ${index + 1}`),
        sobolIndex: toNumber(entry.sobolIndex ?? entry.sobol_index),
        totalSobolIndex: toNumber(
          entry.totalSobolIndex ?? entry.total_sobol_index
        ),
        morrisScreening: toNumber(
          entry.morrisScreening ?? entry.morris_screening
        ),
        rank: toNumber(entry.rank, index + 1),
      };
    })
    .sort((a, b) => a.rank - b.rank);
}

function getBayesianData(rawResult: unknown): {
  nodes: string[];
  edges: DisplayBayesianEdge[];
} {
  const result = asRecord(rawResult);
  const bayesian = asRecord(result.bayesianNetwork ?? result.bayesian_network);
  const rawNodes = Array.isArray(bayesian.nodes) ? bayesian.nodes : [];
  const rawEdges = Array.isArray(bayesian.edges) ? bayesian.edges : [];

  const edges = rawEdges.map((item) => {
    const entry = asRecord(item);
    return {
      from: toStringValue(entry.from ?? entry.from_var),
      to: toStringValue(entry.to ?? entry.to_var),
      strength: toNumber(entry.strength),
      description: toStringValue(entry.description),
    };
  });

  const edgeNodes = edges.flatMap((edge) => [edge.from, edge.to]).filter(Boolean);
  const nodes = (rawNodes as unknown[]).map((node) => toStringValue(node)).filter(Boolean);
  const combined = nodes.length ? nodes : edgeNodes;

  return {
    nodes: Array.from(new Set(combined)),
    edges,
  };
}

function getBacktestData(rawResult: unknown): DisplayBacktest {
  const result = asRecord(rawResult);
  const backtest = asRecord(result.backtest ?? result.backtest_result);
  const rawWalk = Array.isArray(backtest.walkForwardResults)
    ? backtest.walkForwardResults
    : Array.isArray(backtest.walk_forward_results)
      ? backtest.walk_forward_results
      : [];

  const walkForwardResults = rawWalk.map((item, index) => {
    const entry = asRecord(item);
    const predicted = toNumber(entry.predicted);
    const p5Raw = toNumber(entry.p5, predicted);
    const p95Raw = toNumber(entry.p95, predicted);
    return {
      period: toStringValue(entry.period, `t+${index + 1}`),
      predicted,
      actual: toNumber(entry.actual),
      p5: Math.min(p5Raw, p95Raw),
      p95: Math.max(p5Raw, p95Raw),
    };
  });

  return {
    accuracy: toNumber(backtest.accuracy),
    brierScore: toNumber(backtest.brierScore ?? backtest.brier_score),
    ensembleDisagreement: toNumber(
      backtest.ensembleDisagreement ?? backtest.ensemble_disagreement
    ),
    walkForwardResults,
  };
}

function getAgentData(rawResult: unknown): DisplayAgentAnalysis {
  const result = asRecord(rawResult);
  const agent = asRecord(result.agentAnalysis ?? result.agent_analysis);

  const recommendationsRaw = Array.isArray(agent.recommendations)
    ? agent.recommendations
    : [];
  const unifiedRaw = Array.isArray(agent.unifiedFindings)
    ? agent.unifiedFindings
    : Array.isArray(agent.unified_findings)
      ? agent.unified_findings
      : [];
  const roundsRaw = Array.isArray(agent.debateRounds)
    ? agent.debateRounds
    : Array.isArray(agent.debate_rounds)
      ? agent.debate_rounds
      : [];

  return {
    recommendations: recommendationsRaw
      .map((item) => toStringValue(item))
      .filter(Boolean),
    convergenceScore: toNumber(
      agent.convergenceScore ?? agent.convergence_score
    ),
    unifiedFindings: unifiedRaw.map((item) => {
      const entry = asRecord(item);
      return {
        summary: toStringValue(entry.summary, "Finding"),
        confidence: toNumber(entry.confidence),
        details: toStringValue(entry.details),
      };
    }),
    debateRounds: roundsRaw.map((item, index) => {
      const round = asRecord(item);
      const critiquesRaw = Array.isArray(round.critiques) ? round.critiques : [];
      return {
        round: toNumber(round.round, index + 1),
        critiques: critiquesRaw.map((critique) => {
          const entry = asRecord(critique);
          return {
            fromAgent: toStringValue(entry.fromAgent ?? entry.from_agent, "agent"),
            toAgent: toStringValue(entry.toAgent ?? entry.to_agent, "agent"),
            critique: toStringValue(entry.critique),
            response: toStringValue(entry.response),
          };
        }),
      };
    }),
  };
}

export default function SimulatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const { viewMode, setViewMode, scenarios, setScenarios } = useScenarioStore();
  const {
    config,
    status: simulationStatus,
    progress,
    currentResult,
    error: simulationError,
    setStatus,
    setResult,
    addPastResult,
    setError,
  } = useSimulationStore();

  const {
    projects,
    isLoading,
    error: projectError,
    loadProjects,
    setActiveProject,
    clearActiveProject,
    renameProject,
    deleteProject,
  } = useProjectStore();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("");
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const selectedProject =
    projectId ? projects.find((project) => project.id === projectId) ?? null : null;

  const showResults = currentResult !== null || simulationStatus !== "idle";
  const normalizedProgress =
    progress > 0
      ? progress
      : STATUS_PROGRESS_FALLBACK[simulationStatus] ?? 0;
  const monteCarloResults = getMonteCarloResults(currentResult);
  const sensitivityResults = getSensitivityResults(currentResult);
  const bayesianData = getBayesianData(currentResult);
  const backtestData = getBacktestData(currentResult);
  const agentData = getAgentData(currentResult);
  const rankedSensitivity = [...sensitivityResults].sort(
    (a, b) => Math.abs(b.totalSobolIndex) - Math.abs(a.totalSobolIndex)
  );
  const topSensitivity = rankedSensitivity.slice(0, 2);
  const maxSensitivityImpact = rankedSensitivity.length
    ? Math.max(...rankedSensitivity.map((item) => Math.abs(item.totalSobolIndex)))
    : 0;
  const primaryRiskDriver = topSensitivity[0] ?? null;
  const revenueProjection = monteCarloResults.find((item) =>
    item.variable.toLowerCase().includes("revenue")
  );
  const month12RevenuePoint =
    revenueProjection?.timeSeriesProjection.find((point) => point.month === "Month 12") ??
    revenueProjection?.timeSeriesProjection.at(-1);
  const expectedMonth12Revenue =
    month12RevenuePoint?.p50 ?? revenueProjection?.median ?? 0;
  const executiveHeadline = getExecutiveHeadline(
    backtestData.accuracy,
    expectedMonth12Revenue
  );
  const aggregateBaselineProjection =
    buildAggregateBaselineProjection(monteCarloResults);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!projectId || isLoading || projectError) return;
    const exists = projects.some((project) => project.id === projectId);
    if (!exists) {
      router.replace("/simulate");
    }
  }, [projectId, projects, isLoading, projectError, router]);

  useEffect(() => {
    if (!projectId) {
      clearActiveProject();
      setScenarios([]);
      setSelectedScenarioId("");
      return;
    }

    setActiveProject(projectId);
  }, [projectId, clearActiveProject, setActiveProject, setScenarios]);

  useEffect(() => {
    if (!projectId) return;

    const controller = new AbortController();
    const loadScenarios = async () => {
      try {
        setScenarioError(null);
        const res = await fetch(`/api/scenario?businessId=${projectId}`, {
          signal: controller.signal,
        });
        const payload = await res.json();
        if (!res.ok || !payload.success || !Array.isArray(payload.data)) {
          throw new Error(payload.error || "Failed to load scenarios");
        }

        setScenarios(payload.data);
        setSelectedScenarioId("");
      } catch (error) {
        if (controller.signal.aborted) return;
        setScenarioError(
          error instanceof Error ? error.message : "Failed to load scenarios"
        );
      }
    };

    void loadScenarios();
    return () => controller.abort();
  }, [projectId, setScenarios]);

  const handleRunSimulation = async () => {
    if (!projectId) {
      setError("Select a project before running simulations.");
      setStatus("error");
      return;
    }

    if (!selectedScenarioId) {
      setError("Select a scenario before running a simulation.");
      setStatus("error");
      return;
    }

    setIsRunning(true);
    setError(null);
    setStatus("preparing");

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: projectId,
          scenarioId: selectedScenarioId,
          config,
          includeAgentEnrichment: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to run simulation");
      }

      if (data.result) {
        setResult(data.result);
        addPastResult(data.result);
      }

      setStatus(data.status ?? "complete");
    } catch (error) {
      setStatus("error");
      setError(error instanceof Error ? error.message : "Simulation failed");
    } finally {
      setIsRunning(false);
    }
  };

  const handleDeleteProject = async (targetProjectId: string) => {
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteProject(targetProjectId);
      router.push("/");
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete project"
      );
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  if (!projectId) {
    return (
      <ProjectListView
        title="Simulation Projects"
        description="Select a project first, then choose a scenario to run."
        projects={projects}
        isLoading={isLoading}
        error={projectError}
        onRetry={() => void loadProjects()}
        onCreate={() => router.push("/data?new=1")}
        onSelect={(id) => router.push(`/simulate?project=${id}`)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={selectedProject}
        projects={projects}
        onBackToProjects={() => router.push("/simulate")}
        onSelectProject={(id) => router.push(`/simulate?project=${id}`)}
        onCreateProject={() => router.push("/data?new=1")}
        onRenameProject={
          selectedProject
            ? async (id, name) => {
                setIsRenaming(true);
                try {
                  await renameProject(id, name);
                } finally {
                  setIsRenaming(false);
                }
              }
            : undefined
        }
        onDeleteProject={
          selectedProject ? (id) => handleDeleteProject(id) : undefined
        }
        isRenaming={isRenaming}
        isDeleting={isDeleting}
        deleteError={deleteError}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Simulation</h2>
          <p className="text-muted-foreground mt-1">
            Choose a scenario and run AI-powered simulations on this project.
          </p>
        </div>
        <div className="flex min-w-[280px] items-center gap-2">
          <Select
            value={selectedScenarioId}
            onValueChange={setSelectedScenarioId}
            disabled={scenarios.length === 0}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select scenario" />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map((scenario) => (
                <SelectItem key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleRunSimulation}
            disabled={isRunning || !selectedScenarioId}
          >
            <Play className="mr-2 h-4 w-4" />
            {isRunning ? "Running..." : "Run Simulation"}
          </Button>
        </div>
      </div>

      {scenarioError ? (
        <p className="text-sm text-destructive">{scenarioError}</p>
      ) : null}

      {/* Simulation config */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monte Carlo Iterations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {config.iterations.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Time Horizon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{config.timeHorizonMonths} months</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confidence Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(config.confidenceLevel)}
            </div>
          </CardContent>
        </Card>
      </div>

      {showResults ? (
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Simulation Results</CardTitle>
                <Badge
                  variant={
                    simulationStatus === "error"
                      ? "destructive"
                      : simulationStatus === "complete"
                        ? "default"
                        : "secondary"
                  }
                >
                  {STATUS_LABELS[simulationStatus]}
                </Badge>
              </div>
              {simulationStatus === "complete" ? (
                <div className="flex items-center gap-1 text-xs text-emerald-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed successfully
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(normalizedProgress)}%</span>
              </div>
              <Progress value={normalizedProgress} />
            </div>

            {simulationStatus === "error" && simulationError ? (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <span>{simulationError}</span>
              </div>
            ) : null}

            {!currentResult && simulationStatus !== "error" ? (
              <CardDescription>
                Simulation is in progress. Results will appear here as soon as they
                are available.
              </CardDescription>
            ) : null}
          </CardHeader>

          {currentResult ? (
            <CardContent>
              {simulationStatus === "complete" ? (
                <div className="mb-6">
                  <ExecutiveSimulationSummary
                    headline={executiveHeadline}
                    expectedMonth12Revenue={expectedMonth12Revenue}
                    primaryRiskDriver={primaryRiskDriver}
                    modelAccuracy={backtestData.accuracy}
                    aggregateProjection={aggregateBaselineProjection}
                  />
                </div>
              ) : null}

              <Tabs defaultValue="monte-carlo" className="space-y-6">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-2 md:grid-cols-5">
                  <TabsTrigger value="monte-carlo">Monte Carlo</TabsTrigger>
                  <TabsTrigger value="sensitivity">Sensitivity</TabsTrigger>
                  <TabsTrigger value="bayesian">Bayesian</TabsTrigger>
                  <TabsTrigger value="backtest">Backtest</TabsTrigger>
                  <TabsTrigger value="agents">Agents</TabsTrigger>
                </TabsList>

                <TabsContent value="monte-carlo" className="space-y-4">
                  {monteCarloResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No Monte Carlo results available.
                    </p>
                  ) : (
                    monteCarloResults.map((result) => {
                      const histogramData = getHistogramBins(result.distribution);
                      const meanTone = getMetricToneClasses(result.variable, result.mean);
                      const medianTone = getMetricToneClasses(result.variable, result.median);
                      const stdTone = getMetricToneClasses(result.variable, result.std);
                      return (
                        <Card key={result.variable}>
                          <CardHeader>
                            <CardTitle className="text-sm">
                              {formatVarName(result.variable)}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {result.timeSeriesProjection.length > 0 ? (
                              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                  Fan Chart (P5-P95 and P25-P75)
                                </p>
                                <div className="h-64 w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={result.timeSeriesProjection}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                      <YAxis
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(value) =>
                                          formatCurrency(toNumber(value), true)
                                        }
                                      />
                                      <Tooltip
                                        formatter={(value, name) => [
                                          formatCurrency(toNumber(value)),
                                          String(name).toUpperCase(),
                                        ]}
                                      />
                                      <Line
                                        type="monotone"
                                        dataKey="p95"
                                        name="p95"
                                        stroke="hsl(0 70% 52%)"
                                        strokeOpacity={0.35}
                                        strokeDasharray="6 6"
                                        dot={false}
                                      />
                                      <Line
                                        type="monotone"
                                        dataKey="p75"
                                        name="p75"
                                        stroke="hsl(25 85% 56%)"
                                        strokeOpacity={0.7}
                                        strokeDasharray="4 4"
                                        dot={false}
                                      />
                                      <Line
                                        type="monotone"
                                        dataKey="p50"
                                        name="median"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={3}
                                        dot={false}
                                      />
                                      <Line
                                        type="monotone"
                                        dataKey="p25"
                                        name="p25"
                                        stroke="hsl(25 85% 56%)"
                                        strokeOpacity={0.7}
                                        strokeDasharray="4 4"
                                        dot={false}
                                      />
                                      <Line
                                        type="monotone"
                                        dataKey="p5"
                                        name="p5"
                                        stroke="hsl(0 70% 52%)"
                                        strokeOpacity={0.35}
                                        strokeDasharray="6 6"
                                        dot={false}
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            ) : null}

                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className={`rounded-md border p-3 ${meanTone.card}`}>
                                <p className="text-xs text-muted-foreground">Mean</p>
                                <p className={`text-sm font-semibold ${meanTone.value}`}>
                                  {formatCurrency(result.mean)}
                                </p>
                              </div>
                              <div className={`rounded-md border p-3 ${medianTone.card}`}>
                                <p className="text-xs text-muted-foreground">Median</p>
                                <p className={`text-sm font-semibold ${medianTone.value}`}>
                                  {formatCurrency(result.median)}
                                </p>
                              </div>
                              <div className={`rounded-md border p-3 ${stdTone.card}`}>
                                <p className="text-xs text-muted-foreground">Std Dev</p>
                                <p className={`text-sm font-semibold ${stdTone.value}`}>
                                  {formatCurrency(result.std)}
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-5">
                              <div>P5: {formatCurrency(result.p5)}</div>
                              <div>P25: {formatCurrency(result.p25)}</div>
                              <div>P50: {formatCurrency(result.p50)}</div>
                              <div>P75: {formatCurrency(result.p75)}</div>
                              <div>P95: {formatCurrency(result.p95)}</div>
                            </div>

                            {histogramData.length > 0 ? (
                              <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={histogramData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                      dataKey="bin"
                                      tick={{ fontSize: 10 }}
                                      interval="preserveStartEnd"
                                    />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No distribution data available for charting.
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </TabsContent>

                <TabsContent value="sensitivity" className="space-y-4">
                  {sensitivityResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No sensitivity analysis results available.
                    </p>
                  ) : (
                    <>
                      <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="pt-6">
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {formatVarName(topSensitivity[0]?.variable ?? "")}
                            </span>{" "}
                            has the highest impact on outcomes (Sobol:{" "}
                            {formatDecimal(topSensitivity[0]?.totalSobolIndex ?? 0, 3)}).
                            Focus optimization efforts here.
                            {topSensitivity[1] ? (
                              <>
                                {" "}
                                Next most impactful:{" "}
                                <span className="font-medium text-foreground">
                                  {formatVarName(topSensitivity[1].variable)}
                                </span>{" "}
                                (Sobol:{" "}
                                {formatDecimal(topSensitivity[1].totalSobolIndex, 3)}).
                              </>
                            ) : null}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Sensitivity Ranking (Total Sobol)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={rankedSensitivity}
                                layout="vertical"
                                margin={{ left: 8, right: 8 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis
                                  dataKey="variable"
                                  type="category"
                                  tickFormatter={formatVarName}
                                  tick={{ fontSize: 11 }}
                                  width={120}
                                />
                                <Tooltip
                                  labelFormatter={(value) =>
                                    formatVarName(toStringValue(value))
                                  }
                                  formatter={(value) => [
                                    formatDecimal(toNumber(value), 4),
                                    "Total Sobol",
                                  ]}
                                />
                                <Bar
                                  dataKey="totalSobolIndex"
                                >
                                  {rankedSensitivity.map((item) => (
                                    <Cell
                                      key={`impact-${item.variable}`}
                                      fill={toImpactColor(
                                        item.totalSobolIndex,
                                        maxSensitivityImpact
                                      )}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                            <tr>
                              <th className="p-3 text-left">Rank</th>
                              <th className="p-3 text-left">Variable</th>
                              <th className="p-3 text-right">Sobol</th>
                              <th className="p-3 text-right">Total Sobol</th>
                              <th className="p-3 text-right">Morris</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sensitivityResults.map((result) => (
                              <tr key={result.variable} className="border-t">
                                <td className="p-3">{result.rank}</td>
                                <td className="p-3 font-medium">
                                  {formatVarName(result.variable)}
                                </td>
                                <td className="p-3 text-right">
                                  {formatDecimal(result.sobolIndex, 4)}
                                </td>
                                <td className="p-3 text-right">
                                  {formatDecimal(result.totalSobolIndex, 4)}
                                </td>
                                <td className="p-3 text-right">
                                  {formatDecimal(result.morrisScreening, 4)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="bayesian" className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-1">
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Nodes ({bayesianData.nodes.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        {bayesianData.nodes.length > 0 ? (
                          bayesianData.nodes.map((node) => (
                            <Badge key={node} variant="secondary">
                              {node}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No nodes available.
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Edges ({bayesianData.edges.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {bayesianData.edges.length > 0 ? (
                          bayesianData.edges.map((edge, idx) => (
                            <div
                              key={`${edge.from}-${edge.to}-${idx}`}
                              className="rounded-md border p-3"
                            >
                              <p className="text-sm font-medium">
                                {formatVarName(edge.from)}{" "}
                                <span className="text-muted-foreground">→</span>{" "}
                                {formatVarName(edge.to)}
                              </p>
                              <p
                                className={`text-xs ${
                                  edge.strength > 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : edge.strength < 0
                                      ? "text-rose-600 dark:text-rose-400"
                                      : "text-muted-foreground"
                                }`}
                              >
                                Strength: {formatStrengthPercent(edge.strength)}
                              </p>
                              {edge.description ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {edge.description}
                                </p>
                              ) : null}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No edges available.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="backtest" className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Accuracy
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-xl font-semibold">
                          {formatPercent(backtestData.accuracy)}
                        </p>
                        <Badge className={getAccuracyTone(backtestData.accuracy)}>
                          {getAccuracyTier(backtestData.accuracy) === "high"
                            ? "High Accuracy"
                            : getAccuracyTier(backtestData.accuracy) === "moderate"
                              ? "Moderate Accuracy"
                              : "Low Accuracy"}
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Brier Score
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-semibold">
                          {formatDecimal(backtestData.brierScore, 4)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Ensemble Disagreement
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-semibold">
                          {formatDecimal(backtestData.ensembleDisagreement, 4)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {backtestData.walkForwardResults.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Walk-Forward: Predicted vs Actual
                        </CardTitle>
                        <CardDescription>
                          Dashed lines represent the model confidence bounds (P5-P95).
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={backtestData.walkForwardResults}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                              <YAxis />
                              <Tooltip
                                formatter={(value, name) => [
                                  formatCurrency(toNumber(value)),
                                  formatVarName(
                                    toStringValue(name).replace(/\+/g, "_")
                                  ),
                                ]}
                              />
                              <Line
                                type="monotone"
                                dataKey="predicted"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={false}
                              />
                              <Line
                                type="monotone"
                                dataKey="actual"
                                stroke="hsl(var(--muted-foreground))"
                                strokeWidth={2}
                                dot={false}
                              />
                              <Line
                                type="monotone"
                                dataKey="p5"
                                stroke="hsl(var(--primary))"
                                strokeOpacity={0.5}
                                strokeDasharray="6 5"
                                dot={false}
                              />
                              <Line
                                type="monotone"
                                dataKey="p95"
                                stroke="hsl(var(--primary))"
                                strokeOpacity={0.5}
                                strokeDasharray="6 5"
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No walk-forward backtest data available.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="agents" className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-1">
                      <CardHeader>
                        <CardTitle className="text-sm">Convergence Score</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-2xl font-semibold">
                          {formatPercent(agentData.convergenceScore)}
                        </p>
                        <Progress value={agentData.convergenceScore * 100} />
                      </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-sm">Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {agentData.recommendations.length > 0 ? (
                          <ul className="list-disc space-y-1 pl-4 text-sm">
                            {agentData.recommendations.map((recommendation, idx) => (
                              <li key={`${recommendation}-${idx}`}>{recommendation}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No recommendations available.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Agent Finding Confidence
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {agentData.unifiedFindings.length > 0 ? (
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={agentData.unifiedFindings.map((finding, idx) => ({
                                id: idx + 1,
                                label: `F${idx + 1}`,
                                confidence: finding.confidence * 100,
                              }))}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="label" />
                              <YAxis tickFormatter={(value) => `${toNumber(value)}%`} />
                              <Tooltip
                                formatter={(value) => [
                                  formatPercent(toNumber(value)),
                                  "Confidence",
                                ]}
                              />
                              <Bar dataKey="confidence">
                                {agentData.unifiedFindings.map((finding, idx) => (
                                  <Cell
                                    key={`agent-confidence-${idx}`}
                                    fill={toImpactColor(finding.confidence * 100, 100)}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No confidence data available.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Unified Findings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {agentData.unifiedFindings.length > 0 ? (
                        agentData.unifiedFindings.map((finding, idx) => (
                          <div key={`${finding.summary}-${idx}`} className="rounded-md border p-3">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <p className="text-sm font-medium">{finding.summary}</p>
                              <Badge variant="secondary">
                                {formatPercent(finding.confidence)}
                              </Badge>
                            </div>
                            {finding.details ? (
                              <p className="text-xs text-muted-foreground">{finding.details}</p>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No unified findings available.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Debate Rounds</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {agentData.debateRounds.length > 0 ? (
                        agentData.debateRounds.map((round) => (
                          <details key={round.round} className="rounded-md border p-3">
                            <summary className="cursor-pointer text-sm font-medium">
                              Round {round.round}
                            </summary>
                            <div className="mt-3 space-y-2">
                              {round.critiques.map((critique, idx) => (
                                <div key={`${critique.fromAgent}-${critique.toAgent}-${idx}`} className="rounded-md bg-muted/40 p-2">
                                  <p className="text-xs font-medium">
                                    {critique.fromAgent} → {critique.toAgent}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                                    {critique.critique || "No critique text."}
                                  </p>
                                  {critique.response ? (
                                    <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                                      Response: {critique.response}
                                    </p>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </details>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No debate rounds available.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      {/* Scenario builder */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "wizard" | "graph")}>
        <TabsList>
          <TabsTrigger value="wizard">
            <Wand2 className="mr-2 h-3 w-3" />
            Wizard
          </TabsTrigger>
          <TabsTrigger value="graph">
            <Network className="mr-2 h-3 w-3" />
            Graph Editor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wizard" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent mb-3">
                <Wand2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">Scenario Wizard</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                Build what-if scenarios step by step. Select variables to modify,
                set new values, and save scenario versions for this project.
              </p>
              <Button variant="outline" onClick={() => setWizardOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Scenario
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graph" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent mb-3">
                <Network className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">Graph Editor</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                Open a saved scenario to edit causal graphs and run simulations.
              </p>
              {selectedScenarioId ? (
                <Button variant="outline" asChild>
                  <Link href={`/scenario/${selectedScenarioId}`}>
                    <Network className="mr-2 h-4 w-4" />
                    Open Graph Editor
                  </Link>
                </Button>
              ) : scenarios.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Select a scenario above to open Graph Editor.
                </p>
              ) : (
                <Button variant="outline" onClick={() => setWizardOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Scenario First
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Scenarios list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Saved Scenarios</CardTitle>
              <CardDescription>Your saved what-if scenarios</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setWizardOpen(true)}>
              <Plus className="mr-2 h-3 w-3" />
              New Scenario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {scenarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No scenarios yet. Create one using the Wizard above.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  onClick={() => setSelectedScenarioId(scenario.id)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent/50 ${
                    selectedScenarioId === scenario.id
                      ? "border-primary/50 bg-accent/40"
                      : "border-border"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{scenario.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {scenario.variables.length} variable
                      {scenario.variables.length !== 1 ? "s" : ""} modified
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {new Date(scenario.createdAt).toLocaleDateString()}
                    </Badge>
                    <Link
                      href={`/scenario/${scenario.id}`}
                      className="rounded-sm p-1 hover:bg-accent"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ScenarioWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        businessId={projectId}
      />
    </div>
  );
}
