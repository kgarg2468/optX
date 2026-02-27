"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScenarioVariable } from "@/lib/types";

interface StepDescribeProps {
  name: string;
  description: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onParsed: (variables: ScenarioVariable[]) => void;
}

export function StepDescribe({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onParsed,
}: StepDescribeProps) {
  const [nlpInput, setNlpInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!nlpInput.trim()) return;
    setIsParsing(true);
    setParseError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: nlpInput,
          mode: "parse_scenario",
        }),
      });

      const data = await res.json();

      if (data.parsed) {
        if (data.parsed.name) onNameChange(data.parsed.name);
        if (data.parsed.description) onDescriptionChange(data.parsed.description);

        if (data.parsed.variables?.length) {
          const variables: ScenarioVariable[] = data.parsed.variables.map(
            (v: {
              name: string;
              displayName?: string;
              modifiedValue: number;
              unit?: string;
              category?: string;
            }) => ({
              variableId: crypto.randomUUID(),
              name: v.displayName || v.name,
              baseValue: 0,
              modifiedValue: v.modifiedValue,
              unit: v.unit || "",
              category: v.category,
            })
          );
          onParsed(variables);
        }
      } else {
        setParseError("Could not parse scenario. Try rephrasing.");
      }
    } catch {
      setParseError("Failed to connect to AI service.");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="space-y-5 px-6 py-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="scenario-name">Scenario Name</Label>
          <Input
            id="scenario-name"
            placeholder="e.g., Price Increase Q3"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="scenario-desc">Description</Label>
          <Input
            id="scenario-desc"
            placeholder="Brief description of this what-if scenario"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-white/[0.08] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-lime-400" />
          <Label className="text-sm font-medium">
            Describe with Natural Language
          </Label>
        </div>
        <textarea
          value={nlpInput}
          onChange={(e) => setNlpInput(e.target.value)}
          placeholder='e.g., "What if I raise prices 15% and cut marketing spend by $2000?"'
          rows={3}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {parseError && (
          <p className="text-xs text-destructive">{parseError}</p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleParse}
          disabled={isParsing || !nlpInput.trim()}
        >
          {isParsing ? (
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-3 w-3" />
          )}
          Parse with AI
        </Button>
      </div>
    </div>
  );
}
