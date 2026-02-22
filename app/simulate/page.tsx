"use client";

import { useEffect, useState } from "react";
import {
  Play,
  Wand2,
  Network,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
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
import { useScenarioStore } from "@/lib/store/scenario-store";
import { useSimulationStore } from "@/lib/store/simulation-store";
import { useBusinessStore } from "@/lib/store/business-store";
import { ScenarioWizard } from "@/components/wizard/ScenarioWizard";

export default function SimulatePage() {
  const { viewMode, setViewMode, scenarios, setScenarios } = useScenarioStore();
  const { businessData } = useBusinessStore();
  const { config, setStatus, setResult, addPastResult, setError } =
    useSimulationStore();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!businessData.id) return;

    const controller = new AbortController();
    const loadScenarios = async () => {
      try {
        const res = await fetch(`/api/scenario?businessId=${businessData.id}`, {
          signal: controller.signal,
        });
        const payload = await res.json();
        if (!res.ok || !payload.success || !Array.isArray(payload.data)) return;
        setScenarios(payload.data);
      } catch {
        // Use local persisted state when request fails
      }
    };

    void loadScenarios();
    return () => controller.abort();
  }, [businessData.id, setScenarios]);

  const handleRunSimulation = async () => {
    if (!businessData.id) {
      setError("Save business data before running simulations.");
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
          businessId: businessData.id,
          scenarioId: scenarios[0]?.id,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Simulation</h2>
          <p className="text-muted-foreground mt-1">
            Build scenarios and run AI-powered simulations on your business data.
          </p>
        </div>
        <Button onClick={handleRunSimulation} disabled={isRunning}>
          <Play className="mr-2 h-4 w-4" />
          {isRunning ? "Running..." : "Run Simulation"}
        </Button>
      </div>

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
            <div className="text-2xl font-bold">
              {config.timeHorizonMonths} months
            </div>
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
      <Tabs
        value={viewMode}
        onValueChange={(v) => setViewMode(v as "wizard" | "graph")}
      >
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
                set new values, and see projected outcomes.
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
                Create a scenario first, then open it to use the drag-and-drop
                graph editor with variable nodes and causal edges.
              </p>
              {scenarios.length > 0 ? (
                <Button variant="outline" asChild>
                  <Link href={`/scenario/${scenarios[0].id}`}>
                    <Network className="mr-2 h-4 w-4" />
                    Open Graph Editor
                  </Link>
                </Button>
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
              <CardDescription>
                Your saved what-if scenarios
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWizardOpen(true)}
            >
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
                <Link
                  key={scenario.id}
                  href={`/scenario/${scenario.id}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent/50"
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
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ScenarioWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
