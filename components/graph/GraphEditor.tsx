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
        className="bg-background"
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} className="!bg-background" />
        <Controls className="!bg-card !border-border !shadow-sm [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground" />
        <MiniMap
          className="!bg-card !border-border"
          nodeColor={(n) => {
            const type = (n.data as unknown as GraphNodeData)?.type ?? "financial";
            const colors: Record<string, string> = {
              financial: "hsl(160 40% 50%)",
              market: "hsl(250 50% 60%)",
              brand: "hsl(300 55% 60%)",
              operations: "hsl(30 60% 55%)",
              logic: "hsl(0 0% 55%)",
              metric: "hsl(70 45% 55%)",
            };
            return colors[type] ?? "hsl(0 0% 50%)";
          }}
        />
      </ReactFlow>
    </div>
  );
}
