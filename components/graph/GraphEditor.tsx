"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "./nodes";
import type { GraphNodeType, GraphNodeData, GraphState } from "@/lib/types";
import { NODE_CONFIGS } from "@/lib/utils/node-config";

interface GraphEditorProps {
  initialState?: GraphState;
  onStateChange?: (state: GraphState) => void;
  onNodeSelect?: (nodeId: string | null) => void;
}

export function GraphEditor({
  initialState,
  onStateChange,
  onNodeSelect,
}: GraphEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(
    (initialState?.nodes ?? []) as unknown as Node[]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    (initialState?.edges ?? []) as unknown as Edge[]
  );

  useEffect(() => {
    setNodes((initialState?.nodes ?? []) as unknown as Node[]);
    setEdges((initialState?.edges ?? []) as unknown as Edge[]);
  }, [initialState, setNodes, setEdges]);

  const syncState = useCallback(
    (nextNodes: Node[], nextEdges: Edge[]) => {
      onStateChange?.({
        nodes: nextNodes.map((n) => ({
          id: n.id,
          type: n.type ?? "financial",
          position: n.position,
          data: n.data as unknown as GraphNodeData,
        })),
        edges: nextEdges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: typeof e.label === "string" ? e.label : undefined,
          animated: e.animated,
        })),
      });
    },
    [onStateChange]
  );

  const handleNodesChange: typeof onNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      // Defer sync to after state update
      setTimeout(() => {
        const { getNodes, getEdges } = rfInstance ?? {};
        if (getNodes && getEdges) {
          syncState(getNodes(), getEdges());
        }
      }, 0);
    },
    [onNodesChange, rfInstance, syncState]
  );

  const handleEdgesChange: typeof onEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
      setTimeout(() => {
        const { getNodes, getEdges } = rfInstance ?? {};
        if (getNodes && getEdges) {
          syncState(getNodes(), getEdges());
        }
      }, 0);
    },
    [onEdgesChange, rfInstance, syncState]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const next = addEdge(
          { ...connection, animated: true, id: `edge-${crypto.randomUUID()}` },
          eds
        );
        setTimeout(() => {
          const allNodes = rfInstance?.getNodes() ?? [];
          syncState(allNodes as Node[], next);
        }, 0);
        return next;
      });
    },
    [setEdges, rfInstance, syncState]
  );

  const onSelectionChange = useCallback(
    ({ nodes: selected }: { nodes: Node[] }) => {
      onNodeSelect?.(selected.length === 1 ? selected[0].id : null);
    },
    [onNodeSelect]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData(
        "application/reactflow-type"
      ) as GraphNodeType;
      if (!type || !rfInstance || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = rfInstance.screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });

      const config = NODE_CONFIGS[type];
      const newNode: Node = {
        id: `node-${crypto.randomUUID()}`,
        type,
        position,
        data: {
          label: config.label,
          type,
          value: undefined,
          unit: "",
        } satisfies GraphNodeData,
      };

      setNodes((nds) => {
        const next = [...nds, newNode];
        syncState(next, edges);
        return next;
      });
    },
    [rfInstance, setNodes, edges, syncState]
  );

  return (
    <div ref={reactFlowWrapper} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onInit={setRfInstance}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
        className="bg-forest-950"
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} className="!bg-forest-950" />
        <Controls className="!bg-white/[0.05] !backdrop-blur-xl !border-white/[0.08] !shadow-sm [&>button]:!bg-white/[0.05] [&>button]:!border-white/[0.08] [&>button]:!text-foreground [&>button:hover]:!bg-white/[0.1]" />
        <MiniMap
          className="!bg-white/[0.05] !backdrop-blur-xl !border-white/[0.08]"
          nodeColor={(n) => {
            const type = (n.data as unknown as GraphNodeData)?.type ?? "financial";
            const colors: Record<string, string> = {
              financial: "#C5D46A",   // lime-400
              market: "#34D399",      // emerald-400
              brand: "#38BDF8",       // sky-400
              operations: "#FB7185",  // rose-400
              logic: "#94A3B8",       // slate-400
              metric: "#FBBF24",      // amber-400
            };
            return colors[type] ?? "#94A3B8";
          }}
        />
      </ReactFlow>
    </div>
  );
}
