"use client";

import { use } from "react";
import { ArrowLeft, Play, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/simulate">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Scenario Editor
            </h2>
            <p className="text-muted-foreground text-sm">ID: {id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button>
            <Play className="mr-2 h-4 w-4" />
            Run
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <h3 className="font-semibold mb-1">Scenario Graph Editor</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            The full React Flow graph editor will be built in Phase 4. This page
            will feature a drag-and-drop canvas with variable nodes, causal edges,
            and a chat panel.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
