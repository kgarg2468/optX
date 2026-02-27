"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, PanelRightClose, PanelRightOpen, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NODE_CONFIGS } from "@/lib/utils/node-config";
import { CausalNode } from "./CausalNode";
import type { CausalNodeData } from "./CausalNode";
import { StringEdge } from "./StringEdge";
import { NodeHoverPopover } from "./NodeHoverPopover";
import { ExplorationDetailPanel } from "./ExplorationDetailPanel";
import { generateMockReport } from "@/lib/mock/report-data";
import type { MockScenarioDetail, MockCausalNode } from "@/lib/mock/simulation-scenarios";

const nodeTypes = { causal: CausalNode };
const edgeTypes = { string: StringEdge };

function buildNodes(
  scenario: MockScenarioDetail,
  pinnedNodeIds: Set<string>,
  onTogglePin: (nodeId: string) => void
): Node[] {
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
      id: n.id,
      isPinned: pinnedNodeIds.has(n.id),
      onTogglePin,
    } satisfies CausalNodeData,
  }));
}

function buildEdges(scenario: MockScenarioDetail): Edge[] {
  return scenario.edges.map((e) => {
    const sourceNode = scenario.nodes.find((n) => n.id === e.source);
    const config = sourceNode ? NODE_CONFIGS[sourceNode.category] : null;
    const color = config ? `hsl(var(--${config.color}))` : "hsl(var(--muted-foreground))";

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      type: "string",
      data: {
        color,
        strength: e.strength,
        label: e.label,
      },
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
  const router = useRouter();
  const [selectedNode, setSelectedNode] = useState<MockCausalNode | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  // Pin state
  const [pinnedNodeIds, setPinnedNodeIds] = useState<Set<string>>(new Set());
  const togglePinRef = useRef<(nodeId: string) => void>(() => {});
  togglePinRef.current = useCallback(
    (nodeId: string) => {
      setPinnedNodeIds((prev) => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }
        return next;
      });
    },
    []
  );
  const stableTogglePin = useCallback((nodeId: string) => {
    togglePinRef.current(nodeId);
  }, []);

  // Hover state
  const [hoveredNode, setHoveredNode] = useState<MockCausalNode | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const initialEdges = useMemo(() => buildEdges(scenario), [scenario]);
  const nodes = useMemo(
    () => buildNodes(scenario, pinnedNodeIds, stableTogglePin),
    [scenario, pinnedNodeIds, stableTogglePin]
  );

  const [rfNodes, , onNodesChange] = useNodesState(nodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes when pinned state changes
  useMemo(() => {
    // This is handled by the dependency on pinnedNodeIds in the nodes memo
  }, [pinnedNodeIds]);

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

  const handleNodeMouseEnter = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        const mockNode = scenario.nodes.find((n) => n.id === node.id);
        if (mockNode && reactFlowInstance) {
          const screenPos = reactFlowInstance.flowToScreenPosition(node.position);
          setHoverPosition({ x: screenPos.x + 220, y: screenPos.y });
          setHoveredNode(mockNode);
        }
      }, 300);
    },
    [scenario, reactFlowInstance]
  );

  const handleNodeMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredNode(null);
  }, []);

  const handleGenerateReport = useCallback(() => {
    const report = generateMockReport(scenario);
    router.push(`/report/${report.id}`);
  }, [scenario, router]);

  const pinnedNodes = useMemo(
    () => scenario.nodes.filter((n) => pinnedNodeIds.has(n.id)),
    [scenario.nodes, pinnedNodeIds]
  );

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
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            onNodeMouseEnter={handleNodeMouseEnter}
            onNodeMouseLeave={handleNodeMouseLeave}
            onInit={(instance) => setReactFlowInstance(instance)}
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

          {/* Hover popover */}
          {hoveredNode && (
            <NodeHoverPopover node={hoveredNode} position={hoverPosition} />
          )}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-border/50 bg-card/50 backdrop-blur-sm px-4 py-2.5">
          <p className="text-xs text-muted-foreground">
            {scenario.nodes.length} nodes &middot; {scenario.edges.length} connections &middot; {scenario.confidence}% confidence
          </p>
          <Button size="sm" className="h-8 gap-1.5" onClick={handleGenerateReport}>
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
            pinnedNodes={pinnedNodes}
            onUnpin={stableTogglePin}
          />
        </div>
      )}
    </div>
  );
}
