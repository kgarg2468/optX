"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteProjectConfirm } from "@/components/projects/DeleteProjectConfirm";
import type { ProjectSummary } from "@/lib/types";

interface ProjectHeaderProps {
  project: ProjectSummary | null;
  projects: ProjectSummary[];
  onBackToProjects: () => void;
  onSelectProject: (projectId: string) => void;
  onCreateProject?: () => void;
  onRenameProject?: (projectId: string, name: string) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
  isRenaming?: boolean;
  isDeleting?: boolean;
  deleteError?: string | null;
}

export function ProjectHeader({
  project,
  projects,
  onBackToProjects,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  isRenaming = false,
  isDeleting = false,
  deleteError = null,
}: ProjectHeaderProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [nextName, setNextName] = useState("");
  const currentName = project?.name || "New Project";

  const options = useMemo(
    () => projects.map((item) => ({ id: item.id, name: item.name })),
    [projects]
  );

  return (
    <>
      <div className="rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBackToProjects}>
            <ArrowLeft className="mr-2 h-3 w-3" />
            Projects
          </Button>

          <div className="min-w-[220px]">
            <Select
              value={project?.id}
              onValueChange={(value) => onSelectProject(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Switch project" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {onCreateProject ? (
            <Button variant="outline" size="sm" onClick={onCreateProject}>
              <Plus className="mr-2 h-3 w-3" />
              Create
            </Button>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNextName(project?.name || "");
              setRenameOpen(true);
            }}
            disabled={!project || !onRenameProject}
          >
            <Pencil className="mr-2 h-3 w-3" />
            Rename
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            disabled={!project || !onDeleteProject}
          >
            <Trash2 className="mr-2 h-3 w-3" />
            Delete
          </Button>
        </div>

        <div className="mt-3">
          <h2 className="text-xl font-semibold tracking-tight">{currentName}</h2>
          <p className="text-sm text-muted-foreground">
            {project
              ? `${project.industry.replaceAll("_", " ")} • ${project.size}`
              : "Unsaved project draft"}
          </p>
        </div>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Update the project name used in Data and Simulation views.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={nextName}
            onChange={(event) => setNextName(event.target.value)}
            placeholder="Project name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!project || !onRenameProject || isRenaming || !nextName.trim()}
              onClick={async () => {
                if (!project || !onRenameProject) return;
                try {
                  await onRenameProject(project.id, nextName);
                  setRenameOpen(false);
                } catch {
                  // Keep dialog open so user can retry.
                }
              }}
            >
              {isRenaming ? "Saving..." : "Save name"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {project && onDeleteProject && deleteOpen ? (
        <DeleteProjectConfirm
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          projectName={project.name}
          isDeleting={isDeleting}
          error={deleteError}
          onDelete={async () => {
            await onDeleteProject(project.id);
            setDeleteOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
