"use client";

import { use, useState, useCallback, useEffect, useMemo } from "react";
import { ArrowLeft, Play, Save, MessageSquare, Settings2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useScenarioStore } from "@/lib/store/scenario-store";
import { useSimulationStore } from "@/lib/store/simulation-store";
import { useProjectStore } from "@/lib/store/project-store";
import { GraphEditor } from "@/components/graph/GraphEditor";
import { NodePalette } from "@/components/graph/NodePalette";
import { ConfigPanel } from "@/components/graph/ConfigPanel";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { graphToVariables, variablesToGraph } from "@/lib/utils/graph-sync";
import type { GraphNode, GraphState } from "@/lib/types";

type RightPanel = "chat" | "config";

export default function ScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    scenarios,
    getGraphState,
    setGraphState,
    addScenario,
    updateScenario,
    updateNode,
    removeNode,
  } = useScenarioStore();
  const { config, setStatus, setResult, addPastResult, setError } =
    useSimulationStore();
  const { setActiveProject } = useProjectStore();

  const scenario = useMemo(
    () => scenarios.find((s) => s.id === id),
    [scenarios, id]
  );

  const [rightPanel, setRightPanel] = useState<RightPanel>("chat");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const graphState = getGraphState(id);

  useEffect(() => {
    if (scenario?.businessId) {
      setActiveProject(scenario.businessId);
    }
  }, [scenario?.businessId, setActiveProject]);

  useEffect(() => {
    if (scenario) return;

    const controller = new AbortController();
    const loadScenario = async () => {
      try {
        const res = await fetch(`/api/scenario?scenarioId=${id}`, {
          signal: controller.signal,
        });
        const payload = await res.json();
        if (!res.ok || !payload.success || !payload.data) return;
        addScenario(payload.data);
        if (payload.data.businessId) {
          setActiveProject(payload.data.businessId);
        }
      } catch {
        // Keep local state if request fails
      }
    };

    void loadScenario();
    return () => controller.abort();
  }, [scenario, id, addScenario, setActiveProject]);

  // Initialize graph from scenario variables if graph is empty
  useEffect(() => {
    if (
      scenario &&
      graphState.nodes.length === 0 &&
      graphState.edges.length === 0 &&
      scenario.variables.length > 0
    ) {
      setGraphState(id, variablesToGraph(scenario.variables));
    }
  }, [
    scenario,
    graphState.nodes.length,
    graphState.edges.length,
    id,
    setGraphState,
  ]);

  const selectedNode = useMemo(
    () => graphState.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [graphState.nodes, selectedNodeId]
  );

  const handleNodeSelect = useCallback(
    (nodeId: string | null) => {
      setSelectedNodeId(nodeId);
      if (nodeId) setRightPanel("config");
    },
    []
  );

  const handleNodeUpdate = useCallback(
    (nodeId: string, updates: Partial<GraphNode>) => {
      updateNode(id, nodeId, updates);
    },
    [id, updateNode]
  );

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      removeNode(id, nodeId);
      setSelectedNodeId(null);
      setRightPanel("chat");
    },
    [id, removeNode]
  );

  const handleGraphStateChange = useCallback(
    (state: GraphState) => {
      setGraphState(id, state);
    },
    [id, setGraphState]
  );

  const handleSaveScenario = useCallback(async () => {
    if (!scenario) return false;
    setIsSaving(true);
    setError(null);
    try {
      const syncedVariables = graphToVariables(graphState, scenario.variables);
      const payload = {
        scenarioId: scenario.id,
        businessId: scenario.businessId,
        name: scenario.name,
        description: scenario.description,
        variables: syncedVariables,
        graphState,
      };

      const res = await fetch("/api/scenario", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save scenario");
      }

      updateScenario(scenario.id, {
        variables: syncedVariables,
        graphState,
        updatedAt: data.scenario?.updatedAt ?? new Date().toISOString(),
      });
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save scenario");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [scenario, graphState, setError, updateScenario]);

  const handleRunScenario = useCallback(async () => {
    if (!scenario?.businessId) {
      setError("Save business data first before running a scenario simulation.");
      return;
    }

    setIsRunning(true);
    setStatus("preparing");
    setError(null);

    try {
      const saved = await handleSaveScenario();
      if (!saved) {
        throw new Error("Failed to save scenario before running simulation");
      }

      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: scenario.businessId,
          scenarioId: scenario.id,
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
  }, [
    scenario,
    config,
    addPastResult,
    handleSaveScenario,
    setError,
    setResult,
    setStatus,
  ]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col -m-6">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-2.5 glass-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/simulate">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-sm font-semibold">
              {scenario?.name ?? "Scenario Editor"}
            </h2>
            {scenario?.description && (
              <p className="text-xs text-muted-foreground truncate max-w-md">
                {scenario.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <Button
              variant={rightPanel === "chat" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setRightPanel("chat")}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant={rightPanel === "config" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setRightPanel("config")}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveScenario}
            disabled={isSaving || !scenario}
          >
            <Save className="mr-2 h-3.5 w-3.5" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            onClick={handleRunScenario}
            disabled={isRunning || !scenario}
          >
            <Play className="mr-2 h-3.5 w-3.5" />
            {isRunning ? "Running..." : "Run"}
          </Button>
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        <NodePalette />
        <div className="flex-1">
          <GraphEditor
            initialState={graphState}
            onStateChange={handleGraphStateChange}
            onNodeSelect={handleNodeSelect}
          />
        </div>
        {rightPanel === "chat" ? (
          <div className="w-80 border-l border-white/[0.08]">
            <ChatPanel scenarioId={id} />
          </div>
        ) : (
          <ConfigPanel
            node={selectedNode}
            onUpdate={handleNodeUpdate}
            onDelete={handleNodeDelete}
          />
        )}
      </div>
    </div>
  );
}
