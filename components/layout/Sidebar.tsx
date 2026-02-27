"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store/ui-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/", label: "Dashboard", icon: Icons.Dashboard },
  { href: "/data", label: "Data", icon: Icons.Data },
  { href: "/simulate", label: "Simulate", icon: Icons.Simulate },
  { href: "/report", label: "Reports", icon: Icons.Report },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/[0.06] transition-all duration-300",
        "backdrop-blur-[32px] bg-[rgba(13,31,28,0.6)]",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-20 items-center border-b border-white/[0.06]",
          collapsed ? "justify-center px-2" : "px-8"
        )}
      >
        <span
          className={cn(
            "optx-wordmark font-black tracking-[0.15em] uppercase bg-gradient-to-r from-white via-white/90 to-lime-400 bg-clip-text text-transparent",
            collapsed ? "text-lg" : "text-xl"
          )}
        >
          {collapsed ? "O" : "OptX"}
        </span>
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 space-y-1.5 py-8",
          collapsed ? "px-2" : "px-4"
        )}
      >
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            const link = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-xl transition-all duration-300",
                  collapsed
                    ? "justify-center px-0 py-3"
                    : "gap-4 px-4 py-3",
                  "text-xs font-bold uppercase tracking-widest",
                  isActive
                    ? "sidebar-item-active text-lime-400"
                    : "text-white/40 hover:text-white/80 hover:bg-white/5"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-emerald-400" : "text-white/40"
                  )}
                />
                {!collapsed && item.label}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return link;
          })}
        </TooltipProvider>
      </nav>

      {/* Settings + Collapse toggle */}
      <div
        className={cn(
          "border-t border-white/[0.06]",
          collapsed ? "p-2" : "p-6"
        )}
      >
        <TooltipProvider delayDuration={0}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/settings"
                  className="flex items-center justify-center rounded-xl px-0 py-3 text-xs font-bold uppercase tracking-widest text-white/40 transition-all duration-300 hover:bg-white/5 hover:text-white/80"
                >
                  <Icons.Settings className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Settings
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/settings"
              className="flex items-center gap-4 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/40 transition-all duration-300 hover:bg-white/5 hover:text-white/80"
            >
              <Icons.Settings className="h-4 w-4" />
              Settings
            </Link>
          )}

          {/* Info link */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/how-it-works"
                  className="flex items-center justify-center rounded-xl px-0 py-3 text-xs font-bold uppercase tracking-widest text-white/40 transition-all duration-300 hover:bg-white/5 hover:text-white/80"
                >
                  <Icons.Info className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Info
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/how-it-works"
              className="flex items-center gap-4 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/40 transition-all duration-300 hover:bg-white/5 hover:text-white/80"
            >
              <Icons.Info className="h-4 w-4" />
              Info
            </Link>
          )}

          {/* Collapse toggle */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSidebar}
                  className="flex w-full items-center justify-center rounded-xl px-0 py-3 mt-1.5 text-white/30 transition-all duration-300 hover:bg-white/5 hover:text-white/60"
                >
                  <Icons.ChevronRightDouble className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Expand sidebar
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={toggleSidebar}
              className="flex w-full items-center gap-4 rounded-xl px-4 py-3 mt-1.5 text-xs font-bold uppercase tracking-widest text-white/30 transition-all duration-300 hover:bg-white/5 hover:text-white/60"
            >
              <Icons.ChevronLeftDouble className="h-4 w-4" />
              Collapse
            </button>
          )}
        </TooltipProvider>
      </div>
    </aside>
  );
}
