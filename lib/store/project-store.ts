import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ProjectSummary } from "@/lib/types";

interface ProjectState {
  projects: ProjectSummary[];
  activeProjectId: string | null;
  isLoading: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
  setActiveProject: (projectId: string | null) => void;
  clearActiveProject: () => void;
  upsertProject: (project: ProjectSummary) => void;
  renameProject: (projectId: string, name: string) => Promise<ProjectSummary>;
  deleteProject: (projectId: string) => Promise<void>;
}

function sortProjects(projects: ProjectSummary[]): ProjectSummary[] {
  return [...projects].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      isLoading: false,
      error: null,

      loadProjects: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch("/api/project");
          const payload = await res.json();
          if (!res.ok || !payload.success || !Array.isArray(payload.data)) {
            throw new Error(payload.error || "Failed to load projects");
          }

          const projects = sortProjects(payload.data as ProjectSummary[]);
          const activeProjectId = get().activeProjectId;
          const hasActive =
            activeProjectId !== null &&
            projects.some((project) => project.id === activeProjectId);

          set({
            projects,
            activeProjectId: hasActive ? activeProjectId : null,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error ? error.message : "Failed to load projects",
          });
        }
      },

      setActiveProject: (activeProjectId) => set({ activeProjectId }),
      clearActiveProject: () => set({ activeProjectId: null }),

      upsertProject: (project) =>
        set((state) => {
          const existing = state.projects.find((current) => current.id === project.id);
          const projects = existing
            ? state.projects.map((current) =>
                current.id === project.id ? { ...current, ...project } : current
              )
            : [...state.projects, project];

          return { projects: sortProjects(projects) };
        }),

      renameProject: async (projectId, name) => {
        const normalizedName = name.trim();
        if (!normalizedName) {
          throw new Error("Project name cannot be empty");
        }

        const res = await fetch("/api/project", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, name: normalizedName }),
        });
        const payload = await res.json();
        if (!res.ok || !payload.success || !payload.project) {
          throw new Error(payload.error || "Failed to rename project");
        }

        const project = payload.project as ProjectSummary;
        get().upsertProject(project);
        return project;
      },

      deleteProject: async (projectId) => {
        const res = await fetch(`/api/project?projectId=${projectId}`, {
          method: "DELETE",
        });
        const payload = await res.json();
        if (!res.ok || !payload.success) {
          throw new Error(payload.error || "Failed to delete project");
        }

        set((state) => ({
          projects: state.projects.filter((project) => project.id !== projectId),
          activeProjectId:
            state.activeProjectId === projectId ? null : state.activeProjectId,
        }));
      },
    }),
    {
      name: "optx-project-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
      }),
    }
  )
);
