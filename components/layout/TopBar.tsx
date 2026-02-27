"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  return (
    <header className="glass-heavy sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.12] px-6">
      <h1 className="text-lg font-semibold text-white/90">{getPageTitle(pathname)}</h1>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white/80">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
