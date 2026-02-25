"use client";

import { FolderKanban, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProjectSummary } from "@/lib/types";

interface ProjectListViewProps {
  title: string;
  description: string;
  projects: ProjectSummary[];
  isLoading?: boolean;
  error?: string | null;
  createLabel?: string;
  onCreate: () => void;
  onSelect: (projectId: string) => void;
  onRetry?: () => void;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString();
}

export function ProjectListView({
  title,
  description,
  projects,
  isLoading = false,
  error = null,
  createLabel = "Create Project",
  onCreate,
  onSelect,
  onRetry,
}: ProjectListViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <Button onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {createLabel}
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <p className="text-sm text-destructive">{error}</p>
            {onRetry ? (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="mr-2 h-3 w-3" />
                Retry
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Loading projects...
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent mb-3">
              <FolderKanban className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No Projects Yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Create your first project to add data, build scenarios, and run
              simulations.
            </p>
            <Button onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {createLabel}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => onSelect(project.id)}
            >
              <CardHeader>
                <CardTitle className="text-base">{project.name}</CardTitle>
                <CardDescription>
                  {project.industry.replaceAll("_", " ")} • {project.size}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Data Sources</span>
                  <span className="font-medium text-foreground">
                    {project.dataSourceCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Scenarios</span>
                  <span className="font-medium text-foreground">
                    {project.scenarioCount}
                  </span>
                </div>
                <div className="pt-2 text-xs text-muted-foreground">
                  Updated {formatDate(project.updatedAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
