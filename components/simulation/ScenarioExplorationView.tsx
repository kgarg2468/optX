"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, PanelRightClose, PanelRightOpen, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NODE_CONFIGS } from "@/lib/utils/node-config";
import { CausalNode } from "./CausalNode";
import type { CausalNodeData } from "./CausalNode";
import { ExplorationDetailPanel } from "./ExplorationDetailPanel";
import type { MockScenarioDetail, MockCausalNode } from "@/lib/mock/simulation-scenarios";

const nodeTypes = { causal: CausalNode };

function buildNodes(scenario: MockScenarioDetail): Node[] {
  return scenario.nodes.map((n) => ({
    id: n.id,
    type: "causal",
    position: n.position,
    data: {
      label: n.label,
      category: n.category,
      currentValue: n.currentValue,
      proposedValue: n.proposedValue,
      delta: n.delta,
    } satisfies CausalNodeData,
  }));
}

function buildEdges(scenario: MockScenarioDetail): Edge[] {
  return scenario.edges.map((e) => {
    // Determine color from source node category
    const sourceNode = scenario.nodes.find((n) => n.id === e.source);
    const config = sourceNode ? NODE_CONFIGS[sourceNode.category] : null;
    const color = config ? `hsl(var(--${config.color}))` : "hsl(var(--muted-foreground))";

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      animated: e.strength > 0.6,
      style: {
        stroke: color,
        strokeWidth: Math.max(1.5, e.strength * 3),
        opacity: 0.5 + e.strength * 0.5,
      },
      label: e.label,
      labelStyle: { fill: "hsl(var(--muted-foreground))", fontSize: 10 },
      labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.8 },
    };
  });
}

interface ScenarioExplorationViewProps {
  scenario: MockScenarioDetail;
  onBack: () => void;
}

export function ScenarioExplorationView({
  scenario,
  onBack,
}: ScenarioExplorationViewProps) {
  const initialNodes = useMemo(() => buildNodes(scenario), [scenario]);
  const initialEdges = useMemo(() => buildEdges(scenario), [scenario]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const [selectedNode, setSelectedNode] = useState<MockCausalNode | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const mockNode = scenario.nodes.find((n) => n.id === node.id) ?? null;
      setSelectedNode(mockNode);
      if (!panelOpen) setPanelOpen(true);
    },
    [scenario, panelOpen]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Main canvas area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border/50 bg-card/50 backdrop-blur-sm px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <div className="h-4 w-px bg-border" />
            <h2 className="text-sm font-semibold">{scenario.title}</h2>
            <Badge
              variant={scenario.recommended ? "default" : "secondary"}
              className={cn(
                "text-[10px]",
                scenario.recommended &&
                  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              )}
            >
              {scenario.tag}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setPanelOpen(!panelOpen)}
            >
              {panelOpen ? (
                <PanelRightClose className="h-3.5 w-3.5" />
              ) : (
                <PanelRightOpen className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* ReactFlow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
            colorMode="dark"
            minZoom={0.3}
            maxZoom={1.5}
          >
            <Background color="hsl(var(--muted-foreground))" gap={24} size={1} />
            <Controls
              className="!bg-card/80 !border-border/50 !shadow-lg [&>button]:!bg-card [&>button]:!border-border/50 [&>button]:!text-muted-foreground [&>button:hover]:!bg-muted"
              showInteractive={false}
            />
          </ReactFlow>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-border/50 bg-card/50 backdrop-blur-sm px-4 py-2.5">
          <p className="text-xs text-muted-foreground">
            {scenario.nodes.length} nodes &middot; {scenario.edges.length} connections &middot; {scenario.confidence}% confidence
          </p>
          <Button size="sm" className="h-8 gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Right panel */}
      {panelOpen && (
        <div className="w-80 shrink-0">
          <ExplorationDetailPanel
            scenario={scenario}
            selectedNode={selectedNode}
            onClose={() => setPanelOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
