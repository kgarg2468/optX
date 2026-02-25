"use client";

import { useEffect, useState } from "react";
import { Play, Wand2, Network, Plus, ArrowRight } from "lucide-react";
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

export default function SimulatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const { viewMode, setViewMode, scenarios, setScenarios } = useScenarioStore();
  const { config, setStatus, setResult, addPastResult, setError } =
    useSimulationStore();

  const {
    projects,
    isLoading,
    error,
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

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!projectId || isLoading || error) return;
    const exists = projects.some((project) => project.id === projectId);
    if (!exists) {
      router.replace("/simulate");
    }
  }, [projectId, projects, isLoading, error, router]);

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
        error={error}
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
