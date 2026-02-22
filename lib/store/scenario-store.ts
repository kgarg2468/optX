import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Scenario,
  ScenarioVariable,
  GraphState,
  GraphNode,
  GraphEdge,
  SimulateViewMode,
} from "@/lib/types";

function createEmptyGraphState(): GraphState {
  return { nodes: [], edges: [] };
}

function withGraphState(scenario: Scenario): Scenario {
  return {
    ...scenario,
    graphState: scenario.graphState ?? createEmptyGraphState(),
  };
}

interface ScenarioState {
  currentScenario: Partial<Scenario> | null;
  scenarios: Scenario[];
  viewMode: SimulateViewMode;

  // Scenario CRUD
  setCurrentScenario: (scenario: Partial<Scenario> | null) => void;
  setScenarios: (scenarios: Scenario[]) => void;
  addScenario: (scenario: Scenario) => void;
  updateScenario: (id: string, updates: Partial<Scenario>) => void;
  removeScenario: (id: string) => void;

  // Scenario variables
  addVariable: (variable: ScenarioVariable) => void;
  removeVariable: (variableId: string) => void;
  updateVariable: (variableId: string, updates: Partial<ScenarioVariable>) => void;

  // Graph state scoped by scenario
  setViewMode: (mode: SimulateViewMode) => void;
  getGraphState: (scenarioId: string) => GraphState;
  setGraphState: (scenarioId: string, state: GraphState) => void;
  addNode: (scenarioId: string, node: GraphNode) => void;
  removeNode: (scenarioId: string, id: string) => void;
  updateNode: (scenarioId: string, id: string, updates: Partial<GraphNode>) => void;
  addEdge: (scenarioId: string, edge: GraphEdge) => void;
  removeEdge: (scenarioId: string, id: string) => void;
}

export const useScenarioStore = create<ScenarioState>()(
  persist(
    (set, get) => ({
      currentScenario: null,
      scenarios: [],
      viewMode: "wizard",

      setCurrentScenario: (currentScenario) => set({ currentScenario }),
      setScenarios: (scenarios) =>
        set({ scenarios: scenarios.map(withGraphState) }),
      addScenario: (scenario) =>
        set((state) => {
          const normalized = withGraphState(scenario);
          const existingIndex = state.scenarios.findIndex(
            (current) => current.id === normalized.id
          );
          if (existingIndex === -1) {
            return { scenarios: [...state.scenarios, normalized] };
          }
          return {
            scenarios: state.scenarios.map((current) =>
              current.id === normalized.id ? normalized : current
            ),
          };
        }),
      updateScenario: (id, updates) =>
        set((state) => ({
          scenarios: state.scenarios.map((scenario) =>
            scenario.id === id ? withGraphState({ ...scenario, ...updates }) : scenario
          ),
        })),
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
      getGraphState: (scenarioId) => {
        const scenario = get().scenarios.find((s) => s.id === scenarioId);
        return scenario?.graphState ?? createEmptyGraphState();
      },
      setGraphState: (scenarioId, graphState) =>
        set((state) => ({
          scenarios: state.scenarios.map((scenario) =>
            scenario.id === scenarioId
              ? {
                  ...scenario,
                  graphState,
                  updatedAt: new Date().toISOString(),
                }
              : scenario
          ),
        })),
      addNode: (scenarioId, node) =>
        set((state) => ({
          scenarios: state.scenarios.map((scenario) => {
            if (scenario.id !== scenarioId) return scenario;
            const graphState = scenario.graphState ?? createEmptyGraphState();
            return {
              ...scenario,
              graphState: {
                ...graphState,
                nodes: [...graphState.nodes, node],
              },
              updatedAt: new Date().toISOString(),
            };
          }),
        })),
      removeNode: (scenarioId, id) =>
        set((state) => ({
          scenarios: state.scenarios.map((scenario) => {
            if (scenario.id !== scenarioId) return scenario;
            const graphState = scenario.graphState ?? createEmptyGraphState();
            return {
              ...scenario,
              graphState: {
                ...graphState,
                nodes: graphState.nodes.filter((n) => n.id !== id),
                edges: graphState.edges.filter((e) => e.source !== id && e.target !== id),
              },
              updatedAt: new Date().toISOString(),
            };
          }),
        })),
      updateNode: (scenarioId, id, updates) =>
        set((state) => ({
          scenarios: state.scenarios.map((scenario) => {
            if (scenario.id !== scenarioId) return scenario;
            const graphState = scenario.graphState ?? createEmptyGraphState();
            return {
              ...scenario,
              graphState: {
                ...graphState,
                nodes: graphState.nodes.map((n) =>
                  n.id === id ? { ...n, ...updates } : n
                ),
              },
              updatedAt: new Date().toISOString(),
            };
          }),
        })),
      addEdge: (scenarioId, edge) =>
        set((state) => ({
          scenarios: state.scenarios.map((scenario) => {
            if (scenario.id !== scenarioId) return scenario;
            const graphState = scenario.graphState ?? createEmptyGraphState();
            return {
              ...scenario,
              graphState: {
                ...graphState,
                edges: [...graphState.edges, edge],
              },
              updatedAt: new Date().toISOString(),
            };
          }),
        })),
      removeEdge: (scenarioId, id) =>
        set((state) => ({
          scenarios: state.scenarios.map((scenario) => {
            if (scenario.id !== scenarioId) return scenario;
            const graphState = scenario.graphState ?? createEmptyGraphState();
            return {
              ...scenario,
              graphState: {
                ...graphState,
                edges: graphState.edges.filter((e) => e.id !== id),
              },
              updatedAt: new Date().toISOString(),
            };
          }),
        })),
    }),
    {
      name: "optx-scenario-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        scenarios: state.scenarios,
        viewMode: state.viewMode,
      }),
    }
  )
);
