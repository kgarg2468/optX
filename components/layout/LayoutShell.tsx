"use client";

import { useUIStore } from "@/lib/store/ui-store";
import { TopBar } from "@/components/layout/TopBar";
import { cn } from "@/lib/utils";
import { useSeedLumina } from "@/lib/hooks/use-seed-lumina";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  useSeedLumina();

  return (
    <div
      className={cn(
        "transition-all duration-300",
        collapsed ? "ml-16" : "ml-64"
      )}
    >
      <TopBar />
      <main className="min-h-[calc(100vh-3.5rem)] p-6">{children}</main>
    </div>
  );
}

