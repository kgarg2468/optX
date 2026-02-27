"use client";

import { useState } from "react";
import { ScenarioSelectionView } from "@/components/simulation/ScenarioSelectionView";
import { ScenarioExplorationView } from "@/components/simulation/ScenarioExplorationView";
import { MOCK_SCENARIOS } from "@/lib/mock/simulation-scenarios";

export default function SimulatePage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  const selectedScenario = selectedScenarioId
    ? MOCK_SCENARIOS.find((s) => s.id === selectedScenarioId) ?? null
    : null;

  if (selectedScenario) {
    return (
      <ScenarioExplorationView
        scenario={selectedScenario}
        onBack={() => setSelectedScenarioId(null)}
      />
    );
  }

  return <ScenarioSelectionView onExplore={setSelectedScenarioId} />;
}
