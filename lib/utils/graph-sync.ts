import type {
  ScenarioVariable,
  GraphState,
  GraphNode,
  GraphNodeType,
} from "@/lib/types";

const GRID_COLS = 3;
const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const GAP_X = 60;
const GAP_Y = 40;

function categoryToNodeType(category?: string): GraphNodeType {
  const map: Record<string, GraphNodeType> = {
    revenue: "financial",
    cost: "financial",
    margin: "financial",
    finance: "financial",
    financial: "financial",
    market: "market",
    demand: "market",
    pricing: "market",
    competition: "market",
    brand: "brand",
    perception: "brand",
    loyalty: "brand",
    operations: "operations",
    supply: "operations",
    staffing: "operations",
    capacity: "operations",
    kpi: "metric",
    metric: "metric",
    output: "metric",
    target: "metric",
  };
  const lower = (category || "").toLowerCase();
  return map[lower] ?? "financial";
}

/** Convert scenario variables into a graph with auto-laid-out nodes */
export function variablesToGraph(variables: ScenarioVariable[]): GraphState {
  const nodes: GraphNode[] = variables.map((v, i) => {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    const nodeType = categoryToNodeType(v.category);
    return {
      id: `node-${v.variableId}`,
      type: nodeType,
      position: {
        x: 80 + col * (NODE_WIDTH + GAP_X),
        y: 80 + row * (NODE_HEIGHT + GAP_Y),
      },
      data: {
        label: v.name,
        type: nodeType,
        variableId: v.variableId,
        value: v.modifiedValue,
        unit: v.unit,
      },
    };
  });

  return { nodes, edges: [] };
}

/** Extract variable values from graph node data back to scenario variables */
export function graphToVariables(
  graphState: GraphState,
  existingVariables: ScenarioVariable[]
): ScenarioVariable[] {
  const nodeMap = new Map(
    graphState.nodes
      .filter((n) => n.data.variableId)
      .map((n) => [n.data.variableId!, n])
  );

  return existingVariables.map((v) => {
    const node = nodeMap.get(v.variableId);
    if (node && node.data.value !== undefined) {
      return { ...v, modifiedValue: node.data.value };
    }
    return v;
  });
}
