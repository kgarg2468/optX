"use client";

import { Badge } from "@/components/ui/badge";
import type { ScenarioVariable } from "@/lib/types";

interface StepReviewProps {
  name: string;
  description: string;
  variables: ScenarioVariable[];
}

export function StepReview({ name, description, variables }: StepReviewProps) {
  return (
    <div className="space-y-4 px-6 py-4">
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Scenario Summary</h4>
        <p className="text-xs text-muted-foreground">
          Review before saving.
        </p>
      </div>

      <div className="rounded-lg border border-white/[0.08] p-4 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Name</p>
          <p className="text-sm font-medium">{name || "Untitled Scenario"}</p>
        </div>
        {description && (
          <div>
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="text-sm">{description}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            Variables ({variables.length})
          </p>
          {variables.length > 0 ? (
            <div className="space-y-1.5">
              {variables.map((v) => (
                <div
                  key={v.variableId}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{v.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {v.baseValue} → {v.modifiedValue}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {v.unit}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No variables modified.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
