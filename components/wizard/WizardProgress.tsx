"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
  { label: "Describe", step: 0 },
  { label: "Variables", step: 1 },
  { label: "Values", step: 2 },
  { label: "Review", step: 3 },
];

interface WizardProgressProps {
  currentStep: number;
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <div className="flex items-center gap-1 px-6 py-4">
      {STEPS.map(({ label, step }, i) => (
        <div key={step} className="flex items-center gap-1 flex-1">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors",
                step < currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : step === currentStep
                    ? "border-primary text-primary"
                    : "border-muted-foreground/30 text-muted-foreground/50"
              )}
            >
              {step < currentStep ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                step + 1
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium whitespace-nowrap",
                step <= currentStep
                  ? "text-foreground"
                  : "text-muted-foreground/50"
              )}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "mx-2 h-px flex-1",
                step < currentStep ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
