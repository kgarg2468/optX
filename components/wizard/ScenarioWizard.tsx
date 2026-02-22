"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WizardProgress } from "./WizardProgress";
import { StepDescribe } from "./StepDescribe";
import { StepSelectVariables } from "./StepSelectVariables";
import { StepSetValues } from "./StepSetValues";
import { StepReview } from "./StepReview";
import { useScenarioStore } from "@/lib/store/scenario-store";
import type { Scenario, ScenarioVariable } from "@/lib/types";

interface ScenarioWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScenarioWizard({ open, onOpenChange }: ScenarioWizardProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [variables, setVariables] = useState<ScenarioVariable[]>([]);

  const { addScenario } = useScenarioStore();

  const reset = useCallback(() => {
    setStep(0);
    setName("");
    setDescription("");
    setVariables([]);
  }, []);

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) reset();
      onOpenChange(open);
    },
    [onOpenChange, reset]
  );

  const handleAddVariable = useCallback((variable: ScenarioVariable) => {
    setVariables((prev) => [...prev, variable]);
  }, []);

  const handleRemoveVariable = useCallback((variableId: string) => {
    setVariables((prev) => prev.filter((v) => v.variableId !== variableId));
  }, []);

  const handleUpdateVariable = useCallback(
    (variableId: string, updates: Partial<ScenarioVariable>) => {
      setVariables((prev) =>
        prev.map((v) =>
          v.variableId === variableId ? { ...v, ...updates } : v
        )
      );
    },
    []
  );

  const handleParsed = useCallback((parsed: ScenarioVariable[]) => {
    setVariables((prev) => [...prev, ...parsed]);
    setStep(1);
  }, []);

  const handleSave = useCallback(() => {
    const scenario: Scenario = {
      id: crypto.randomUUID(),
      businessId: "",
      name: name || "Untitled Scenario",
      description,
      variables,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addScenario(scenario);
    handleClose(false);
  }, [name, description, variables, addScenario, handleClose]);

  const canNext = () => {
    switch (step) {
      case 0:
        return name.trim().length > 0;
      case 1:
        return true;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>Create Scenario</DialogTitle>
        </DialogHeader>

        <WizardProgress currentStep={step} />

        <div className="min-h-[280px]">
          {step === 0 && (
            <StepDescribe
              name={name}
              description={description}
              onNameChange={setName}
              onDescriptionChange={setDescription}
              onParsed={handleParsed}
            />
          )}
          {step === 1 && (
            <StepSelectVariables
              variables={variables}
              onAdd={handleAddVariable}
              onRemove={handleRemoveVariable}
            />
          )}
          {step === 2 && (
            <StepSetValues
              variables={variables}
              onUpdate={handleUpdateVariable}
            />
          )}
          {step === 3 && (
            <StepReview
              name={name}
              description={description}
              variables={variables}
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </Button>
          <div className="flex gap-2">
            {step < 3 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleSave}>Save Scenario</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
