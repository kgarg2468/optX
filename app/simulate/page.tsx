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
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type UnknownRecord = Record<string, unknown>;

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
};

type DisplayBacktest = {
  accuracy: number;
  brierScore: number;
  ensembleDisagreement: number;
  walkForwardResults: DisplayBacktestPoint[];
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
      bin: `${start.toFixed(0)}-${end.toFixed(0)}`,
      count,
    };
  });
}

function formatMetric(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "0.00";
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
    return {
      period: toStringValue(entry.period, `t+${index + 1}`),
      predicted: toNumber(entry.predicted),
      actual: toNumber(entry.actual),
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
              {(config.confidenceLevel * 100).toFixed(0)}%
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
                      return (
                        <Card key={result.variable}>
                          <CardHeader>
                            <CardTitle className="text-sm">{result.variable}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-md border p-3">
                                <p className="text-xs text-muted-foreground">Mean</p>
                                <p className="text-sm font-semibold">
                                  {formatMetric(result.mean)}
                                </p>
                              </div>
                              <div className="rounded-md border p-3">
                                <p className="text-xs text-muted-foreground">Median</p>
                                <p className="text-sm font-semibold">
                                  {formatMetric(result.median)}
                                </p>
                              </div>
                              <div className="rounded-md border p-3">
                                <p className="text-xs text-muted-foreground">Std Dev</p>
                                <p className="text-sm font-semibold">
                                  {formatMetric(result.std)}
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-5">
                              <div>P5: {formatMetric(result.p5)}</div>
                              <div>P25: {formatMetric(result.p25)}</div>
                              <div>P50: {formatMetric(result.p50)}</div>
                              <div>P75: {formatMetric(result.p75)}</div>
                              <div>P95: {formatMetric(result.p95)}</div>
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
                                data={sensitivityResults}
                                layout="vertical"
                                margin={{ left: 8, right: 8 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis
                                  dataKey="variable"
                                  type="category"
                                  tick={{ fontSize: 11 }}
                                  width={120}
                                />
                                <Tooltip />
                                <Bar
                                  dataKey="totalSobolIndex"
                                  fill="hsl(var(--primary))"
                                />
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
                                <td className="p-3 font-medium">{result.variable}</td>
                                <td className="p-3 text-right">
                                  {formatMetric(result.sobolIndex, 4)}
                                </td>
                                <td className="p-3 text-right">
                                  {formatMetric(result.totalSobolIndex, 4)}
                                </td>
                                <td className="p-3 text-right">
                                  {formatMetric(result.morrisScreening, 4)}
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
                                {edge.from}{" "}
                                <span className="text-muted-foreground">→</span>{" "}
                                {edge.to}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Strength: {formatMetric(edge.strength, 3)}
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
                      <CardContent>
                        <p className="text-xl font-semibold">
                          {(backtestData.accuracy * 100).toFixed(1)}%
                        </p>
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
                          {formatMetric(backtestData.brierScore, 4)}
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
                          {formatMetric(backtestData.ensembleDisagreement, 4)}
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
                      </CardHeader>
                      <CardContent>
                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={backtestData.walkForwardResults}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                              <YAxis />
                              <Tooltip />
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
                          {(agentData.convergenceScore * 100).toFixed(1)}%
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
                      <CardTitle className="text-sm">Unified Findings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {agentData.unifiedFindings.length > 0 ? (
                        agentData.unifiedFindings.map((finding, idx) => (
                          <div key={`${finding.summary}-${idx}`} className="rounded-md border p-3">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <p className="text-sm font-medium">{finding.summary}</p>
                              <Badge variant="secondary">
                                {(finding.confidence * 100).toFixed(0)}%
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
