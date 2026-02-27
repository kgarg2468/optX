"use client";

import { Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { NODE_CONFIGS } from "@/lib/utils/node-config";
import type { GraphNode } from "@/lib/types";

interface ConfigPanelProps {
  node: GraphNode | null;
  onUpdate: (id: string, updates: Partial<GraphNode>) => void;
  onDelete: (id: string) => void;
}

export function ConfigPanel({ node, onUpdate, onDelete }: ConfigPanelProps) {
  if (!node) {
    return (
      <div className="flex h-full w-80 flex-col glass-card rounded-none border-l border-white/[0.08]">
        <div className="flex items-center gap-2 border-b border-white/[0.08] px-4 py-3">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Properties</h3>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Select a node to edit its properties.
          </p>
        </div>
      </div>
    );
  }

  const config = NODE_CONFIGS[node.data.type];
  const Icon = config.icon;

  return (
    <div className="flex h-full w-80 flex-col glass-card rounded-none border-l border-white/[0.08]">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.textClass}`} />
          <h3 className="text-sm font-medium">{config.label} Node</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(node.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="node-label" className="text-xs">
            Label
          </Label>
          <Input
            id="node-label"
            value={node.data.label}
            onChange={(e) =>
              onUpdate(node.id, {
                data: { ...node.data, label: e.target.value },
              })
            }
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="node-value" className="text-xs">
            Value
          </Label>
          <Input
            id="node-value"
            type="number"
            value={node.data.value ?? ""}
            onChange={(e) =>
              onUpdate(node.id, {
                data: {
                  ...node.data,
                  value: e.target.value ? parseFloat(e.target.value) : undefined,
                },
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="node-unit" className="text-xs">
            Unit
          </Label>
          <Input
            id="node-unit"
            value={node.data.unit ?? ""}
            placeholder="e.g., $, %, units"
            onChange={(e) =>
              onUpdate(node.id, {
                data: { ...node.data, unit: e.target.value },
              })
            }
          />
        </div>

        <Separator />

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Node ID</p>
          <p className="text-xs font-mono text-muted-foreground/70">
            {node.id}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Position</p>
          <p className="text-xs font-mono text-muted-foreground/70">
            x: {Math.round(node.position.x)}, y: {Math.round(node.position.y)}
          </p>
        </div>
      </div>
    </div>
  );
}
