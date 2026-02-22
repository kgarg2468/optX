import { create } from "zustand";
import type {
  SimulationConfig,
  SimulationResult,
  SimulationStatus,
} from "@/lib/types";

interface SimulationState {
  config: SimulationConfig;
  status: SimulationStatus;
  progress: number; // 0-100
  currentResult: SimulationResult | null;
  pastResults: SimulationResult[];
  error: string | null;

  setConfig: (config: Partial<SimulationConfig>) => void;
  setStatus: (status: SimulationStatus) => void;
  setProgress: (progress: number) => void;
  setResult: (result: SimulationResult) => void;
  addPastResult: (result: SimulationResult) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const defaultConfig: SimulationConfig = {
  iterations: 10000,
  timeHorizonMonths: 12,
  confidenceLevel: 0.95,
};

export const useSimulationStore = create<SimulationState>((set) => ({
  config: { ...defaultConfig },
  status: "idle",
  progress: 0,
  currentResult: null,
  pastResults: [],
  error: null,

  setConfig: (updates) =>
    set((state) => ({ config: { ...state.config, ...updates } })),

  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setResult: (result) => set({ currentResult: result }),
  addPastResult: (result) =>
    set((state) => ({ pastResults: [result, ...state.pastResults] })),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      config: { ...defaultConfig },
      status: "idle",
      progress: 0,
      currentResult: null,
      error: null,
    }),
}));
