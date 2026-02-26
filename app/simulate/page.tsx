"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
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
import { SimulationActionRail } from "@/components/ui/SimulationActionRail";
import { SimulationChartOverlay } from "@/components/ui/SimulationChartOverlay";
import { ElevatedNode } from "@/components/ui/nodes/ElevatedNode";
import { ReactFlow, Background } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
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

function SimulatePageContent() {
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
  const monteCarloResults = useMemo(() => getMonteCarloResults(currentResult), [currentResult]);
  const sensitivityResults = useMemo(() => getSensitivityResults(currentResult), [currentResult]);
  const bayesianData = useMemo(() => getBayesianData(currentResult), [currentResult]);
  const backtestData = useMemo(() => getBacktestData(currentResult), [currentResult]);
  const agentData = useMemo(() => getAgentData(currentResult), [currentResult]);
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

  const [nodes, setNodes] = useState(bayesianData.nodes.map((node, i) => ({
    id: node,
    type: 'elevated',
    position: { x: 250 + (i % 3) * 300, y: 150 + Math.floor(i / 3) * 200 },
    data: {
      label: node,
      value: (Math.random() * 1000).toFixed(0),
      status: i % 4 === 0 ? "warning" : "normal"
    },
  })));

  const [edges, setEdges] = useState(bayesianData.edges.map((edge, i) => ({
    id: `e-${edge.from}-${edge.to}`,
    source: edge.from,
    target: edge.to,
    animated: true,
    style: { stroke: edge.strength > 0 ? '#10b981' : '#f43f5e', strokeWidth: 2 },
  })));

  const [showCharts, setShowCharts] = useState(false);

  // Update nodes/edges when simulation data changes
  useEffect(() => {
    if (simulationStatus === "complete" && bayesianData.nodes.length > 0) {
      setNodes(bayesianData.nodes.map((node, i) => {
        // Find corresponding Monte Carlo result for this node to get actual data
        const mcResult = monteCarloResults.find(mc => mc.variable === node);
        const sensitivity = sensitivityResults.find(s => s.variable === node);

        let displayValue = "-";
        if (mcResult) {
          // Determine if it's a currency, percentage, or raw number based on variable name or magnitude
          const isCurrency = node.toLowerCase().includes('revenue') || node.toLowerCase().includes('cost') || node.toLowerCase().includes('expense') || node.toLowerCase().includes('price');
          displayValue = isCurrency ? formatCurrency(mcResult.p50) : formatCompact(mcResult.p50);
        }

        // Determine status based on sensitivity
        let status: "normal" | "warning" | "success" = "normal";
        if (sensitivity) {
          if (sensitivity.totalSobolIndex > 0.4) status = "warning";
        }

        return {
          id: node,
          type: 'elevated',
          position: { x: window.innerWidth / 2 - 400 + (i % 3) * 300, y: 200 + Math.floor(i / 3) * 200 },
          data: {
            label: node,
            value: displayValue,
            status: status
          },
        };
      }));

      setEdges(bayesianData.edges.map((edge) => ({
        id: `e-${edge.from}-${edge.to}`,
        source: edge.from,
        target: edge.to,
        animated: true,
        style: { stroke: edge.strength > 0 ? '#10b981' : '#f43f5e', strokeWidth: Math.abs(edge.strength) > 0.5 ? 4 : 2 },
      })));

      setShowCharts(true);
    }
  }, [simulationStatus, bayesianData, monteCarloResults, sensitivityResults]);

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

  const [selectedNodeData, setSelectedNodeData] = useState<{
    variable: string;
    mcResult?: DisplayMonteCarlo;
    sensitivity?: DisplaySensitivity;
  } | null>(null);

  const handleNodeClick = (event: React.MouseEvent, node: { id: string }) => {
    const mcResult = monteCarloResults.find(mc => mc.variable === node.id);
    const sensitivity = sensitivityResults.find(s => s.variable === node.id);
    setSelectedNodeData({
      variable: node.id,
      mcResult,
      sensitivity
    });
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

  // --- Action Cam Flow UI Overhaul ---


  // Generate fake logs for demo purposes
  const demoLogs = agentData.debateRounds.flatMap(r =>
    r.critiques.map((c, i) => ({
      id: `${r.round}-${i}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message: `${c.fromAgent}: ${c.critique.substring(0, 50)}...`
    }))
  );

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-[#111111] overflow-hidden rounded-3xl border border-white/5">
      {/* Layer 4: Top Navigation & Status */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <Select
            value={selectedScenarioId}
            onValueChange={setSelectedScenarioId}
            disabled={scenarios.length === 0}
          >
            <SelectTrigger className="w-[280px] bg-black/40 backdrop-blur-xl border-white/10 rounded-full h-12 px-6 shadow-2xl">
              <SelectValue placeholder="Select scenario to run" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-white/10 text-white rounded-2xl">
              {scenarios.map((scenario) => (
                <SelectItem key={scenario.id} value={scenario.id} className="focus:bg-white/10 rounded-xl cursor-pointer">
                  {scenario.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground mr-2 font-medium">Status</span>
              <span className="text-sm font-semibold text-white tracking-wide">
                {STATUS_LABELS[simulationStatus]}
              </span>
            </div>
            {simulationStatus !== "idle" && simulationStatus !== "complete" && (
              <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300 ease-out"
                  style={{ width: `${normalizedProgress}%` }}
                />
              </div>
            )}
            {simulationStatus === "complete" && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Layer 1: The Media Canvas (React Flow) */}
      <div className="absolute inset-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={{ elevated: ElevatedNode }}
          onNodeClick={handleNodeClick}
          fitView
          className="bg-[#111111]"
          proOptions={{ hideAttribution: true }}
          colorMode="dark"
        >
          <Background color="#ffffff" gap={24} size={1} />
        </ReactFlow>
      </div>

      {/* Layer 2: Right Action Rail */}
      <SimulationActionRail
        isRunning={isRunning}
        onPlayPause={handleRunSimulation}
        onInjectEvent={() => {
          // Demo feature: shake nodes and add a warning
          setNodes(nds => nds.map(n => ({
            ...n,
            data: { ...n.data, status: Math.random() > 0.5 ? "warning" : n.data.status }
          })));
        }}
        onReset={() => {
          setStatus("idle");
          setResult(null as any);
          setShowCharts(false);
          setNodes([]);
          setEdges([]);
        }}
        onToggleCharts={() => setShowCharts(!showCharts)}
      />

      {/* Layer 3: Insight Overlay */}
      <SimulationChartOverlay
        isVisible={showCharts}
        data={aggregateBaselineProjection.map(p => ({
          time: p.month,
          revenue: p.baseline,
          stress: p.baseline * 0.8 // In a real scenario, this would be the p5/p25 downside risk
        }))}
        logs={demoLogs.length > 0 ? demoLogs : [{ id: '1', message: 'Ready to run scenario.', timestamp: new Date().toLocaleTimeString() }]}
      />
      {/* Layer 5: Selected Node Details Panel */}
      {selectedNodeData && (
        <div className="absolute top-24 right-24 z-40 w-80 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl transition-all duration-300 animate-in slide-in-from-right-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-white capitalize">{selectedNodeData.variable}</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Node Analytics</p>
            </div>
            <button
              onClick={() => setSelectedNodeData(null)}
              className="text-white/50 hover:text-white transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {selectedNodeData.mcResult ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">P50 (Median)</p>
                    <p className="text-lg font-mono text-white">{formatCompact(selectedNodeData.mcResult.p50)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Mean</p>
                    <p className="text-lg font-mono text-white">{formatCompact(selectedNodeData.mcResult.mean)}</p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="flex justify-between mb-1">
                    <p className="text-[10px] text-white/50 uppercase tracking-widest">90% Confidence Interval</p>
                  </div>
                  <div className="flex justify-between items-baseline mt-2">
                    <p className="text-sm font-mono text-white/80">{formatCompact(selectedNodeData.mcResult.p5)}</p>
                    <div className="flex-1 mx-3 h-1 bg-gradient-to-r from-emerald-500/20 via-emerald-500/50 to-emerald-500/20 rounded-full" />
                    <p className="text-sm font-mono text-white/80">{formatCompact(selectedNodeData.mcResult.p95)}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-white/50">No Monte Carlo data available.</p>
            )}

            {selectedNodeData.sensitivity && (
              <div className="bg-white/5 rounded-xl p-3 border border-white/5 mt-4">
                <p className="text-[10px] text-white/50 uppercase tracking-widest mb-2">Sensitivity (Sobol)</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-light text-white">{formatDecimal(selectedNodeData.sensitivity.totalSobolIndex, 3)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${selectedNodeData.sensitivity.totalSobolIndex > 0.4 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    Rank #{selectedNodeData.sensitivity.rank}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default function SimulatePage() {
  return (
    <Suspense fallback={<div className="flex h-[calc(100vh-4rem)] items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}>
      <SimulatePageContent />
    </Suspense>
  );
}
