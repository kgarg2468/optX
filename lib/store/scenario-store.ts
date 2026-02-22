import { create } from "zustand";
import type {
  Scenario,
  ScenarioVariable,
  GraphState,
  GraphNode,
  GraphEdge,
  SimulateViewMode,
} from "@/lib/types";

interface ScenarioState {
  currentScenario: Partial<Scenario> | null;
  scenarios: Scenario[];
  viewMode: SimulateViewMode;
  graphState: GraphState;

  // Scenario CRUD
  setCurrentScenario: (scenario: Partial<Scenario> | null) => void;
  setScenarios: (scenarios: Scenario[]) => void;
  addScenario: (scenario: Scenario) => void;
  removeScenario: (id: string) => void;

  // Scenario variables
  addVariable: (variable: ScenarioVariable) => void;
  removeVariable: (variableId: string) => void;
  updateVariable: (variableId: string, updates: Partial<ScenarioVariable>) => void;

  // Graph state
  setViewMode: (mode: SimulateViewMode) => void;
  setGraphState: (state: GraphState) => void;
  addNode: (node: GraphNode) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<GraphNode>) => void;
  addEdge: (edge: GraphEdge) => void;
  removeEdge: (id: string) => void;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  currentScenario: null,
  scenarios: [],
  viewMode: "wizard",
  graphState: { nodes: [], edges: [] },

  setCurrentScenario: (currentScenario) => set({ currentScenario }),
  setScenarios: (scenarios) => set({ scenarios }),
  addScenario: (scenario) =>
    set((state) => ({ scenarios: [...state.scenarios, scenario] })),
  removeScenario: (id) =>
    set((state) => ({
      scenarios: state.scenarios.filter((s) => s.id !== id),
    })),

  addVariable: (variable) =>
    set((state) => ({
      currentScenario: state.currentScenario
        ? {
            ...state.currentScenario,
            variables: [...(state.currentScenario.variables || []), variable],
          }
        : null,
    })),

  removeVariable: (variableId) =>
    set((state) => ({
      currentScenario: state.currentScenario
        ? {
            ...state.currentScenario,
            variables: (state.currentScenario.variables || []).filter(
              (v) => v.variableId !== variableId
            ),
          }
        : null,
    })),

  updateVariable: (variableId, updates) =>
    set((state) => ({
      currentScenario: state.currentScenario
        ? {
            ...state.currentScenario,
            variables: (state.currentScenario.variables || []).map((v) =>
              v.variableId === variableId ? { ...v, ...updates } : v
            ),
          }
        : null,
    })),

  setViewMode: (viewMode) => set({ viewMode }),
  setGraphState: (graphState) => set({ graphState }),
  addNode: (node) =>
    set((state) => ({
      graphState: {
        ...state.graphState,
        nodes: [...state.graphState.nodes, node],
      },
    })),
  removeNode: (id) =>
    set((state) => ({
      graphState: {
        ...state.graphState,
        nodes: state.graphState.nodes.filter((n) => n.id !== id),
        edges: state.graphState.edges.filter(
          (e) => e.source !== id && e.target !== id
        ),
      },
    })),
  updateNode: (id, updates) =>
    set((state) => ({
      graphState: {
        ...state.graphState,
        nodes: state.graphState.nodes.map((n) =>
          n.id === id ? { ...n, ...updates } : n
        ),
      },
    })),
  addEdge: (edge) =>
    set((state) => ({
      graphState: {
        ...state.graphState,
        edges: [...state.graphState.edges, edge],
      },
    })),
  removeEdge: (id) =>
    set((state) => ({
      graphState: {
        ...state.graphState,
        edges: state.graphState.edges.filter((e) => e.id !== id),
      },
    })),
}));
