"use client";

import { usePathname } from "next/navigation";
import { Bell, FolderKanban, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjectStore } from "@/lib/store/project-store";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/data": "Data Ingestion",
  "/simulate": "Simulation",
  "/report": "Reports",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/scenario/")) return "Scenario Editor";
  if (pathname.startsWith("/report/")) return "Report";
  return "OptX";
}

export function TopBar() {
  const pathname = usePathname();
  const { projects, activeProjectId, setActiveProject, loadProjects } =
    useProjectStore();

  const activeProject = activeProjectId
    ? projects.find((p) => p.id === activeProjectId)
    : null;

  return (
    <header className="glass-heavy sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.12] px-6">
      <h1 className="text-lg font-semibold text-white/90">{getPageTitle(pathname)}</h1>
      <div className="flex items-center gap-3">
        {/* Active project indicator */}
        <div className="flex items-center gap-2">
          {activeProject ? (
            <>
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-emerald-400 text-[10px] px-2 py-0.5"
              >
                <FolderKanban className="h-3 w-3 mr-1" />
                Active
              </Badge>
              <Select
                value={activeProjectId || ""}
                onValueChange={(value) => setActiveProject(value)}
              >
                <SelectTrigger className="h-8 w-[180px] text-xs border-white/[0.08] bg-white/[0.03]">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : (
            <Link href="/data">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <FolderKanban className="h-3 w-3" />
                Select Project
              </Button>
            </Link>
          )}
        </div>

        <div className="h-4 w-px bg-white/[0.08]" />

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white/80">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
