"use client";

import { useState, useEffect, useCallback } from "react";
import { ScenarioSelectionView } from "@/components/simulation/ScenarioSelectionView";
import { ScenarioExplorationView } from "@/components/simulation/ScenarioExplorationView";
import { useProjectStore } from "@/lib/store/project-store";
import {
  LUMINA_BUSINESS_ID,
  LUMINA_SCENARIOS,
  LUMINA_SCENARIO_DETAIL_MAP,
} from "@/lib/seed/lumina-seed";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderKanban, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import type { ScenarioDetail } from "@/lib/types";

export default function SimulatePage() {
  const { activeProjectId, projects } = useProjectStore();
  const activeProject = activeProjectId
    ? projects.find((p) => p.id === activeProjectId)
    : null;

  const [scenarios, setScenarios] = useState<ScenarioDetail[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load scenarios when active project changes
  useEffect(() => {
    if (!activeProjectId) {
      setScenarios([]);
      setSelectedScenarioId(null);
      return;
    }

    // For Lumina, use instant seed data
    if (activeProjectId === LUMINA_BUSINESS_ID) {
      setScenarios(LUMINA_SCENARIOS);
      return;
    }

    // For other projects, fetch from API
    setIsLoading(true);
    setError(null);
    fetch(`/api/scenario?businessId=${activeProjectId}`)
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success && Array.isArray(payload.data)) {
          // Transform DB scenarios to ScenarioDetail format if they have graph_state with scenario_detail
          const transformed: ScenarioDetail[] = payload.data
            .map((row: Record<string, unknown>) => {
              // If the scenario has stored scenario_detail, use that
              const detail = (row as { scenario_detail?: ScenarioDetail }).scenario_detail;
              if (detail) return detail;

              // Otherwise build a minimal ScenarioDetail from the DB row
              return {
                id: String(row.id),
                title: String(row.name || "Untitled"),
                tag: "Custom",
                description: String(row.description || ""),
                recommended: false,
                revenueImpact: "N/A",
                costImpact: "N/A",
                confidence: 75,
                timeToImpact: "TBD",
                riskLevel: "Medium" as const,
                netProfitImpact: "N/A",
                keyMetrics: [],
                sparkline: [],
                nodes: [],
                edges: [],
              } satisfies ScenarioDetail;
            })
            .filter((s: ScenarioDetail) => s.nodes.length > 0 || s.title !== "Untitled");
          setScenarios(transformed);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [activeProjectId]);

  const handleGenerateScenarios = useCallback(async () => {
    if (!activeProjectId) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/scenario/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: activeProjectId }),
      });
      const payload = await res.json();

      if (payload.success && Array.isArray(payload.scenarios)) {
        const newScenarios: ScenarioDetail[] = payload.scenarios.map(
          (s: ScenarioDetail & { dbRow?: Record<string, unknown> }) => ({
            ...s,
            id: s.dbRow?.id ? String(s.dbRow.id) : s.id || crypto.randomUUID(),
          })
        );
        setScenarios((prev) => [...prev, ...newScenarios]);
      } else {
        setError(payload.error || "Failed to generate scenarios");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }, [activeProjectId]);

  const selectedScenario = selectedScenarioId
    ? scenarios.find((s) => s.id === selectedScenarioId) ?? null
    : null;

  // No project selected
  if (!activeProjectId || !activeProject) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05] mb-3">
              <FolderKanban className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No Project Selected</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Select a project to view its simulations and scenarios, or create a
              new one to get started.
            </p>
            <Link href="/data">
              <Button className="bg-lime-400 text-forest-950 hover:bg-lime-300">
                <FolderKanban className="mr-2 h-4 w-4" />
                Go to Projects
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Scenario exploration view
  if (selectedScenario) {
    return (
      <ScenarioExplorationView
        scenario={selectedScenario}
        businessId={activeProjectId}
        onBack={() => setSelectedScenarioId(null)}
      />
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading scenarios...</p>
        </div>
      </div>
    );
  }

  // Scenario selection view
  return (
    <ScenarioSelectionView
      scenarios={scenarios}
      businessName={activeProject.name}
      businessTagline={`${activeProject.industry.replaceAll("_", " ")} · ${activeProject.size}`}
      onExplore={setSelectedScenarioId}
      onGenerate={handleGenerateScenarios}
      isGenerating={isGenerating}
      error={error}
    />
  );
}
