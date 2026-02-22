"use client";

import { use, useState, useCallback, useEffect, useMemo } from "react";
import { ArrowLeft, Play, Save, MessageSquare, Settings2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useScenarioStore } from "@/lib/store/scenario-store";
import { GraphEditor } from "@/components/graph/GraphEditor";
import { NodePalette } from "@/components/graph/NodePalette";
import { ConfigPanel } from "@/components/graph/ConfigPanel";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { variablesToGraph } from "@/lib/utils/graph-sync";
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
    graphState,
    setGraphState,
    updateNode,
    removeNode,
  } = useScenarioStore();

  const scenario = useMemo(
    () => scenarios.find((s) => s.id === id),
    [scenarios, id]
  );

  const [rightPanel, setRightPanel] = useState<RightPanel>("chat");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Initialize graph from scenario variables if graph is empty
  useEffect(() => {
    if (scenario && graphState.nodes.length === 0 && scenario.variables.length > 0) {
      setGraphState(variablesToGraph(scenario.variables));
    }
  }, [scenario, graphState.nodes.length, setGraphState]);

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
      updateNode(nodeId, updates);
    },
    [updateNode]
  );

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      removeNode(nodeId);
      setSelectedNodeId(null);
      setRightPanel("chat");
    },
    [removeNode]
  );

  const handleGraphStateChange = useCallback(
    (state: GraphState) => {
      setGraphState(state);
    },
    [setGraphState]
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col -m-6">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
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
          <Button variant="outline" size="sm">
            <Save className="mr-2 h-3.5 w-3.5" />
            Save
          </Button>
          <Button size="sm">
            <Play className="mr-2 h-3.5 w-3.5" />
            Run
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
          <div className="w-80 border-l border-border">
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
