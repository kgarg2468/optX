import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
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
  isDirty: boolean;
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
  setDataSources: (
    sources: DataSource[],
    options?: { markDirty?: boolean }
  ) => void;
  removeDataSource: (id: string) => void;
  updateDataSource: (id: string, updates: Partial<DataSource>) => void;

  // Mode
  setDataEntryMode: (mode: DataEntryMode) => void;

  // Persistence
  setBusinessData: (
    data: Partial<BusinessData>,
    options?: { markDirty?: boolean }
  ) => void;
  resetBusinessData: () => void;
  markClean: () => void;
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

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set) => ({
      businessData: { ...initialBusinessData },
      dataSources: [],
      dataEntryMode: "quick_start",
      isDirty: false,
      isLoading: false,
      isSaving: false,

      setField: (key, value) =>
        set((state) => ({
          businessData: { ...state.businessData, [key]: value },
          isDirty: true,
        })),

      setIndustry: (industry) =>
        set((state) => ({
          businessData: { ...state.businessData, industry },
          isDirty: true,
        })),

      setSize: (size) =>
        set((state) => ({
          businessData: { ...state.businessData, size },
          isDirty: true,
        })),

      setMonthlyRevenue: (monthlyRevenue) =>
        set((state) => ({
          businessData: { ...state.businessData, monthlyRevenue },
          isDirty: true,
        })),

      addExpense: (expense) =>
        set((state) => ({
          businessData: {
            ...state.businessData,
            expenses: [...(state.businessData.expenses || []), expense],
          },
          isDirty: true,
        })),

      removeExpense: (id) =>
        set((state) => ({
          businessData: {
            ...state.businessData,
            expenses: (state.businessData.expenses || []).filter((e) => e.id !== id),
          },
          isDirty: true,
        })),

      updateExpense: (id, updates) =>
        set((state) => ({
          businessData: {
            ...state.businessData,
            expenses: (state.businessData.expenses || []).map((e) =>
              e.id === id ? { ...e, ...updates } : e
            ),
          },
          isDirty: true,
        })),

      setRevenueTrend: (revenueTrend, revenueTrendRate) =>
        set((state) => ({
          businessData: { ...state.businessData, revenueTrend, revenueTrendRate },
          isDirty: true,
        })),

      setSeasonalPatterns: (seasonalPatterns) =>
        set((state) => ({
          businessData: { ...state.businessData, seasonalPatterns },
          isDirty: true,
        })),

      addDataSource: (source) =>
        set((state) => ({
          dataSources: [...state.dataSources, source],
          isDirty: true,
        })),
      setDataSources: (dataSources, options) =>
        set({
          dataSources,
          isDirty: options?.markDirty ?? false,
        }),

      removeDataSource: (id) =>
        set((state) => ({
          dataSources: state.dataSources.filter((s) => s.id !== id),
          isDirty: true,
        })),

      updateDataSource: (id, updates) =>
        set((state) => ({
          dataSources: state.dataSources.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
          isDirty: true,
        })),

      setDataEntryMode: (dataEntryMode) => set({ dataEntryMode }),
      setBusinessData: (data, options) =>
        set((state) => ({
          businessData: { ...state.businessData, ...data },
          isDirty: options?.markDirty ?? false,
        })),
      resetBusinessData: () =>
        set({
          businessData: { ...initialBusinessData },
          dataSources: [],
          isDirty: false,
        }),
      markClean: () => set({ isDirty: false }),
      setLoading: (isLoading) => set({ isLoading }),
      setSaving: (isSaving) => set({ isSaving }),
    }),
    {
      name: "optx-business-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        businessData: state.businessData,
        dataSources: state.dataSources,
        dataEntryMode: state.dataEntryMode,
        isDirty: state.isDirty,
      }),
    }
  )
);
