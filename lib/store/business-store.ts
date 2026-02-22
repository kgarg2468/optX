import { create } from "zustand";
import type {
  BusinessData,
  DataSource,
  DataEntryMode,
  ExpenseCategory,
  IndustryType,
  BusinessSize,
  RevenueTrend,
  SeasonalPattern,
} from "@/lib/types";

interface BusinessState {
  // Current business data being edited
  businessData: Partial<BusinessData>;
  dataSources: DataSource[];
  dataEntryMode: DataEntryMode;
  isLoading: boolean;
  isSaving: boolean;

  // Quick Start form actions
  setField: <K extends keyof BusinessData>(key: K, value: BusinessData[K]) => void;
  setIndustry: (industry: IndustryType) => void;
  setSize: (size: BusinessSize) => void;
  setMonthlyRevenue: (revenue: number[]) => void;
  addExpense: (expense: ExpenseCategory) => void;
  removeExpense: (id: string) => void;
  updateExpense: (id: string, updates: Partial<ExpenseCategory>) => void;
  setRevenueTrend: (trend: RevenueTrend, rate?: number) => void;
  setSeasonalPatterns: (patterns: SeasonalPattern) => void;

  // Data sources
  addDataSource: (source: DataSource) => void;
  removeDataSource: (id: string) => void;
  updateDataSource: (id: string, updates: Partial<DataSource>) => void;

  // Mode
  setDataEntryMode: (mode: DataEntryMode) => void;

  // Persistence
  setBusinessData: (data: Partial<BusinessData>) => void;
  resetBusinessData: () => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
}

const initialBusinessData: Partial<BusinessData> = {
  name: "",
  industry: "other",
  size: "1-5",
  monthlyRevenue: [],
  expenses: [],
  cashOnHand: 0,
  outstandingDebt: 0,
};

export const useBusinessStore = create<BusinessState>((set) => ({
  businessData: { ...initialBusinessData },
  dataSources: [],
  dataEntryMode: "quick_start",
  isLoading: false,
  isSaving: false,

  setField: (key, value) =>
    set((state) => ({
      businessData: { ...state.businessData, [key]: value },
    })),

  setIndustry: (industry) =>
    set((state) => ({
      businessData: { ...state.businessData, industry },
    })),

  setSize: (size) =>
    set((state) => ({
      businessData: { ...state.businessData, size },
    })),

  setMonthlyRevenue: (monthlyRevenue) =>
    set((state) => ({
      businessData: { ...state.businessData, monthlyRevenue },
    })),

  addExpense: (expense) =>
    set((state) => ({
      businessData: {
        ...state.businessData,
        expenses: [...(state.businessData.expenses || []), expense],
      },
    })),

  removeExpense: (id) =>
    set((state) => ({
      businessData: {
        ...state.businessData,
        expenses: (state.businessData.expenses || []).filter((e) => e.id !== id),
      },
    })),

  updateExpense: (id, updates) =>
    set((state) => ({
      businessData: {
        ...state.businessData,
        expenses: (state.businessData.expenses || []).map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      },
    })),

  setRevenueTrend: (revenueTrend, revenueTrendRate) =>
    set((state) => ({
      businessData: { ...state.businessData, revenueTrend, revenueTrendRate },
    })),

  setSeasonalPatterns: (seasonalPatterns) =>
    set((state) => ({
      businessData: { ...state.businessData, seasonalPatterns },
    })),

  addDataSource: (source) =>
    set((state) => ({
      dataSources: [...state.dataSources, source],
    })),

  removeDataSource: (id) =>
    set((state) => ({
      dataSources: state.dataSources.filter((s) => s.id !== id),
    })),

  updateDataSource: (id, updates) =>
    set((state) => ({
      dataSources: state.dataSources.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),

  setDataEntryMode: (dataEntryMode) => set({ dataEntryMode }),
  setBusinessData: (data) =>
    set((state) => ({
      businessData: { ...state.businessData, ...data },
    })),
  resetBusinessData: () =>
    set({ businessData: { ...initialBusinessData }, dataSources: [] }),
  setLoading: (isLoading) => set({ isLoading }),
  setSaving: (isSaving) => set({ isSaving }),
}));
