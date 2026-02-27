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
import { ArrowLeft, PanelRightClose, PanelRightOpen, FileText, Loader2 } from "lucide-react";
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
import type { ScenarioDetail, CausalNode as CausalNodeType } from "@/lib/types";
import {
  LUMINA_BUSINESS_ID,
  LUMINA_REPORT_ROWS,
} from "@/lib/seed/lumina-seed";

const nodeTypes = { causal: CausalNode };
const edgeTypes = { string: StringEdge };

function buildNodes(
  scenario: ScenarioDetail,
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

function buildEdges(scenario: ScenarioDetail): Edge[] {
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
  scenario: ScenarioDetail;
  businessId: string;
  onBack: () => void;
}

export function ScenarioExplorationView({
  scenario,
  businessId,
  onBack,
}: ScenarioExplorationViewProps) {
  const router = useRouter();
  const [selectedNode, setSelectedNode] = useState<CausalNodeType | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Pin state
  const [pinnedNodeIds, setPinnedNodeIds] = useState<Set<string>>(new Set());
  const togglePinRef = useRef<(nodeId: string) => void>(() => { });
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
  const [hoveredNode, setHoveredNode] = useState<CausalNodeType | null>(null);
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

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const causalNode = scenario.nodes.find((n) => n.id === node.id) ?? null;
      setSelectedNode(causalNode);
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
        const causalNode = scenario.nodes.find((n) => n.id === node.id);
        if (causalNode && reactFlowInstance) {
          const screenPos = reactFlowInstance.flowToScreenPosition(node.position);
          setHoverPosition({ x: screenPos.x, y: screenPos.y + 120 });
          setHoveredNode(causalNode);
        }
      }, 300);
    },
    [scenario, reactFlowInstance]
  );

  const handleNodeMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredNode(null);
  }, []);

  const handleGenerateReport = useCallback(async () => {
    // For Lumina, check if report already exists (use seed data)
    if (businessId === LUMINA_BUSINESS_ID) {
      const luminaReport = LUMINA_REPORT_ROWS.find(
        (r) => r.scenario_detail?.id === scenario.id
      );
      if (luminaReport) {
        router.push(`/report/${luminaReport.id}`);
        return;
      }
    }

    // For other projects, generate report via API
    setIsGeneratingReport(true);
    try {
      // First, we need a simulation — check if one exists for this scenario
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          simulationId: scenario.id, // scenario ID doubles as sim ref for seeded data
          scenarioDetail: scenario,
        }),
      });
      const payload = await res.json();
      if (payload.success && payload.data?.id) {
        router.push(`/report/${payload.data.id}`);
      }
    } catch {
      // fallback
    } finally {
      setIsGeneratingReport(false);
    }
  }, [scenario, router, businessId]);

  const pinnedNodes = useMemo(
    () => scenario.nodes.filter((n) => pinnedNodeIds.has(n.id)),
    [scenario.nodes, pinnedNodeIds]
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Main canvas area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-sm px-4 py-2.5">
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
            <div className="h-4 w-px bg-white/[0.08]" />
            <h2 className="text-sm font-semibold font-playfair">{scenario.title}</h2>
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
              className="!bg-white/[0.05] !border-white/[0.08] !shadow-lg [&>button]:!bg-white/[0.03] [&>button]:!border-white/[0.08] [&>button]:!text-muted-foreground [&>button:hover]:!bg-white/[0.08]"
              showInteractive={false}
            />
          </ReactFlow>

          {/* Hover popover */}
          {hoveredNode && (
            <NodeHoverPopover node={hoveredNode} position={hoverPosition} />
          )}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-white/[0.08] bg-white/[0.02] backdrop-blur-sm px-4 py-2.5">
          <p className="text-xs text-muted-foreground">
            {scenario.nodes.length} nodes &middot; {scenario.edges.length} connections &middot; {scenario.confidence}% confidence
          </p>
          <Button
            size="sm"
            className="h-8 gap-1.5"
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
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
            businessId={businessId}
          />
        </div>
      )}
    </div>
  );
}
