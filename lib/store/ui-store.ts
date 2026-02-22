import { create } from "zustand";
import type { ActivePage } from "@/lib/types";

interface UIState {
  activePage: ActivePage;
  sidebarCollapsed: boolean;
  isCommandPaletteOpen: boolean;

  setActivePage: (page: ActivePage) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activePage: "dashboard",
  sidebarCollapsed: false,
  isCommandPaletteOpen: false,

  setActivePage: (activePage) => set({ activePage }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setCommandPaletteOpen: (isCommandPaletteOpen) =>
    set({ isCommandPaletteOpen }),
}));
