"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { ScenarioVariable } from "@/lib/types";

interface StepSetValuesProps {
  variables: ScenarioVariable[];
  onUpdate: (variableId: string, updates: Partial<ScenarioVariable>) => void;
}

export function StepSetValues({ variables, onUpdate }: StepSetValuesProps) {
  if (variables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-6">
        <p className="text-sm text-muted-foreground">
          No variables to configure. Go back to Step 2 to add variables.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-6 py-4">
      <div>
        <Label className="text-sm font-medium">Set Modified Values</Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Set the base and modified values for each variable.
        </p>
      </div>

      <div className="space-y-3">
        {variables.map((v) => (
          <div
            key={v.variableId}
            className="rounded-lg border border-border p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{v.name}</p>
              <span className="text-xs text-muted-foreground">{v.unit}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Base Value
                </Label>
                <Input
                  type="number"
                  value={v.baseValue}
                  onChange={(e) =>
                    onUpdate(v.variableId, {
                      baseValue: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Modified Value
                </Label>
                <Input
                  type="number"
                  value={v.modifiedValue}
                  onChange={(e) =>
                    onUpdate(v.variableId, {
                      modifiedValue: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            {v.baseValue !== 0 && (
              <div className="text-xs text-muted-foreground">
                Change:{" "}
                <span
                  className={
                    v.modifiedValue >= v.baseValue
                      ? "text-chart-2"
                      : "text-destructive"
                  }
                >
                  {v.modifiedValue >= v.baseValue ? "+" : ""}
                  {(
                    ((v.modifiedValue - v.baseValue) / v.baseValue) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
