"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickStartForm } from "@/components/data/QuickStartForm";
import { DataBoxGrid } from "@/components/data/DataBoxGrid";
import { ProjectListView } from "@/components/projects/ProjectListView";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectSwitchGuard } from "@/components/projects/ProjectSwitchGuard";
import { useBusinessStore } from "@/lib/store/business-store";
import { useProjectStore } from "@/lib/store/project-store";

function DataPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");
  const isNewProjectFlow = searchParams.get("new") === "1";

  const {
    dataEntryMode,
    setDataEntryMode,
    setBusinessData,
    setDataSources,
    resetBusinessData,
    isDirty,
    markClean,
  } = useBusinessStore();

  const {
    projects,
    isLoading,
    error,
    loadProjects,
    setActiveProject,
    clearActiveProject,
    renameProject,
    deleteProject,
    upsertProject,
  } = useProjectStore();

  const [guardOpen, setGuardOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const wasNewFlow = useRef(false);

  const selectedProject =
    projectId ? projects.find((project) => project.id === projectId) ?? null : null;

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (projectId) {
      setActiveProject(projectId);
      return;
    }

    if (!isNewProjectFlow) {
      clearActiveProject();
    }
  }, [projectId, isNewProjectFlow, setActiveProject, clearActiveProject]);

  useEffect(() => {
    if (!isNewProjectFlow || wasNewFlow.current) {
      wasNewFlow.current = isNewProjectFlow;
      return;
    }

    resetBusinessData();
    markClean();
    clearActiveProject();
    setLoadError(null);
    wasNewFlow.current = true;
  }, [isNewProjectFlow, resetBusinessData, markClean, clearActiveProject]);

  useEffect(() => {
    if (!projectId) {
      setLoadError(null);
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
        const res = await fetch(`/api/data?businessId=${projectId}`, {
          signal: controller.signal,
        });
        const payload = await res.json();

        if (!res.ok || !payload.success) {
          throw new Error(payload.error || "Failed to load project data");
        }

        if (payload.business) {
          setBusinessData(payload.business, { markDirty: false });
        }

        if (payload.dataSources) {
          setDataSources(payload.dataSources, { markDirty: false });
        }

        markClean();
        setLoadError(null);
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error ? error.message : "Failed to load project data"
        );
        router.replace("/data");
      }
    };

    void load();
    return () => controller.abort();
  }, [projectId, router, setBusinessData, setDataSources, markClean]);

  const attemptNavigation = (path: string) => {
    if (path === `/data?project=${projectId}`) return;

    if (isDirty) {
      setPendingPath(path);
      setGuardOpen(true);
      return;
    }

    router.push(path);
  };

  const handleDiscardAndContinue = () => {
    const path = pendingPath;
    setGuardOpen(false);
    setPendingPath(null);
    markClean();
    if (path) {
      router.push(path);
    }
  };

  const handleProjectDelete = async (targetProjectId: string) => {
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteProject(targetProjectId);
      resetBusinessData();
      markClean();
      router.push("/");
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete project"
      );
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  if (!projectId && !isNewProjectFlow) {
    return (
      <ProjectListView
        title="Data Projects"
        description="Choose a project to manage business data, or create a new one."
        projects={projects}
        isLoading={isLoading}
        error={error}
        onRetry={() => void loadProjects()}
        onCreate={() => attemptNavigation("/data?new=1")}
        onSelect={(id) => attemptNavigation(`/data?project=${id}`)}
      />
    );
  }

  return (
    <div className="space-y-12 max-w-6xl mx-auto px-2 py-8">
      <ProjectHeader
        project={selectedProject}
        projects={projects}
        onBackToProjects={() => attemptNavigation("/data")}
        onSelectProject={(id) => attemptNavigation(`/data?project=${id}`)}
        onCreateProject={() => attemptNavigation("/data?new=1")}
        onRenameProject={
          selectedProject
            ? async (id, name) => {
              setIsRenaming(true);
              try {
                const updated = await renameProject(id, name);
                if (projectId === updated.id) {
                  setBusinessData(
                    { name: updated.name },
                    { markDirty: isDirty }
                  );
                }
              } finally {
                setIsRenaming(false);
              }
            }
            : undefined
        }
        onDeleteProject={
          selectedProject ? (id) => handleProjectDelete(id) : undefined
        }
        isRenaming={isRenaming}
        isDeleting={isDeleting}
        deleteError={deleteError}
      />

      <div className="space-y-2">
        <h2 className="text-4xl font-bold tracking-tighter text-white">Data Ingestion</h2>
        <p className="text-base text-white/40 font-medium max-w-2xl leading-relaxed">
          Supply business drivers for the selected project. OptX accepts raw CSV streams or structured quick-start profiles.
        </p>
      </div>

      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      <div className="bg-[#1A1A1A]/40 backdrop-blur-3xl border border-white/5 rounded-3xl p-8 shadow-2xl">
        <Tabs
          value={dataEntryMode}
          onValueChange={(value) => setDataEntryMode(value as "quick_start" | "advanced")}
        >
          <TabsList className="mb-8">
            <TabsTrigger value="quick_start">Quick Start</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Data Sources</TabsTrigger>
          </TabsList>
          <TabsContent value="quick_start" className="mt-0">
            <QuickStartForm
              onSaved={(savedBusiness) => {
                const sourceProject = selectedProject;
                upsertProject({
                  id: savedBusiness.id,
                  name: savedBusiness.name || "Untitled Project",
                  industry: savedBusiness.industry || "other",
                  size: savedBusiness.size || "1-5",
                  updatedAt: savedBusiness.updatedAt || new Date().toISOString(),
                  dataSourceCount: sourceProject?.dataSourceCount ?? 0,
                  scenarioCount: sourceProject?.scenarioCount ?? 0,
                });
                setActiveProject(savedBusiness.id);
                markClean();
                router.replace(`/data?project=${savedBusiness.id}`);
                void loadProjects();
              }}
            />
          </TabsContent>
          <TabsContent value="advanced" className="mt-0">
            <DataBoxGrid
              onPersisted={() => {
                markClean();
                void loadProjects();
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ProjectSwitchGuard
        open={guardOpen}
        onStay={() => {
          setGuardOpen(false);
          setPendingPath(null);
        }}
        onDiscard={handleDiscardAndContinue}
      />
    </div>
  );
}

export default function DataPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading data...</div>}>
      <DataPageContent />
    </Suspense>
  );
}
