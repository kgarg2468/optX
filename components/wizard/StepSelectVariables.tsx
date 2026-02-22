"use client";

import { Label } from "@/components/ui/label";
import type { ScenarioVariable } from "@/lib/types";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface StepSelectVariablesProps {
  variables: ScenarioVariable[];
  onAdd: (variable: ScenarioVariable) => void;
  onRemove: (variableId: string) => void;
}

export function StepSelectVariables({
  variables,
  onAdd,
  onRemove,
}: StepSelectVariablesProps) {
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd({
      variableId: crypto.randomUUID(),
      name: newName.trim(),
      baseValue: 0,
      modifiedValue: 0,
      unit: newUnit.trim() || "units",
    });
    setNewName("");
    setNewUnit("");
  };

  return (
    <div className="space-y-4 px-6 py-4">
      <div>
        <Label className="text-sm font-medium">Selected Variables</Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Variables that will be modified in this scenario.
          {variables.length > 0 && ` ${variables.length} selected.`}
        </p>
      </div>

      {variables.length > 0 ? (
        <div className="space-y-2">
          {variables.map((v) => (
            <div
              key={v.variableId}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{v.name}</p>
                <p className="text-xs text-muted-foreground">{v.unit}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onRemove(v.variableId)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-center rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            No variables selected. Add variables manually or use AI parsing in
            Step 1.
          </p>
        </div>
      )}

      <div className="flex items-end gap-2 pt-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor="var-name" className="text-xs">
            Variable Name
          </Label>
          <Input
            id="var-name"
            placeholder="e.g., Monthly Revenue"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <div className="w-24 space-y-1">
          <Label htmlFor="var-unit" className="text-xs">
            Unit
          </Label>
          <Input
            id="var-unit"
            placeholder="$, %, etc."
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleAdd}
          disabled={!newName.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
